import db from '../lib/db.js';

(async ()=>{
  const patterns = ['cigueñal','ciguenal','cigueñales','ciguenales'];
  const results = {};
  for(const p of patterns){
    const like = `%${p}%`;
    const [rows] = await db.query('SELECT COUNT(*) AS total FROM productos WHERE LOWER(categorias) LIKE ? OR LOWER(nombre) LIKE ?', [like, like]);
    results[p] = rows[0].total;
  }
  console.log(results);
  // show some samples with categorias containing 'cigue' substring
  const [samples] = await db.query("SELECT id,nombre,categorias FROM productos WHERE LOWER(categorias) LIKE '%cigue%' OR LOWER(nombre) LIKE '%cigue%' LIMIT 20");
  console.log(samples);
  await db.end();
})();
