const crypto = require('crypto');
const fsSync = require('fs');
const fs = require('fs/promises');
const path = require('path');
const mysql = require('mysql2/promise');

const APPLY_CHANGES = process.argv.includes('--apply');
const REPORT_DIR = path.join(process.cwd(), 'reports');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'wordpress');
const LOCAL_PUBLIC_PREFIX = '/uploads/wordpress/';
const splitPattern = /[\n\r,;|]+/;
const imageUrlPattern = /(?:https?:\/\/|\/)[^\s"'<>]+\.(?:jpe?g|png|webp|gif|bmp|svg)(?:\?[^\s"'<>]*)?/gi;
const imageExtensionPattern = /\.(jpe?g|png|webp|gif|bmp|svg)(?=$|[?#])/i;
const sizeSuffixPattern = /-\d+x\d+(?=\.(jpe?g|png|webp|gif|bmp|svg)(\?|#|$))/i;

function loadEnvFile(filePath) {
  if (!fsSync.existsSync(filePath)) {
    return;
  }

  const content = fsSync.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (!key || key in process.env) {
      return;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'partemaquinassitio',
    port: Number(process.env.DB_PORT || 3306),
  };
}

function normalizeUrl(value) {
  return String(value || '')
    .trim()
    .replace(/^http:\/\//i, 'https://')
    .replace(sizeSuffixPattern, '');
}

function parseDelimited(value) {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  return String(value)
    .replace(/,(?=\S)/g, ', ')
    .split(splitPattern)
    .map(item => item.trim())
    .filter(Boolean);
}

function extractUrlsFromText(value) {
  if (!value) return [];
  return [...String(value).matchAll(imageUrlPattern)].map(match => normalizeUrl(match[0]));
}

function canonicalImageKey(value) {
  return normalizeUrl(value)
    .split('?')[0]
    .split('#')[0]
    .toLowerCase();
}

function isImageUrl(value) {
  return imageExtensionPattern.test(normalizeUrl(value));
}

function isLocalUpload(value) {
  return normalizeUrl(value).startsWith('/uploads/');
}

function contentTypeToExtension(contentType) {
  const type = String(contentType || '').toLowerCase();
  if (type.includes('jpeg')) return '.jpg';
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  if (type.includes('gif')) return '.gif';
  if (type.includes('bmp')) return '.bmp';
  if (type.includes('svg')) return '.svg';
  return '.jpg';
}

function buildLocalFileName(sourceUrl, contentType) {
  const url = new URL(sourceUrl);
  const originalName = path.basename(url.pathname).replace(sizeSuffixPattern, '');
  const originalExt = path.extname(originalName);
  const baseName = path
    .basename(originalName, originalExt)
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 60) || 'imagen';
  const ext = originalExt || contentTypeToExtension(contentType);
  const hash = crypto.createHash('sha1').update(canonicalImageKey(sourceUrl)).digest('hex').slice(0, 12);
  return `${baseName}-${hash}${ext}`;
}

function buildLocalUrl(fileName) {
  return `${LOCAL_PUBLIC_PREFIX}${fileName}`;
}

function replaceImageUrlsInText(value, urlMap) {
  if (!value) return value;
  return String(value).replace(imageUrlPattern, match => urlMap.get(canonicalImageKey(match)) || match);
}

async function downloadImage(sourceUrl, targetPath) {
  const response = await fetch(sourceUrl, { redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`No se pudo descargar ${sourceUrl}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(targetPath, buffer);
}

async function main() {
  const db = await mysql.createConnection(getDbConfig());
  const [rows] = await db.query('SELECT id, nombre, imagenes, descripcion_corta, descripcion FROM productos ORDER BY id ASC');

  await fs.mkdir(REPORT_DIR, { recursive: true });
  if (APPLY_CHANGES) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }

  const urlMap = new Map();
  const downloadCache = new Map();
  const updates = [];
  const report = {
    generatedAt: new Date().toISOString(),
    applied: APPLY_CHANGES,
    summary: {
      products: rows.length,
      productsUpdated: 0,
      remoteImagesFound: 0,
      imagesDownloaded: 0,
      descriptionUrlsRewritten: 0,
      skippedLocalImages: 0,
      failures: 0,
    },
    failures: [],
    updatedProducts: [],
  };

  for (const row of rows) {
    const currentImages = parseDelimited(row.imagenes);
    const nextImages = [];
    let rowChanged = false;

    const sourceUrls = [
      ...currentImages,
      ...extractUrlsFromText(row.descripcion_corta),
      ...extractUrlsFromText(row.descripcion),
    ].filter(value => isImageUrl(value) || isLocalUpload(value));

    for (const source of sourceUrls) {
      const normalized = normalizeUrl(source);
      if (!normalized) continue;

      if (isLocalUpload(normalized)) {
        continue;
      }

      if (!isImageUrl(normalized)) {
        continue;
      }

      report.summary.remoteImagesFound += 1;
      const key = canonicalImageKey(normalized);
      let localUrl = urlMap.get(key);

      if (!localUrl) {
        const tempResponse = await fetch(normalized, { method: 'HEAD', redirect: 'follow' }).catch(() => null);
        const contentType = tempResponse?.headers?.get?.('content-type') || '';
        const fileName = buildLocalFileName(normalized, contentType);
        localUrl = buildLocalUrl(fileName);

        if (APPLY_CHANGES) {
          const targetPath = path.join(UPLOAD_DIR, fileName);
          if (!downloadCache.has(key)) {
            try {
              await downloadImage(normalized, targetPath);
              downloadCache.set(key, targetPath);
              urlMap.set(key, localUrl);
              report.summary.imagesDownloaded += 1;
            } catch (error) {
              report.summary.failures += 1;
              report.failures.push({ sourceUrl: normalized, message: error.message });
              continue;
            }
          } else {
            urlMap.set(key, localUrl);
          }
        } else {
          urlMap.set(key, localUrl);
        }
      }
    }

    for (const image of currentImages) {
      const normalized = normalizeUrl(image);
      if (!normalized) continue;

      if (isLocalUpload(normalized)) {
        nextImages.push(normalized);
        continue;
      }

      if (!isImageUrl(normalized)) {
        nextImages.push(normalized);
        continue;
      }

      const mapped = urlMap.get(canonicalImageKey(normalized));
      if (mapped && mapped !== normalized) {
        rowChanged = true;
        nextImages.push(mapped);
      } else {
        nextImages.push(normalized);
      }
    }

    const nextDescripcionCorta = replaceImageUrlsInText(row.descripcion_corta || '', urlMap);
    const nextDescripcion = replaceImageUrlsInText(row.descripcion || '', urlMap);

    if (nextDescripcionCorta !== (row.descripcion_corta || '')) {
      rowChanged = true;
      report.summary.descriptionUrlsRewritten += 1;
    }

    if (nextDescripcion !== (row.descripcion || '')) {
      rowChanged = true;
      report.summary.descriptionUrlsRewritten += 1;
    }

    if (rowChanged) {
      updates.push({
        id: row.id,
        nombre: row.nombre,
        imagenes: nextImages.join(', '),
        descripcion_corta: nextDescripcionCorta,
        descripcion: nextDescripcion,
      });
      report.updatedProducts.push({
        id: row.id,
        nombre: row.nombre,
        imageCount: nextImages.length,
      });
    }
  }

  if (APPLY_CHANGES && updates.length > 0) {
    await db.beginTransaction();
    try {
      for (const update of updates) {
        await db.execute(
          'UPDATE productos SET imagenes = ?, descripcion_corta = ?, descripcion = ? WHERE id = ?',
          [update.imagenes, update.descripcion_corta, update.descripcion, update.id]
        );
      }
      await db.commit();
      report.summary.productsUpdated = updates.length;
    } catch (error) {
      await db.rollback();
      throw error;
    }
  }

  const reportPath = path.join(REPORT_DIR, 'image-migration.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Reporte guardado en ${reportPath}`);

  await db.end();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});