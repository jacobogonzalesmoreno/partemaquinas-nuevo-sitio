import db from '@/lib/db';
import crypto from 'crypto';

export async function ensureBlogTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS articulos_blog (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(220) NOT NULL,
    slug VARCHAR(240) NOT NULL UNIQUE,
    resumen VARCHAR(500) NOT NULL DEFAULT '',
    imagen_portada TEXT NULL,
    contenido LONGTEXT NOT NULL,
    preview_token CHAR(64) NULL UNIQUE,
    estado ENUM('borrador','publicado') NOT NULL DEFAULT 'borrador',
    publicado_en DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_blog_estado_fecha (estado, publicado_en)
  )`);
  const [columns] = await db.query("SHOW COLUMNS FROM articulos_blog LIKE 'preview_token'");
  if (!columns.length) {
    try { await db.query('ALTER TABLE articulos_blog ADD COLUMN preview_token CHAR(64) NULL UNIQUE'); }
    catch (error) { if (error?.code !== 'ER_DUP_FIELDNAME') throw error; }
  }
  await db.query(`CREATE TABLE IF NOT EXISTS articulos_blog_previews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    articulo_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_blog_preview_article (articulo_id)
  )`);
}

export async function getBlogPreviewByToken(token) {
  const value = String(token || '');
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(value)) return null;
  await ensureBlogTable();
  const tokenHash = crypto.createHash('sha256').update(value).digest('hex');
  const [rows] = await db.execute(`SELECT a.titulo, a.slug, a.resumen, a.imagen_portada, a.contenido, a.estado, a.publicado_en, a.updated_at
    FROM articulos_blog a
    LEFT JOIN articulos_blog_previews p ON p.articulo_id = a.id AND p.token_hash = ?
    WHERE p.id IS NOT NULL OR a.preview_token = ?
    LIMIT 1`, [tokenHash, tokenHash]);
  if (!rows.length) return null;
  return { ...rows[0], contenido: JSON.parse(rows[0].contenido || '[]') };
}

export const slugifyBlog = value => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 220);

const safeHref = value => {
  const url = String(value || '').trim().slice(0, 2000);
  if (/^https:\/\//i.test(url) || /^mailto:/i.test(url) || /^tel:/i.test(url) || url.startsWith('/') || url.startsWith('#')) return url;
  return '';
};

function cleanNode(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 12) throw new Error('El artículo contiene formato no válido.');
  if (node.type === 'text') {
    const marks = (Array.isArray(node.marks) ? node.marks : []).flatMap(mark => {
      if (['bold', 'italic', 'underline', 'strike'].includes(mark?.type)) return [{ type: mark.type }];
      if (mark?.type === 'link') {
        const href = safeHref(mark.attrs?.href);
        return href ? [{ type: 'link', attrs: { href } }] : [];
      }
      if (['color', 'highlight'].includes(mark?.type) && /^#[0-9a-f]{6}$/i.test(mark.attrs?.color || '')) return [{ type: mark.type, attrs: { color: mark.attrs.color } }];
      if (mark?.type === 'fontSize' && ['small', 'normal', 'large', 'huge'].includes(mark.attrs?.size)) return [{ type: 'fontSize', attrs: { size: mark.attrs.size } }];
      if (mark?.type === 'fontFamily' && ['Arial', 'Georgia', 'Verdana', 'Times New Roman'].includes(mark.attrs?.family)) return [{ type: 'fontFamily', attrs: { family: mark.attrs.family } }];
      return [];
    });
    // The editor can encounter legacy nested <strong> tags. Normalize marks
    // before saving so a repeated click never accumulates bold wrappers.
    const uniqueMarks = marks.filter((mark, index) => marks.findIndex(candidate => candidate.type === mark.type && JSON.stringify(candidate.attrs || {}) === JSON.stringify(mark.attrs || {})) === index);
    return { type: 'text', text: String(node.text || '').slice(0, 12000), ...(uniqueMarks.length ? { marks: uniqueMarks } : {}) };
  }
  const nodeTypes = new Set(['doc', 'paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'hardBreak', 'horizontalRule', 'pageBreak', 'image', 'video', 'pdf', 'button']);
  if (!nodeTypes.has(node.type)) return null;
  if (node.type === 'image' || node.type === 'video' || node.type === 'pdf' || node.type === 'button') {
    const href = safeHref(node.attrs?.src || node.attrs?.href);
    if (!href) return null;
    if (['image', 'video', 'pdf'].includes(node.type) && !/^https:\/\//i.test(href)) return null;
    if (node.type === 'video' && !/^(https:\/\/www\.youtube\.com\/embed\/|https:\/\/player\.vimeo\.com\/video\/|https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)/i.test(href)) return null;
    const width = Number(node.attrs?.width);
    const align = ['left', 'center', 'right'].includes(node.attrs?.align) ? node.attrs.align : 'center';
    return { type: node.type, attrs: { src: href, href, alt: String(node.attrs?.alt || '').slice(0, 300), title: String(node.attrs?.title || '').slice(0, 300), label: String(node.attrs?.label || '').slice(0, 300), width: Number.isFinite(width) ? Math.max(20, Math.min(100, width)) : 100, align } };
  }
  const content = (Array.isArray(node.content) ? node.content : []).slice(0, 1000).map(child => cleanNode(child, depth + 1)).filter(Boolean);
  const align = ['left', 'center', 'right', 'justify'].includes(node.attrs?.align) ? node.attrs.align : undefined;
  if (node.type === 'heading') {
    const level = Number(node.attrs?.level);
    return { type: 'heading', attrs: { level: [1, 2, 3].includes(level) ? level : 2, ...(align ? { align } : {}) }, content };
  }
  return { type: node.type, ...(align && node.type === 'paragraph' ? { attrs: { align } } : {}), content };
}

export function cleanBlogContent(value) {
  // Acepta también el formato anterior de bloques para no perder artículos existentes.
  if (Array.isArray(value)) {
    if (value.length > 250) throw new Error('El artículo tiene demasiados bloques.');
    return value.map(block => {
      if (!block || !['paragraph', 'heading', 'list', 'image', 'video', 'pdf', 'link', 'button'].includes(block.type)) throw new Error('El artículo contiene un bloque no válido.');
      const url = safeHref(block.url);
      if (['image', 'video', 'pdf', 'link', 'button'].includes(block.type) && !url) throw new Error('Los enlaces y archivos deben usar una dirección segura.');
      if (block.type === 'video' && !/^(https:\/\/www\.youtube\.com\/embed\/|https:\/\/player\.vimeo\.com\/video\/|https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)/i.test(url)) throw new Error('Usa un video de YouTube, Vimeo o un archivo de video subido.');
      return { type: block.type, text: String(block.text || '').slice(0, 12000), url, caption: String(block.caption || '').slice(0, 300) };
    });
  }
  const cleaned = cleanNode(value);
  if (!cleaned || cleaned.type !== 'doc') throw new Error('El contenido del artículo no tiene un formato válido.');
  return cleaned;
}

export async function uniqueBlogSlug(title, exceptId = null) {
  const base = slugifyBlog(title) || 'articulo';
  let slug = base;
  for (let n = 2; n < 100; n += 1) {
    const [rows] = await db.execute('SELECT id FROM articulos_blog WHERE slug = ? LIMIT 1', [slug]);
    if (!rows.length || (exceptId && String(rows[0].id) === String(exceptId))) return slug;
    slug = `${base}-${n}`;
  }
  throw new Error('No se pudo generar una dirección única para el artículo.');
}
