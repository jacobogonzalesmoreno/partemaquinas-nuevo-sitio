const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const WP_API_BASE = 'https://partemaquinas.com/wp-json/wp/v2';
const OUTPUT_DIR = path.join(process.cwd(), 'reports');
const splitPattern = /[\n\r,;|]+/;
const imageUrlPattern = /https:\/\/partemaquinas\.com\/wp-content\/uploads\/[^\s"'<>]+\.(?:jpe?g|png|webp|gif|bmp|svg)(?:\?[^\s"'<>]*)?/gi;
const sizeSuffixPattern = /-\d+x\d+(?=\.(jpe?g|png|webp|gif|bmp|svg)(\?|#|$))/i;
const imageExtensionPattern = /\.(jpe?g|png|webp|gif|bmp|svg)(\?|#|$)/i;

const htmlEntityMap = {
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
};

function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'partemaquinassitio',
    port: Number(process.env.DB_PORT || 3306),
  };
}

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeImageUrl(url) {
  return String(url || '').replace(sizeSuffixPattern, '').trim();
}

function imageBasename(url) {
  const clean = normalizeImageUrl(url).split('?')[0].split('#')[0];
  const segments = clean.split('/').filter(Boolean);
  return segments[segments.length - 1] || '';
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&(amp|quot|lt|gt|nbsp|#039);/g, entity => htmlEntityMap[entity] || entity);
}

function parseLocalImages(value) {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);

  const raw = String(value).replace(/,(?=https?:\/\/)/g, ', ');

  return raw
    .split(splitPattern)
    .map(v => normalizeImageUrl(String(v).trim()))
    .filter(Boolean);
}

function parseLocalCategories(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  return String(value)
    .split(splitPattern)
    .map(v => String(v).trim())
    .filter(Boolean);
}

function extractWpImages(product) {
  const contentHtml = String(product?.content?.rendered || '');
  const matches = contentHtml.match(imageUrlPattern) || [];
  const unique = [];
  const seen = new Set();

  const featuredMedia = ((product?._embedded || {})['wp:featuredmedia'] || [])[0];
  const featuredSource = normalizeImageUrl(featuredMedia?.source_url || '').split('?')[0].split('#')[0];

  if (featuredSource && imageExtensionPattern.test(featuredSource)) {
    seen.add(featuredSource.toLowerCase());
    unique.push(featuredSource);
  }

  for (const url of matches) {
    const normalized = normalizeImageUrl(url).split('?')[0].split('#')[0];
    if (!normalized || normalized.includes('/thumb/')) continue;
    if (!imageExtensionPattern.test(normalized)) continue;
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }

  return unique;
}

function sameStringSet(left, right, normalizer = normalizeText) {
  const leftSet = new Set(left.map(normalizer).filter(Boolean));
  const rightSet = new Set(right.map(normalizer).filter(Boolean));
  if (leftSet.size !== rightSet.size) return false;
  for (const item of leftSet) {
    if (!rightSet.has(item)) return false;
  }
  return true;
}

function sanitizeWpTitle(value) {
  return decodeHtmlEntities(String(value || '')).trim();
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`No se pudo consultar ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchAllWpCategories() {
  const categories = await fetchJson(`${WP_API_BASE}/product_cat?per_page=100&page=1`);
  return categories;
}

async function fetchAllWpProducts() {
  const firstResponse = await fetch(`${WP_API_BASE}/product?per_page=100&page=1&_embed=wp:featuredmedia`);
  if (!firstResponse.ok) {
    throw new Error(`No se pudo consultar productos WordPress: ${firstResponse.status}`);
  }

  const totalPages = Number(firstResponse.headers.get('x-wp-totalpages') || 1);
  const firstPage = await firstResponse.json();
  const products = [...firstPage];

  for (let page = 2; page <= totalPages; page += 1) {
    const pageItems = await fetchJson(`${WP_API_BASE}/product?per_page=100&page=${page}&_embed=wp:featuredmedia`);
    products.push(...pageItems);
  }

  return products;
}

function buildCategoryLookup(categories) {
  const map = new Map();
  for (const category of categories) {
    map.set(category.id, category);
  }
  return map;
}

function resolveCategoryNames(categoryIds, categoryMap) {
  const names = [];
  const seen = new Set();

  for (const categoryId of categoryIds || []) {
    let current = categoryMap.get(categoryId);
    while (current) {
      const normalized = normalizeText(current.name);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        names.unshift(current.name);
      }
      current = current.parent ? categoryMap.get(current.parent) : null;
    }
  }

  return names;
}

function buildUpdate(row, wpProduct, categoryNames, wpImages) {
  const localCategories = parseLocalCategories(row.categorias);
  const localImages = parseLocalImages(row.imagenes);
  const localImageNames = localImages.map(image => normalizeImageUrl(image).toLowerCase()).filter(Boolean);
  const wpImageNames = wpImages.map(image => normalizeImageUrl(image).toLowerCase()).filter(Boolean);
  const fields = {};
  const reasons = [];

  const wpTitle = sanitizeWpTitle(wpProduct.title?.rendered || '');
  if (String(row.nombre || '').trim() !== wpTitle) {
    fields.nombre = wpTitle;
    reasons.push('nombre');
  }

  if (categoryNames.length > 0 && !sameStringSet(localCategories, categoryNames)) {
    fields.categorias = categoryNames.join(', ');
    reasons.push('categorias');
  }

  if (wpImages.length > 0 && !sameStringSet(localImageNames, wpImageNames, value => String(value || '').toLowerCase())) {
    fields.imagenes = wpImages.join(', ');
    reasons.push('imagenes');
  }

  return { fields, reasons, localCategories, localImages };
}

async function main() {
  const apply = process.argv.includes('--apply');
  ensureOutputDir();

  const db = await mysql.createConnection(getDbConfig());

  try {
    const [countRows] = await db.query('SELECT COUNT(*) AS total FROM productos');
    const localTotal = countRows?.[0]?.total || 0;
    const [rows] = await db.query('SELECT id, nombre, categorias, imagenes FROM productos');
    const localById = new Map(rows.map(row => [Number(row.id), row]));

    const [wpCategories, wpProducts] = await Promise.all([
      fetchAllWpCategories(),
      fetchAllWpProducts(),
    ]);

    const categoryMap = buildCategoryLookup(wpCategories);
    const updates = [];
    const unmatchedWp = [];
    const seenLocalIds = new Set();

    for (const wpProduct of wpProducts) {
      const localRow = localById.get(Number(wpProduct.id));
      if (!localRow) {
        unmatchedWp.push({ id: wpProduct.id, slug: wpProduct.slug, nombre: wpProduct.title?.rendered || '' });
        continue;
      }

      seenLocalIds.add(Number(localRow.id));
      const categoryNames = resolveCategoryNames(wpProduct.product_cat || [], categoryMap);
      const wpImages = extractWpImages(wpProduct);
      const { fields, reasons, localCategories, localImages } = buildUpdate(localRow, wpProduct, categoryNames, wpImages);

      if (Object.keys(fields).length > 0) {
        updates.push({
          id: Number(localRow.id),
          slug: wpProduct.slug,
          localNombre: localRow.nombre,
          wpNombre: sanitizeWpTitle(wpProduct.title?.rendered || ''),
          localCategorias: localCategories,
          wpCategorias: categoryNames,
          localImagenes: localImages,
          wpImagenes: wpImages,
          reasons,
          fields,
        });
      }
    }

    const unmatchedLocal = rows
      .filter(row => !seenLocalIds.has(Number(row.id)))
      .map(row => ({ id: Number(row.id), nombre: row.nombre }));

    const summary = {
      localTotal,
      wpTotal: wpProducts.length,
      wpCategoriesTotal: wpCategories.length,
      updatesPlanned: updates.length,
      unmatchedWp: unmatchedWp.length,
      unmatchedLocal: unmatchedLocal.length,
    };

    fs.writeFileSync(path.join(OUTPUT_DIR, 'wordpress-sync-summary.json'), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'wordpress-sync-updates.json'), JSON.stringify(updates, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'wordpress-sync-unmatched-wp.json'), JSON.stringify(unmatchedWp, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'wordpress-sync-unmatched-local.json'), JSON.stringify(unmatchedLocal, null, 2));

    const csvLines = [
      'id,slug,reasons,local_nombre,wp_nombre,local_categorias,wp_categorias,local_imagenes_count,wp_imagenes_count',
      ...updates.map(update => [
        update.id,
        `"${String(update.slug).replace(/"/g, '""')}"`,
        `"${update.reasons.join('|')}"`,
        `"${String(update.localNombre).replace(/"/g, '""')}"`,
        `"${String(update.wpNombre).replace(/"/g, '""')}"`,
        `"${update.localCategorias.join('|').replace(/"/g, '""')}"`,
        `"${update.wpCategorias.join('|').replace(/"/g, '""')}"`,
        update.localImagenes.length,
        update.wpImagenes.length,
      ].join(',')),
    ];
    fs.writeFileSync(path.join(OUTPUT_DIR, 'wordpress-sync-updates.csv'), csvLines.join('\n'));

    console.log('Resumen:', summary);
    console.log('Reportes escritos en reports/wordpress-sync-*.json y reports/wordpress-sync-updates.csv');

    if (!apply) {
      console.log('Modo preview. Usa --apply para ejecutar los cambios en MySQL.');
      return;
    }

    if (updates.length === 0) {
      console.log('No hay cambios para aplicar.');
      return;
    }

    await db.beginTransaction();

    try {
      for (const update of updates) {
        const columns = Object.keys(update.fields);
        const assignments = columns.map(column => `${column} = ?`).join(', ');
        const values = columns.map(column => update.fields[column]);
        values.push(update.id);
        await db.query(`UPDATE productos SET ${assignments} WHERE id = ?`, values);
      }

      await db.commit();
      console.log(`Cambios aplicados: ${updates.length} productos actualizados.`);
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } finally {
    await db.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});