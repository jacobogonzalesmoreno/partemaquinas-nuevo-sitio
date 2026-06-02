const splitPattern = /[\n\r,;|]+/;

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
  const urlMatches = normalized.match(/https?:\/\/[^\s"'<>]+/g);
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
