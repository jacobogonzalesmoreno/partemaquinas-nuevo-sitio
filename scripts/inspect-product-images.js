import db from '../lib/db.js';

const splitPattern = /[\n\r,;|]+/;
const cleanItem = v => String(v||'').trim();
const parseImagenes = value => {
  if (value === null || value === undefined || value === '') return [];
  if (Array.isArray(value)) return value.map(cleanItem).filter(Boolean);
  const raw = String(value);
  const normalized = raw.replace(/,(?=\S)/g, ', ');
  const urlMatches = normalized.match(/https?:\/\/[^\s"'<>]+/g);
  if (urlMatches && urlMatches.length > 0) return urlMatches.map(u=>u.replace(/[)\],.]+$/,'').trim()).filter(Boolean);
  const trimmed = normalized.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(cleanItem).filter(Boolean);
    } catch {}
  }
  return trimmed.split(splitPattern).map(cleanItem).filter(Boolean);
};

const keyword = process.argv[2] || '';
if(!keyword){
  console.error('Usage: node scripts/inspect-product-images.js <keyword>');
  process.exit(1);
}

(async ()=>{
  const [rows] = await db.query('SELECT id,nombre,imagenes FROM productos');
  const map = new Map(); // image -> [{id,nombre}]
  const products = rows.map(r=>({ id: r.id, nombre: r.nombre, imagenes: parseImagenes(r.imagenes) }));
  for(const p of products){
    for(const img of p.imagenes){
      const list = map.get(img) || [];
      list.push({ id: p.id, nombre: p.nombre });
      map.set(img, list);
    }
  }

  const matched = products.filter(p=> p.nombre.toLowerCase().includes(keyword.toLowerCase()));
  console.log('Products matching', keyword, '=>', matched.length);
  for(const p of matched){
    console.log('\n---');
    console.log(`id=${p.id} name=${p.nombre}`);
    console.log('images:');
    if(p.imagenes.length===0) console.log('  (no images)');
    for(const img of p.imagenes){
      const others = (map.get(img)||[]).filter(x=>x.id !== p.id);
      console.log(`  - ${img}`);
      if(others.length>0){
        console.log('    shared with:');
        for(const o of others) console.log(`      * ${o.id} - ${o.nombre}`);
      }
    }
  }

  await db.end();
})();
