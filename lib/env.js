import { z } from 'zod';

const dbSchema = z.object({
  DB_HOST: z.string().min(1, 'DB_HOST es obligatorio').optional(),
  DB_USER: z.string().min(1, 'DB_USER es obligatorio').optional(),
  DB_PASSWORD: z.string().optional().default(''),
  DB_NAME: z.string().min(1, 'DB_NAME es obligatorio').optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
});

const securitySchema = z.object({
  ADMIN_API_KEY: z.string().min(12).optional(),
  EDITOR_API_KEY: z.string().min(12).optional(),
  READER_API_KEY: z.string().min(12).optional(),
  ADMIN_USER: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  SESSION_SECRET: z.string().min(16).optional(),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().max(50).optional().default(10),
  ALLOWED_UPLOAD_TYPES: z.string().optional().default('image/png,image/jpeg,image/webp,image/gif'),
});

let cachedDbEnv;
let cachedSecurityEnv;

export function getDbEnv() {
  if (!cachedDbEnv) {
    const parsed = dbSchema.safeParse(process.env);
    if (!parsed.success) {
      if (process.env.NODE_ENV !== 'production') {
        cachedDbEnv = {
          DB_HOST: 'localhost',
          DB_USER: 'root',
          DB_PASSWORD: '',
          DB_NAME: 'partemaquinassitio',
          DB_PORT: 3306,
        };
        return cachedDbEnv;
      }
      const details = parsed.error.issues.map(issue => issue.message).join(', ');
      throw new Error(`Configuracion de base de datos invalida: ${details}`);
    }
    cachedDbEnv = {
      DB_HOST: parsed.data.DB_HOST || 'localhost',
      DB_USER: parsed.data.DB_USER || 'root',
      DB_PASSWORD: parsed.data.DB_PASSWORD || '',
      DB_NAME: parsed.data.DB_NAME || 'partemaquinassitio',
      DB_PORT: parsed.data.DB_PORT || 3306,
    };
  }
  return cachedDbEnv;
}

export function getSecurityEnv() {
  if (!cachedSecurityEnv) {
    const parsed = securitySchema.safeParse(process.env);
    if (!parsed.success) {
      const details = parsed.error.issues.map(issue => issue.message).join(', ');
      throw new Error(`Configuracion de seguridad invalida: ${details}`);
    }
    const isProd = process.env.NODE_ENV === 'production';
    console.log('ADMIN_USER:', process.env.ADMIN_USER);
    console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD);
    cachedSecurityEnv = {
      ...parsed.data,
      ADMIN_USER: parsed.data.ADMIN_USER || (isProd ? undefined : 'admin'),
      ADMIN_PASSWORD: parsed.data.ADMIN_PASSWORD || (isProd ? undefined : 'admin123'),
      SESSION_SECRET: parsed.data.SESSION_SECRET || (isProd ? undefined : 'dev-secret-please-change'),
    };
  }
  return cachedSecurityEnv;
}