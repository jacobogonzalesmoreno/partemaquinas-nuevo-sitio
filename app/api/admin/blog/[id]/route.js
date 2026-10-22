import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { cleanBlogContent, ensureBlogTable, uniqueBlogSlug } from '@/lib/blog';
import db from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;
    await ensureBlogTable();
    const { id } = await params;
    const input = await request.json();
    const title = String(input.titulo || '').trim().slice(0, 220);
    const summary = String(input.resumen || '').trim().slice(0, 500);
    if (!title || !summary) return NextResponse.json({ error: 'Escribe el título y un resumen.' }, { status: 400 });
    const content = cleanBlogContent(input.contenido);
    const status = input.estado === 'publicado' ? 'publicado' : 'borrador';
    const slug = await uniqueBlogSlug(title, id);
    const cover = String(input.imagen_portada || '').trim().slice(0, 2000) || null;
    const [existing] = await db.execute('SELECT publicado_en FROM articulos_blog WHERE id = ? LIMIT 1', [id]);
    if (!existing.length) return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    const publishedAt = status === 'publicado' ? (existing[0].publicado_en || new Date()) : null;
    await db.execute('UPDATE articulos_blog SET titulo = ?, slug = ?, resumen = ?, imagen_portada = ?, contenido = ?, estado = ?, publicado_en = ? WHERE id = ?', [title, slug, summary, cover, JSON.stringify(content), status, publishedAt, id]);
    return NextResponse.json({ id, slug, estado: status });
  } catch (error) {
    console.error('Blog update error:', error?.name || 'unknown');
    return NextResponse.json({ error: error.message || 'No se pudo actualizar el artículo.' }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireRole(request, 'editor');
  if (!auth.ok) return auth.response;
  try {
    await ensureBlogTable();
    const { id } = await params;
    const [result] = await db.execute('DELETE FROM articulos_blog WHERE id = ?', [id]);
    if (!result.affectedRows) return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo eliminar el artículo.' }, { status: 500 });
  }
}
