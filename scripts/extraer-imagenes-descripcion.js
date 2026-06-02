const mysql = require('mysql2/promise');

const CK = 'ck_d6f713f837ed2fce72418048e64a3e257671d5c5';
const CS = 'cs_df98a4520ad4c5109f05cec61d65d22a23f11b8a';
const BASE = 'https://partemaquinas.com/wp-json/wc/v3/products';

const ids = [1023,1028,1074,1078,1140,1904,2015,2161,2163,2165,2263,2475,2506,2558,3783,3784,3785,3786,3787,3788,3789,3790,3791];

function extraerImagenes(html) {
  const urls = [];

  // Tipo 1: BWG en href
  const regexBWG = /href="(https:\/\/partemaquinas\.com\/wp-content\/uploads\/photo-gallery\/[^"?]+\.(jpe?g|jpg))"/gi;
  let match;
  while ((match = regexBWG.exec(html)) !== null) {
    const url = match[1];
    if (!url.includes('thumb') && !urls.includes(url)) urls.push(url);
  }

  // Tipo 2: galería WordPress - quitar dimensiones del src
  const regexSrc = /src="(https:\/\/partemaquinas\.com\/wp-content\/uploads\/[^"]+\.(jpe?g|jpg))"/gi;
  while ((match = regexSrc.exec(html)) !== null) {
    const url = match[1];
    const urlOriginal = url.replace(/-\d+x\d+(\.(jpe?g|jpg))$/i, '$1');
    if (!urlOriginal.includes('thumb') && !urls.includes(urlOriginal)) {
      urls.push(urlOriginal);
    }
  }

  // Tipo 3: srcset - buscar URL más grande (sin dimensiones)
  const regexSrcset = /srcset="([^"]+)"/gi;
  while ((match = regexSrcset.exec(html)) !== null) {
    const parts = match[1].split(',');
    for (const part of parts) {
      const url = part.trim().split(' ')[0];
      if (url.includes('/wp-content/uploads/') && 
          !url.match(/-\d+x\d+\.(jpe?g|jpg)$/i) &&
          !url.includes('thumb') &&
          !urls.includes(url)) {
        urls.push(url);
      }
    }
  }

  return [...new Set(urls)];
}

async function main() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'partemaquinassitio',
  });

  for (const id of ids) {
    const url = BASE + '/' + id + '?consumer_key=' + CK + '&consumer_secret=' + CS;
    const res = await fetch(url);
    const p = await res.json();
    const desc = p.description || '';
    
    const imagenes = extraerImagenes(desc);
    console.log('ID ' + id + ' | ' + p.name + ' | ' + imagenes.length + ' imágenes encontradas');
    
    if (imagenes.length >= 2) {
      await db.query('UPDATE productos SET imagenes = ? WHERE id = ?', [imagenes.join(','), id]);
      console.log('  ✅ Actualizado');
    } else {
      console.log('  ⚠️ No suficientes imágenes');
    }
  }

  console.log('Listo.');
  await db.end();
}

main().catch(console.error);