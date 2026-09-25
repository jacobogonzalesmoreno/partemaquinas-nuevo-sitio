import db from '@/lib/db';
import { MENU_CATEGORIAS_FLAT } from '@/lib/menu-categorias';
import { slugifyCategoria } from '@/lib/catalogo-categorias';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = 'https://partemaquinas.com';
  const now = new Date();
  const staticRoutes = ['', '/productos', '/maquinaria', '/nosotros', '/contacto'].map(path => ({ url: `${base}${path}`, lastModified: now, changeFrequency: path === '' ? 'weekly' : 'monthly', priority: path === '' ? 1 : 0.7 }));
  const categories = MENU_CATEGORIAS_FLAT.map(name => ({ url: `${base}/productos/categorias/${slugifyCategoria(name)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 }));
  let products = [];
  try {
    const [rows] = await db.query('SELECT id FROM productos ORDER BY id ASC');
    products = rows.map(row => ({ url: `${base}/productos/${encodeURIComponent(row.id)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 }));
  } catch (error) {
    console.error('No se pudieron incluir productos en el sitemap:', error);
  }
  return [...staticRoutes, ...categories, ...products];
}
