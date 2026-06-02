import db from '@/lib/db';

export async function ensureCategoriasTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL UNIQUE,
      emoji VARCHAR(32) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

export async function getCategorias() {
  await ensureCategoriasTable();
  const [rows] = await db.query('SELECT id, nombre, emoji FROM categorias ORDER BY nombre ASC');
  return rows;
}
