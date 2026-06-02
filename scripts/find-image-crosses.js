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

(async ()=>{
  const [rows] = await db.query('SELECT id,nombre,imagenes FROM productos');
  const map = new Map();
  for(const r of rows){
    const imgs = new Set();
    parseImagenes(r.imagenes).forEach(i=>imgs.add(i));
    // only using `imagenes` column (the table doesn't have separate imagen fields)
    for(const img of imgs){
      if(!img) continue;
      const list = map.get(img) || [];
      list.push({ id: r.id, nombre: r.nombre });
      map.set(img, list);
    }
  }

  const collisions = [];
  for(const [img, list] of map.entries()){
    if(list.length > 1){
      collisions.push({ img, count: list.length, products: list });
    }
  }

  collisions.sort((a,b)=>b.count - a.count);
  console.log('collisions_count=', collisions.length);
  console.log(JSON.stringify(collisions.slice(0,200), null, 2));
  // write CSV for manual review
  const csvRows = ['image,url_count,product_ids,product_names'];
  for(const c of collisions){
    const ids = c.products.map(p=>p.id).join('|');
    const names = c.products.map(p=>p.nombre.replace(/"/g,'""')).join('|');
    csvRows.push(`"${c.img}",${c.count},"${ids}","${names}"`);
  }
  const fs = await import('fs');
  // ensure reports dir exists
  try{
    fs.mkdirSync('reports', { recursive: true });
  }catch(e){}
  fs.writeFileSync('reports/image-collisions.csv', csvRows.join('\n'));
  console.log('CSV report written to reports/image-collisions.csv');
  await db.end();
})();
