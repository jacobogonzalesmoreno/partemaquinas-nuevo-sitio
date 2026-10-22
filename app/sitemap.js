import db from '@/lib/db';
import { MENU_CATEGORIAS_FLAT } from '@/lib/menu-categorias';
import { slugifyCategoria } from '@/lib/catalogo-categorias';
import { ensureBlogTable } from '@/lib/blog';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  const base = 'https://partemaquinas.com';
  const now = new Date();
  const staticRoutes = ['', '/productos', '/maquinaria', '/nosotros', '/contacto', '/blog', '/politica-datos', '/terminos-y-condiciones', '/politica-cookies', '/derecho-retracto'].map(path => ({ url: `${base}${path}`, lastModified: now, changeFrequency: path === '' ? 'weekly' : 'monthly', priority: path === '' ? 1 : 0.7 }));
  const categories = MENU_CATEGORIAS_FLAT.map(name => ({ url: `${base}/productos/categorias/${slugifyCategoria(name)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 }));
  let products = [];
  try {
    const [rows] = await db.query('SELECT id FROM productos ORDER BY id ASC');
    products = rows.map(row => ({ url: `${base}/productos/${encodeURIComponent(row.id)}`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 }));
  } catch (error) {
    console.error('No se pudieron incluir productos en el sitemap:', error);
  }
  let articles = [];
  try {
    await ensureBlogTable();
    const [rows] = await db.query("SELECT slug, publicado_en FROM articulos_blog WHERE estado = 'publicado' AND publicado_en <= NOW() ORDER BY publicado_en DESC");
    articles = rows.map(row => ({ url: `${base}/blog/${encodeURIComponent(row.slug)}`, lastModified: row.publicado_en || now, changeFrequency: 'monthly', priority: 0.6 }));
  } catch (error) {
    console.error('No se pudieron incluir artículos en el sitemap:', error?.name || 'unknown');
  }
  return [...staticRoutes, ...categories, ...products, ...articles];
}
