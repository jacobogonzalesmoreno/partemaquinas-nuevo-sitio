require('dotenv').config();
const mysql = require('mysql2/promise');

const {
  WC_CONSUMER_KEY,
  WC_CONSUMER_SECRET,
  WC_BASE_URL,
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
} = process.env;

if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !WC_BASE_URL) {
  throw new Error('Faltan variables WC_CONSUMER_KEY, WC_CONSUMER_SECRET o WC_BASE_URL.');
}

if (!DB_HOST || !DB_USER || !DB_NAME) {
  throw new Error('Faltan variables DB_HOST, DB_USER o DB_NAME.');
}

async function obtenerProductos(pagina) {
  const url = WC_BASE_URL + '?per_page=100&page=' + pagina + '&consumer_key=' + WC_CONSUMER_KEY + '&consumer_secret=' + WC_CONSUMER_SECRET;
  const res = await fetch(url);
  return await res.json();
}

async function main() {
  const db = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    port: DB_PORT ? Number(DB_PORT) : undefined,
  });

  let pagina = 1;
  let actualizados = 0;

  while (true) {
    console.log('Procesando página ' + pagina + '...');
    const productos = await obtenerProductos(pagina);
    if (!productos.length) break;

    for (const p of productos) {
      const imagenes = p.images ? p.images.map(i => i.src).join(',') : '';
      if (imagenes) {
        const [rows] = await db.query('SELECT imagenes FROM productos WHERE id = ?', [p.id]);
        if (rows.length > 0) {
          const imgActual = rows[0].imagenes || '';
          const tieneMultiples = imgActual.includes(',');
          if (!tieneMultiples) {
            await db.query('UPDATE productos SET imagenes = ? WHERE id = ?', [imagenes, p.id]);
            actualizados++;
            console.log('Actualizado: ' + p.name);
          }
        }
      }
    }
    pagina++;
  }

  console.log('Listo. ' + actualizados + ' productos actualizados.');
  await db.end();
}

main().catch(console.error);