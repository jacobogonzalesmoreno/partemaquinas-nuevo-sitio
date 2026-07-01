// ============================================================
// lib/db.js
// ============================================================
import mysql from 'mysql2/promise';
import { getDbEnv } from '@/lib/env';

const env = getDbEnv();

// En entornos serverless (Vercel), este modulo puede volver a
// ejecutarse en cada invocacion, creando un pool nuevo cada vez.
// Guardamos el pool en el objeto global para reutilizarlo y no
// agotar las conexiones disponibles del hosting de MySQL.
const globalForDb = globalThis;

const db =
  globalForDb.__mysqlPool ||
  mysql.createPool({
    host: env.DB_HOST,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    port: env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0,
  });

if (!globalForDb.__mysqlPool) {
  globalForDb.__mysqlPool = db;
}

export default db;