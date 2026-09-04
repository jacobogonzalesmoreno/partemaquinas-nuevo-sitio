const fs = require('fs');
const path = require('path');

const dumpPath = path.join(process.cwd(), 'u591333919_nuevositio.sql');
const outputPath = path.join(process.cwd(), 'actualizar-base-local.sql');
const dump = fs.readFileSync(dumpPath, 'utf8');
const tables = ['categorias', 'maquinaria', 'productos'];

function extractCreateTable(table) {
  const pattern = new RegExp('CREATE TABLE `' + table + '` \\([\\s\\S]*?\\) ENGINE=[^;]+;');
  const match = dump.match(pattern);
  if (!match) return '';
  const primaryKey = table === 'categorias' ? ',\n  PRIMARY KEY (`id`),\n  UNIQUE KEY `nombre` (`nombre`)\n' : ',\n  PRIMARY KEY (`id`)\n';
  const withKeys = match[0].replace(/\n\) ENGINE=/, `${primaryKey}) ENGINE=`);
  return withKeys.replace('CREATE TABLE `' + table + '`', 'CREATE TABLE IF NOT EXISTS `' + table + '`');
}

function extractInsertStatements(table) {
  const marker = 'INSERT INTO `' + table + '`';
  const statements = [];
  let searchFrom = 0;

  while (true) {
    const start = dump.indexOf(marker, searchFrom);
    if (start < 0) break;

    let end = start + marker.length;
    let inString = false;
    let escaped = false;
    for (; end < dump.length; end += 1) {
      const character = dump[end];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (character === '\\' && inString) {
        escaped = true;
        continue;
      }
      if (character === "'") {
        inString = !inString;
        continue;
      }
      if (character === ';' && !inString) {
        statements.push(dump.slice(start, end + 1));
        searchFrom = end + 1;
        break;
      }
    }
    if (end >= dump.length) break;
  }

  return statements;
}

function getColumns(statement) {
  const match = statement.match(/^INSERT INTO `[^`]+`\s*\(([\s\S]*?)\)\s+VALUES/);
  if (!match) throw new Error(`No se pudieron leer columnas: ${statement.slice(0, 100)}`);
  return [...match[1].matchAll(/`([^`]+)`/g)].map(item => item[1]);
}

function toUpsert(statement, table) {
  const columns = getColumns(statement);
  const updates = columns
    .filter(column => column !== 'id')
    .map(column => {
      if (table === 'productos' && column === 'imagenes') {
        return '`imagenes` = IF(INSTR(`imagenes`, \'/uploads/\') > 0, `imagenes`, VALUES(`imagenes`))';
      }
      return `\`${column}\` = VALUES(\`${column}\`)`;
    });

  return `${statement.slice(0, -1)}\nON DUPLICATE KEY UPDATE\n  ${updates.join(',\n  ')};`;
}

const output = [
  '-- Actualizacion incremental de la base local.',
  '-- Generado desde u591333919_nuevositio.sql.',
  '-- Ejecutar sobre la base configurada en .env.local.',
  'SET NAMES utf8mb4;',
  'SET FOREIGN_KEY_CHECKS = 0;',
  'START TRANSACTION;',
  '',
];

for (const table of tables) {
  const create = extractCreateTable(table);
  if (create) output.push(`-- Estructura compatible de ${table}`, `${create}\n`);

  const inserts = extractInsertStatements(table);
  if (inserts.length > 0) {
    output.push(`-- Datos de ${table}`);
    for (const insert of inserts) output.push(toUpsert(insert, table), '');
  }
}

output.push(
  'COMMIT;',
  'SET FOREIGN_KEY_CHECKS = 1;',
  '',
  '-- Verificacion rapida',
  'SELECT COUNT(*) AS productos_actualizados FROM `productos`;',
  'SELECT COUNT(*) AS maquinaria_actualizada FROM `maquinaria`;',
  'SELECT COUNT(*) AS categorias_actualizadas FROM `categorias`;',
  '',
);

fs.writeFileSync(outputPath, output.join('\n'), 'utf8');
console.log(`Archivo generado: ${outputPath}`);
console.log(`Tamano: ${fs.statSync(outputPath).size} bytes`);
for (const table of tables) console.log(`${table}: ${extractInsertStatements(table).length} bloques INSERT`);
