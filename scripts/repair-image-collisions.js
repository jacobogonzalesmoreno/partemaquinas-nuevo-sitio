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

const argv = process.argv.slice(2);
const apply = argv.includes('--apply');
const strategyArg = argv.find(a=>a.startsWith('--strategy=')) || '';
const strategy = strategyArg.split('=')[1] || 'keepLowestId';

function chooseCanonical(list, strategy){
  // list is array of {id,nombre}
  if(strategy === 'keepHighestId') return list.reduce((a,b)=> a.id>b.id?a:b).id;
  // default keepLowestId
  return list.reduce((a,b)=> a.id<b.id?a:b).id;
}

(async ()=>{
  console.log('Loading products...');
  const [rows] = await db.query('SELECT id,nombre,imagenes FROM productos');

  const map = new Map();
  for(const r of rows){
    const imgs = new Set();
    parseImagenes(r.imagenes).forEach(i=>imgs.add(i));
    for(const img of imgs){
      if(!img) continue;
      const list = map.get(img) || [];
      list.push({ id: r.id, nombre: r.nombre, imagenes: Array.from(imgs) });
      map.set(img, list);
    }
  }

  const collisions = [];
  for(const [img, list] of map.entries()){
    if(list.length > 1) collisions.push({ img, products: list });
  }

  collisions.sort((a,b)=>b.products.length - a.products.length);
  console.log('collisions_count=', collisions.length);

  // prepare reports
  const fs = await import('fs');
  try{ fs.mkdirSync('reports', { recursive: true }); }catch(e){}
  const previewRows = ['image,canonical_id,canonical_name,other_product_ids,other_product_names,skipped_removals'];
  const backupRows = ['product_id,product_name,original_imagenes'];
  const sqlRows = [];

  let plannedUpdates = 0;

  for(const c of collisions){
    const img = c.img;
    const prods = c.products;
    const canonicalId = chooseCanonical(prods, strategy);
    const canonical = prods.find(p=>p.id===canonicalId);
    const others = prods.filter(p=>p.id !== canonicalId);
    const otherIds = others.map(p=>p.id).join('|');
    const otherNames = others.map(p=>p.nombre.replace(/"/g,'""')).join('|');

    let skipped = [];

    for(const other of others){
      const original = other.imagenes || [];
      const newImgs = original.filter(u=>u !== img);
      if(newImgs.length === 0){
        // skip removal to avoid leaving product without images
        skipped.push(String(other.id));
        continue;
      }
      plannedUpdates++;
      // prepare SQL update (will be executed only with --apply)
      const safeValue = newImgs.map(u=>u.replace(/"/g,'""')).join(',');
      const sql = `UPDATE productos SET imagenes = "${safeValue}" WHERE id = ${other.id};`;
      sqlRows.push(sql);
      backupRows.push(`${other.id},"${other.nombre.replace(/"/g,'""')}","${(original.join('|')).replace(/"/g,'""')}"`);
    }

    previewRows.push(`"${img}",${canonical.id},"${canonical.nombre.replace(/"/g,'""')}","${otherIds}","${otherNames}","${skipped.join('|')}"`);
  }

  fs.writeFileSync('reports/image-collisions-repair-preview.csv', previewRows.join('\n'));
  fs.writeFileSync('reports/image-collisions-backup.csv', backupRows.join('\n'));
  fs.writeFileSync('reports/image-collisions-updates.sql', sqlRows.join('\n'));

  console.log('Planned updates (non-destructive preview):', plannedUpdates);
  console.log('Preview CSV: reports/image-collisions-repair-preview.csv');
  console.log('Backup CSV: reports/image-collisions-backup.csv');
  console.log('SQL file: reports/image-collisions-updates.sql');

  if(!apply){
    console.log('Run with --apply to execute the updates (no changes made).');
    await db.end();
    return;
  }

  // apply updates with transaction
  console.log('Applying updates...');
  const conn = await db.getConnection();
  try{
    await conn.beginTransaction();
    for(const sql of sqlRows){
      await conn.query(sql);
    }
    await conn.commit();
    console.log('Applied', sqlRows.length, 'updates');
  }catch(e){
    console.error('Error during apply, rolling back', e);
    try{ await conn.rollback(); }catch(_){}
  }finally{
    try{ conn.release(); }catch(_){}
    await db.end();
  }

})();
