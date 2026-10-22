import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { cleanBlogContent, ensureBlogTable, uniqueBlogSlug } from '@/lib/blog';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;
    await ensureBlogTable();
    const input = await request.json();
    const title = String(input.titulo || '').trim().slice(0, 220);
    const summary = String(input.resumen || '').trim().slice(0, 500);
    if (!title || !summary) return NextResponse.json({ error: 'Escribe el título y un resumen.' }, { status: 400 });
    const content = cleanBlogContent(input.contenido);
    const status = input.estado === 'publicado' ? 'publicado' : 'borrador';
    const slug = await uniqueBlogSlug(input.titulo);
    const cover = String(input.imagen_portada || '').trim().slice(0, 2000) || null;
    const publishedAt = status === 'publicado' ? new Date() : null;
    const [result] = await db.execute('INSERT INTO articulos_blog (titulo, slug, resumen, imagen_portada, contenido, estado, publicado_en) VALUES (?, ?, ?, ?, ?, ?, ?)', [title, slug, summary, cover, JSON.stringify(content), status, publishedAt]);
    return NextResponse.json({ id: result.insertId, slug, estado: status }, { status: 201 });
  } catch (error) {
    console.error('Blog create error:', error?.name || 'unknown');
    return NextResponse.json({ error: error.message || 'No se pudo guardar el artículo.' }, { status: 400 });
  }
}
