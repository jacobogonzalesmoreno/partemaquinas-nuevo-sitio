const mysql = require('mysql2/promise');

const CK = 'ck_d6f713f837ed2fce72418048e64a3e257671d5c5';
const CS = 'cs_df98a4520ad4c5109f05cec61d65d22a23f11b8a';
const BASE = 'https://partemaquinas.com/wp-json/wc/v3/products';

async function obtenerProductos(pagina) {
  const url = BASE + '?per_page=100&page=' + pagina + '&consumer_key=' + CK + '&consumer_secret=' + CS;
  const res = await fetch(url);
  return await res.json();
}

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'partemaquinassitio',
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