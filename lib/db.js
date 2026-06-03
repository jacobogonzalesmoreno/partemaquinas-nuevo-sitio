import mysql from 'mysql2/promise';
import { getDbEnv } from '@/lib/env';

const env = getDbEnv();

const db = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
});

export default db;