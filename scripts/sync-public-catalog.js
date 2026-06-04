const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const BASE_URL = 'https://partemaquinas.com';
const PRODUCTS_API = `${BASE_URL}/wp-json/wc/store/products`;
const PAGE_SIZE = 100;
const CONCURRENCY = 4;

const APPLY_CHANGES = process.argv.includes('--apply');

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function foldAccents(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeKey(value).replace(/\s+/g, '-');
}

function canonicalUrl(value) {
  return String(value || '').trim().replace(/^http:\/\//i, 'https://');
}

function parseDelimited(value) {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
  return String(value)
    .split(/[\n\r,;|]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeList(values) {
  return [...new Set(values.map(item => normalizeKey(item)).filter(Boolean))].sort();
}

function sameOrderedList(left, right) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (canonicalUrl(left[index]) !== canonicalUrl(right[index])) return false;
  }
  return true;
}

function levenshtein(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const temp = previous[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + cost
      );
      diagonal = temp;
    }
  }
  return previous[b.length];
}

function extractPublicImages(html) {
  const images = [];

  const mainMatch = html.match(/<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/i);
  if (mainMatch) {
    images.push(canonicalUrl(mainMatch[1]));
  } else {
    const ogMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogMatch) {
      images.push(canonicalUrl(ogMatch[1]));
    }
  }

  const thumbnailMatches = [...html.matchAll(/<div[^>]+class="[^"]*bwg-item2[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/gi)]
    .map(match => canonicalUrl(match[1].replace('/thumb/', '/')));

  for (const url of thumbnailMatches) {
    images.push(url);
  }

  if (images.length <= 1) {
    const attachmentMatches = [...html.matchAll(/<a[^>]+href=['"][^'"]*attachment_id=\d+[^'"]*['"][^>]*>[\s\S]*?<img[^>]+src=['"]([^'"]+)['"]/gi)]
      .map(match => canonicalUrl(match[1]));
    for (const url of attachmentMatches) {
      if (!images.includes(url)) {
        images.push(url);
      }
    }
  }

  return images.filter(Boolean);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed ${response.status} for ${url}`);
  }
  return response.text();
}

async function fetchAllPublicProducts() {
  const products = [];
  let page = 1;

  while (true) {
    const url = `${PRODUCTS_API}?per_page=${PAGE_SIZE}&page=${page}`;
    const data = await fetchJson(url);
    if (!Array.isArray(data) || data.length === 0) {
      break;
    }
    products.push(...data);
    if (data.length < PAGE_SIZE) {
      break;
    }
    page += 1;
  }

  return products;
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker());
  await Promise.all(runners);
  return results;
}

function buildLocalLookup(rows) {
  const bySku = new Map();
  const bySlug = new Map();
  const byName = new Map();

  for (const row of rows) {
    const skuKey = normalizeKey(row.sku);
    const slugKey = slugify(row.nombre);
    const nameKey = normalizeKey(row.nombre);
    if (skuKey) {
      const list = bySku.get(skuKey) || [];
      list.push(row);
      bySku.set(skuKey, list);
    }
    if (slugKey) {
      const list = bySlug.get(slugKey) || [];
      list.push(row);
      bySlug.set(slugKey, list);
    }
    if (nameKey) {
      const list = byName.get(nameKey) || [];
      list.push(row);
      byName.set(nameKey, list);
    }
  }

  return { bySku, bySlug, byName };
}

function chooseBestCandidate(publicProduct, candidates) {
  const publicNameFolded = foldAccents(publicProduct.name);
  const publicSlugFolded = foldAccents(publicProduct.slug || publicProduct.name);

  const scored = candidates.map(row => {
    const localNameFolded = foldAccents(row.nombre);
    const localSlugFolded = foldAccents(slugify(row.nombre));
    const nameDistance = levenshtein(publicNameFolded, localNameFolded);
    const slugDistance = levenshtein(publicSlugFolded, localSlugFolded);
    const exactName = publicNameFolded === localNameFolded ? 0 : 1;
    const exactSlug = publicSlugFolded === localSlugFolded ? 0 : 1;
    const exactSku = normalizeKey(publicProduct.sku) && normalizeKey(publicProduct.sku) === normalizeKey(row.sku) ? 0 : 1;
    const score = (exactSku * 1000) + (exactSlug * 100) + (exactName * 50) + nameDistance + slugDistance;
    return { row, score, nameDistance, slugDistance, exactSku, exactSlug, exactName };
  });

  scored.sort((left, right) => {
    if (left.score !== right.score) return left.score - right.score;
    if (left.nameDistance !== right.nameDistance) return left.nameDistance - right.nameDistance;
    if (left.slugDistance !== right.slugDistance) return left.slugDistance - right.slugDistance;
    return left.row.id - right.row.id;
  });

  return scored[0] || null;
}

function resolveLocalProduct(publicProduct, localLookup, usedLocalIds) {
  const keys = [];
  const skuKey = normalizeKey(publicProduct.sku);
  const slugKey = slugify(publicProduct.slug || publicProduct.name);
  const nameKey = normalizeKey(publicProduct.name);

  const candidateSets = [];
  if (skuKey && localLookup.bySku.has(skuKey)) candidateSets.push(...localLookup.bySku.get(skuKey));
  if (slugKey && localLookup.bySlug.has(slugKey)) candidateSets.push(...localLookup.bySlug.get(slugKey));
  if (nameKey && localLookup.byName.has(nameKey)) candidateSets.push(...localLookup.byName.get(nameKey));

  const unique = [...new Map(candidateSets.map(row => [row.id, row])).values()]
    .filter(row => !usedLocalIds.has(row.id));

  if (unique.length > 0) {
    const best = chooseBestCandidate(publicProduct, unique);
    if (best) {
      const exactSku = skuKey && normalizeKey(best.row.sku) === skuKey;
      const exactSlug = slugKey && slugify(best.row.nombre) === slugKey;
      const exactName = nameKey && normalizeKey(best.row.nombre) === nameKey;
      return {
        row: best.row,
        method: exactSku ? 'sku' : (exactSlug ? 'slug' : (exactName ? 'name' : 'fuzzy')),
        ambiguous: unique.length > 1,
        candidates: unique,
      };
    }
  }

  const remaining = localRowsCache.filter(row => !usedLocalIds.has(row.id));
  const fuzzyCandidates = remaining
    .map(row => ({
      row,
      score: levenshtein(foldAccents(publicProduct.name), foldAccents(row.nombre)),
      slugScore: levenshtein(foldAccents(publicProduct.slug || publicProduct.name), foldAccents(slugify(row.nombre))),
    }))
    .sort((left, right) => (left.score + left.slugScore) - (right.score + right.slugScore));

  const fuzzyBest = fuzzyCandidates[0];
  if (fuzzyBest && (fuzzyBest.score <= 2 || fuzzyBest.slugScore <= 2)) {
    return {
      row: fuzzyBest.row,
      method: 'fuzzy',
      ambiguous: false,
      candidates: [fuzzyBest.row],
    };
  }

  return { row: null, method: null, ambiguous: false };
}

let localRowsCache = [];

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'partemaquinassitio',
    port: 3306,
  });

  const [localRows] = await db.query('SELECT id, nombre, sku, categorias, imagenes FROM productos');
  localRowsCache = localRows;
  const localLookup = buildLocalLookup(localRows);
  const publicProducts = await fetchAllPublicProducts();

  const audit = {
    generatedAt: new Date().toISOString(),
    applied: APPLY_CHANGES,
    summary: {
      publicProducts: publicProducts.length,
      localProducts: localRows.length,
      matchedProducts: 0,
      missingLocalProducts: 0,
      extraLocalProducts: 0,
      categoryMismatches: 0,
      imageMismatches: 0,
      updatedImages: 0,
      ambiguousMatches: 0,
      imageExtractionFailures: 0,
    },
    missingLocalProducts: [],
    extraLocalProducts: [],
    categoryMismatches: [],
    imageMismatches: [],
    ambiguousMatches: [],
    imageExtractionFailures: [],
    updatedProducts: [],
  };

  const processedLocalIds = new Set();

  const detailedPublicProducts = await mapWithConcurrency(publicProducts, async (publicProduct, index) => {
    const permalink = canonicalUrl(publicProduct.permalink || publicProduct.link || '');
    const html = await fetchText(permalink);
    const imageUrls = extractPublicImages(html);
    const publicCategories = (publicProduct.categories || []).map(category => String(category.name || '').trim()).filter(Boolean);
    return {
      index,
      id: publicProduct.id,
      name: publicProduct.name,
      sku: publicProduct.sku || '',
      slug: publicProduct.slug || '',
      permalink,
      categories: publicCategories,
      images: imageUrls,
      imageCount: imageUrls.length,
    };
  }, CONCURRENCY);

  const updates = [];

  for (const publicProduct of detailedPublicProducts) {
    const match = resolveLocalProduct(publicProduct, localLookup, processedLocalIds);
    if (!match.row) {
      audit.missingLocalProducts.push({
        publicId: publicProduct.id,
        name: publicProduct.name,
        sku: publicProduct.sku,
        slug: publicProduct.slug,
        permalink: publicProduct.permalink,
        categories: publicProduct.categories,
      });
      continue;
    }

    if (match.ambiguous) {
      audit.ambiguousMatches.push({
        publicId: publicProduct.id,
        name: publicProduct.name,
        sku: publicProduct.sku,
        slug: publicProduct.slug,
        method: match.method,
        localCandidates: match.candidates.map(row => ({ id: row.id, nombre: row.nombre, sku: row.sku })),
      });
    }

    processedLocalIds.add(match.row.id);
    audit.summary.matchedProducts += 1;

    const localCategories = parseDelimited(match.row.categorias);
    const localImages = parseDelimited(match.row.imagenes).map(canonicalUrl);
    const publicImages = publicProduct.images.map(canonicalUrl);

    const categoriesMatch = sameOrderedList(normalizeList(localCategories), normalizeList(publicProduct.categories));
    if (!categoriesMatch) {
      audit.categoryMismatches.push({
        local: {
          id: match.row.id,
          nombre: match.row.nombre,
          sku: match.row.sku,
          categorias: localCategories,
        },
        public: {
          id: publicProduct.id,
          name: publicProduct.name,
          sku: publicProduct.sku,
          categories: publicProduct.categories,
        },
      });
      audit.summary.categoryMismatches += 1;
    }

    if (publicImages.length === 0) {
      audit.imageExtractionFailures.push({
        localId: match.row.id,
        localName: match.row.nombre,
        publicId: publicProduct.id,
        publicName: publicProduct.name,
        permalink: publicProduct.permalink,
      });
      audit.summary.imageExtractionFailures += 1;
      continue;
    }

    const imagesMatch = sameOrderedList(localImages, publicImages);
    if (!imagesMatch) {
      audit.imageMismatches.push({
        local: {
          id: match.row.id,
          nombre: match.row.nombre,
          sku: match.row.sku,
          imageCount: localImages.length,
        },
        public: {
          id: publicProduct.id,
          name: publicProduct.name,
          sku: publicProduct.sku,
          imageCount: publicImages.length,
          permalink: publicProduct.permalink,
        },
        localImages,
        publicImages,
      });
      audit.summary.imageMismatches += 1;

      if (APPLY_CHANGES) {
        updates.push({ id: match.row.id, nombre: match.row.nombre, images: publicImages });
      }
    }
  }

  for (const localRow of localRows) {
    if (!processedLocalIds.has(localRow.id)) {
      audit.extraLocalProducts.push({
        id: localRow.id,
        nombre: localRow.nombre,
        sku: localRow.sku,
        categorias: parseDelimited(localRow.categorias),
      });
    }
  }

  audit.summary.missingLocalProducts = audit.missingLocalProducts.length;
  audit.summary.extraLocalProducts = audit.extraLocalProducts.length;
  audit.summary.ambiguousMatches = audit.ambiguousMatches.length;

  if (APPLY_CHANGES && updates.length > 0) {
    await db.beginTransaction();
    try {
      for (const update of updates) {
        await db.execute('UPDATE productos SET imagenes = ? WHERE id = ?', [update.images.join(','), update.id]);
        audit.updatedProducts.push({
          id: update.id,
          nombre: update.nombre,
          imageCount: update.images.length,
        });
      }
      await db.commit();
      audit.summary.updatedImages = updates.length;
    } catch (error) {
      await db.rollback();
      throw error;
    }
  }

  if (!APPLY_CHANGES) {
    audit.summary.updatedImages = 0;
  }

  fs.mkdirSync('reports', { recursive: true });
  const reportPath = path.join('reports', 'public-product-audit.json');
  fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));

  console.log(JSON.stringify(audit.summary, null, 2));
  console.log(`Report saved to ${reportPath}`);

  await db.end();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});