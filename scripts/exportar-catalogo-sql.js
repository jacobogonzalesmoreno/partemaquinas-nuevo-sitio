import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'partemaquinassitio',
  port: Number(process.env.DB_PORT || 3306),
});

const quote = value => `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;

try {
  const [rows] = await db.query(
    'SELECT id, sku, marcas FROM productos WHERE (sku IS NOT NULL AND LENGTH(TRIM(sku)) > 0) OR (marcas IS NOT NULL AND LENGTH(TRIM(marcas)) > 0) ORDER BY id'
  );
  const skuRows = rows.filter(row => row.sku !== null && String(row.sku).trim());
  const marcaRows = rows.filter(row => row.marcas !== null && String(row.marcas).trim());
  const lines = [
    '-- Actualizacion de SKU y marcas de ParteMaquinas',
    '-- Generado desde la base local. Ejecutar en phpMyAdmin despues de hacer un respaldo.',
    '-- Solo modifica SKU o marcas que esten vacios; no sobrescribe valores existentes.',
    'START TRANSACTION;',
    '',
    '-- SKU',
    ...skuRows.map(row => `UPDATE productos SET sku = ${quote(row.sku)} WHERE id = ${Number(row.id)} AND (sku IS NULL OR LENGTH(TRIM(sku)) = 0);`),
    '',
    '-- Marcas',
    ...marcaRows.map(row => `UPDATE productos SET marcas = ${quote(row.marcas)} WHERE id = ${Number(row.id)} AND (marcas IS NULL OR LENGTH(TRIM(marcas)) = 0);`),
    '',
    'COMMIT;',
  ];
  await fs.writeFile('reports/actualizar-skus-marcas-produccion.sql', `${lines.join('\n')}\n`, 'utf8');
  console.log(`SQL generado: ${skuRows.length} SKU y ${marcaRows.length} marcas.`);
  console.log('Archivo: reports/actualizar-skus-marcas-produccion.sql');
} finally {
  await db.end();
}
