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

const marcasDirectas = [
  ['john\\s*deere', 'John Deere'], ['new\\s*holland', 'New Holland'],
  ['caterpillar|\\bcat\\b', 'Caterpillar'], ['cummins', 'Cummins'],
  ['isuzu', 'Isuzu'], ['kobelco', 'Kobelco'], ['komatsu', 'Komatsu'],
  ['hitachi|zaxis', 'Hitachi'], ['doosan|daewoo', 'Doosan'],
  ['mitsubishi', 'Mitsubishi'], ['hino', 'Hino'], ['volvo', 'Volvo'],
  ['kubota', 'Kubota'], ['hyundai', 'Hyundai'], ['liugong|liu\\s*gong', 'LiuGong'],
  ['sany|sanny', 'SANY'], ['cas[eé]', 'Case'], ['\\bihi\\b', 'IHI'],
  ['shibaura', 'Shibaura'], ['yanmar', 'Yanmar'], ['\\bjcb\\b', 'JCB'],
  ['\\bkato\\b', 'Kato'], ['bobcat|thomas', 'Bobcat'],
  ['xgma', 'XGMA'], ['link[-\\s]*belt', 'Link-Belt'], ['\\bntn\\b', 'NTN'],
  ['\\bk3v\\d+', 'Kawasaki'], ['\\bex(?:120|200)\\b', 'Hitachi'], ['\\bhd820\\b', 'Kato'],
];

const motores = [
  ['\\b(?:4|6)(?:bg1|hk1|wg1)\\b|\\b4le2\\b', 'Isuzu'],
  ['\\b(?:4|6)d(?:6|14|16|24|32|34|40)\\b', 'Mitsubishi'],
  ['\\b(?:4|6)bt(?:[a-z0-9.-]*)?\\b|\\b(?:6ct|6lt|qsb|qsc|qsl|isx|ism|m11|l10)\\b', 'Cummins'],
  ['\\b(?:3064|3066|c4\\.4|c6\\.4|c7\\.1|3126b?|c9|c13)\\b', 'Caterpillar'],
  ['\\b(?:6d102|saa4d102|saa6d107|saa6d108|saa6d114|saa6d125|saa6d140)\\b', 'Komatsu'],
  ['\\b(?:db58|dl06|dl08|dx06|dx08|d24)\\b', 'Doosan'],
  ['\\b(?:h07c|h07ct|j05|j08)\\b', 'Hino'],
  ['\\b(?:v2203|v2403)\\b', 'Kubota'],
];

function buscarMarca(nombre) {
  const texto = String(nombre || '').toLowerCase();
  for (const [patron, marca] of marcasDirectas) {
    if (new RegExp(patron, 'i').test(texto)) return marca;
  }
  for (const [patron, marca] of motores) {
    if (new RegExp(patron, 'i').test(texto)) return marca;
  }
  return '';
}

try {
  const [rows] = await db.query(
    'SELECT id, nombre, marcas FROM productos WHERE marcas IS NULL OR LENGTH(TRIM(marcas)) = 0 ORDER BY id'
  );
  const propuestas = rows.map(row => ({ ...row, nuevaMarca: buscarMarca(row.nombre) }));
  const clasificadas = propuestas.filter(row => row.nuevaMarca);
  const pendientes = propuestas.filter(row => !row.nuevaMarca);

  console.log(`Productos sin marca: ${rows.length}`);
  console.log(`Marcas inferidas: ${clasificadas.length}`);
  console.log(`Sin marca inferible: ${pendientes.length}`);
  console.log('Resumen por marca:');
  console.table(Object.entries(Object.groupBy(clasificadas, row => row.nuevaMarca)).map(([marca, items]) => ({ marca, total: items.length })));
  console.log('Muestra de asignaciones:');
  console.table(clasificadas.slice(0, 40).map(({ id, nombre, nuevaMarca }) => ({ id, nombre, nuevaMarca })));
  if (pendientes.length > 0) {
    console.log('Productos pendientes de revisión:');
    console.table(pendientes.map(({ id, nombre }) => ({ id, nombre })));
  }

  if (!apply) {
    console.log('Vista previa solamente. Ejecuta con --apply para actualizar las marcas inferidas.');
  } else {
    await db.beginTransaction();
    for (const propuesta of clasificadas) {
      await db.execute(
        'UPDATE productos SET marcas = ? WHERE id = ? AND (marcas IS NULL OR LENGTH(TRIM(marcas)) = 0)',
        [propuesta.nuevaMarca, propuesta.id]
      );
    }
    await db.commit();
    console.log(`Actualizacion completada: ${clasificadas.length} productos.`);
  }
} catch (error) {
  try { await db.rollback(); } catch {}
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
