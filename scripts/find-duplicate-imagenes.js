import db from '../lib/db.js';

(async ()=>{
  const query = `SELECT imagenes, COUNT(*) AS cnt FROM productos WHERE imagenes IS NOT NULL AND imagenes <> '' GROUP BY imagenes HAVING cnt>1 ORDER BY cnt DESC LIMIT 200`;
  const [rows] = await db.query(query);
  console.log('duplicate_groups=', rows.length);
  rows.forEach(r=>{
    console.log(r.cnt, '->', r.imagenes.slice(0,200));
  });
  await db.end();
})();
