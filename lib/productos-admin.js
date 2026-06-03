import db from '@/lib/db';
import { normalizeImagenesText } from '@/lib/imagenes';
import { normalizeCategoriasText } from '@/lib/categorias';

const numericTypePattern = /(int|decimal|float|double|real|numeric|bit)/i;
const lengthPattern = /(char|varchar)\((\d+)\)/i;

function parseMaxLength(columnType) {
  const match = String(columnType || '').match(lengthPattern);
  if (!match) return null;
  const length = Number(match[2]);
  return Number.isFinite(length) ? length : null;
}

export async function getProductosSchema() {
  const [rows] = await db.query('SHOW COLUMNS FROM productos');
  return rows.map(row => ({
    name: row.Field,
    type: row.Type,
    nullable: row.Null === 'YES',
    default: row.Default,
  }));
}

function normalizeColumnValue(value, columnType) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (Array.isArray(value)) return value.join(',');
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' && numericTypePattern.test(columnType || '')) {
      return null;
    }
    return value;
  }
  if (typeof value === 'boolean' && numericTypePattern.test(columnType || '')) {
    return value ? 1 : 0;
  }
  return value;
}

export function pickWritableFields(payload, schema) {
  if (!payload || typeof payload !== 'object') return {};
  const schemaMap = new Map(schema.map(column => [column.name, column]));
  const data = {};

  for (const [key, value] of Object.entries(payload)) {
    const column = schemaMap.get(key);
    if (!column) continue;
    const normalized = normalizeColumnValue(value, column.type || '');
    if (normalized !== undefined) {
      if (key === 'imagenes') {
        data[key] = normalizeImagenesText(normalized);
      } else if (key === 'categorias') {
        data[key] = normalizeCategoriasText(normalized);
      } else {
        data[key] = normalized;
      }
    }
  }

  return data;
}

export function validateWritablePayload(payload, schema) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, errors: ['El cuerpo debe ser un objeto.'] };
  }

  const schemaMap = new Map(schema.map(column => [column.name, column]));
  const errors = [];

  for (const [key, value] of Object.entries(payload)) {
    const column = schemaMap.get(key);
    if (!column) {
      errors.push(`Campo no permitido: ${key}`);
      continue;
    }

    if (value === undefined) continue;

    if (value === null) {
      if (!column.nullable) {
        errors.push(`El campo ${key} no puede ser null.`);
      }
      continue;
    }

    const columnType = String(column.type || '');
    if (numericTypePattern.test(columnType)) {
      if (typeof value === 'boolean') {
        continue;
      }
      const numericValue = typeof value === 'number' ? value : Number(String(value).trim());
      if (!Number.isFinite(numericValue)) {
        errors.push(`El campo ${key} debe ser numerico.`);
      }
      continue;
    }

    if (typeof value === 'string') {
      const maxLength = parseMaxLength(columnType);
      if (maxLength && value.length > maxLength) {
        errors.push(`El campo ${key} excede ${maxLength} caracteres.`);
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, errors: [] };
}