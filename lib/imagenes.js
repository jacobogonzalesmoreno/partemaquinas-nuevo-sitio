const splitPattern = /[\n\r,;|]+/;
const imageUrlPattern = /(?:https?:\/\/|\/)[^\s"'<>]+/g;

const cleanItem = value => String(value).trim();

export const normalizeImagenesText = value => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map(cleanItem).filter(Boolean).join(', ');
  }

  const raw = String(value).trim();
  if (!raw) return '';

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(cleanItem).filter(Boolean).join(', ');
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  const normalized = raw.replace(/,(?=\S)/g, ', ');
  return normalized
    .split(splitPattern)
    .map(cleanItem)
    .filter(Boolean)
    .join(', ');
};

export const parseImagenesValue = value => {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) {
    return value.map(cleanItem).filter(Boolean);
  }

  const raw = String(value);
  const normalized = raw.replace(/,(?=\S)/g, ', ');
  const urlMatches = normalized.match(imageUrlPattern);
  if (urlMatches && urlMatches.length > 0) {
    return urlMatches
      .map(url => url.replace(/[)\],.]+$/, '').trim())
      .filter(Boolean);
  }

  const trimmed = normalized.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map(cleanItem).filter(Boolean);
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  return trimmed
    .split(splitPattern)
    .map(cleanItem)
    .filter(Boolean);
};

const imageExtensionPattern = /\.(jpe?g|png|webp|gif|bmp|svg)(\?|#|$)/i;
const sizeSuffixPattern = /-\d+x\d+(?=\.(jpe?g|png|webp|gif|bmp|svg)(\?|#|$))/i;

const normalizeImageUrl = url => String(url || '').replace(sizeSuffixPattern, '');

export const getImagenesProducto = producto => {
  if (!producto) return [];
  const primarySources = [
    producto.imagenes,
    producto.imagen,
    producto.imagen_principal,
    producto.imagen_principal_url,
    producto.image,
    producto.img,
    producto.foto,
  ];
  const fallbackSources = [producto.descripcion];
  const urls = [];
  const seen = new Set();

  const collect = source => {
    parseImagenesValue(source).forEach(url => {
      const clean = normalizeImageUrl(String(url || '').trim());
      if (!clean) return;
      if (!imageExtensionPattern.test(clean)) return;
      if (seen.has(clean)) return;
      seen.add(clean);
      urls.push(clean);
    });
  };

  primarySources.forEach(collect);
  if (urls.length === 0) {
    fallbackSources.forEach(collect);
  }

  return urls;
};
