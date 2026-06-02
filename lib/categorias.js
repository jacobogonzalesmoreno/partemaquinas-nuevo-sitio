const splitPattern = /[\n\r,;|]+/;

const cleanItem = value => String(value).trim();

export const parseCategoriasValue = value => {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) {
    return value.map(cleanItem).filter(Boolean);
  }

  const raw = String(value).trim();
  if (!raw) return [];

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(cleanItem).filter(Boolean);
      }
    } catch {
      // Fall through to delimiter parsing.
    }
  }

  return raw
    .split(splitPattern)
    .map(cleanItem)
    .filter(Boolean);
};

export const normalizeCategoriasText = value => parseCategoriasValue(value).join(', ');

export const normalizeCategoriaKey = value =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
