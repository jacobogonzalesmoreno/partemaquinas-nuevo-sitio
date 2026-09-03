import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const apply = process.argv.includes('--apply');
const db = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'partemaquinassitio',
  port: Number(process.env.DB_PORT || 3306),
});

function generarSku(nombre) {
  const palabras = String(nombre || '').match(/[\p{L}\p{N}]+/gu) || [];
  if (palabras.length === 0) return '';

  const ultima = palabras[palabras.length - 1];
  const tieneNumeros = /\d/.test(ultima);
  const esModeloCompacto = /^[A-ZÀ-Ý][a-zà-ÿ]+\d+[A-Za-z0-9]*$/u.test(ultima);
  const sufijoModelo = tieneNumeros
    ? (esModeloCompacto ? `${ultima[0]}X${ultima.match(/\d.*$/)?.[0] || ''}` : ultima)
    : '';
  const palabrasBase = sufijoModelo ? palabras.slice(0, -1) : palabras;
  const iniciales = palabrasBase.map(palabra => palabra[0]).join('');
  const sku = `${iniciales}${sufijoModelo || ''}`.toUpperCase();
  return sku.slice(0, 100);
}

try {
  const [rows] = await db.query(
    'SELECT id, nombre, sku FROM productos WHERE sku IS NULL OR LENGTH(TRIM(sku)) = 0 ORDER BY id'
  );
  const [existingRows] = await db.query(
    'SELECT id, sku FROM productos WHERE sku IS NOT NULL AND LENGTH(TRIM(sku)) > 0'
  );
  const propuestasBase = rows
    .map(row => ({ ...row, nuevoSku: generarSku(row.nombre) }))
    .filter(row => row.nuevoSku);
  const skuExistentes = new Map(existingRows.map(row => [String(row.sku).trim().toUpperCase(), row.id]));
  const usados = new Set(skuExistentes.keys());
  const propuestas = propuestasBase.map(propuesta => {
    const skuBase = propuesta.nuevoSku;
    let nuevoSku = skuBase;
    if (usados.has(nuevoSku)) {
      nuevoSku = `${skuBase}-${propuesta.id}`.slice(0, 100);
    }
    while (usados.has(nuevoSku)) {
      nuevoSku = `${skuBase}-${propuesta.id}-${Date.now()}`.slice(0, 100);
    }
    usados.add(nuevoSku);
    return { ...propuesta, nuevoSku, skuBase, fueDesambiguado: nuevoSku !== skuBase };
  });
  const desambiguados = propuestas.filter(row => row.fueDesambiguado);

  console.log(`Productos sin SKU: ${rows.length}`);
  console.log(`SKUs propuestos: ${propuestas.length}`);
  console.log(`SKUs desambiguados por colision: ${desambiguados.length}`);
  if (desambiguados.length > 0) console.table(desambiguados.map(({ id, nombre, skuBase, nuevoSku }) => ({ id, nombre, skuBase, nuevoSku })));
  console.table(propuestas.slice(0, 30).map(({ id, nombre, nuevoSku }) => ({ id, nombre, nuevoSku })));

  if (!apply) {
    console.log('Vista previa solamente. Ejecuta con --apply para actualizar los SKU.');
    process.exitCode = 0;
  } else {
    await db.beginTransaction();
    for (const propuesta of propuestas) {
      await db.execute(
        'UPDATE productos SET sku = ? WHERE id = ? AND (sku IS NULL OR LENGTH(TRIM(sku)) = 0)',
        [propuesta.nuevoSku, propuesta.id]
      );
    }
    await db.commit();
    console.log(`Actualizacion completada: ${propuestas.length} productos.`);
  }
} catch (error) {
  try { await db.rollback(); } catch {}
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
