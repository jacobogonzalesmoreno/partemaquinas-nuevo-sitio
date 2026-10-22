import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { ensureBlogTable } from '@/lib/blog';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureBlogTable();
    const admin = new URL(request.url).searchParams.get('admin') === '1';
    if (admin) {
      const auth = requireRole(request, 'editor');
      if (!auth.ok) return auth.response;
    }
    const [rows] = admin
      ? await db.query('SELECT id, titulo, slug, resumen, imagen_portada, contenido, estado, publicado_en, created_at, updated_at FROM articulos_blog ORDER BY updated_at DESC')
      : await db.query("SELECT id, titulo, slug, resumen, imagen_portada, publicado_en FROM articulos_blog WHERE estado = 'publicado' AND publicado_en <= NOW() ORDER BY publicado_en DESC");
    return NextResponse.json(rows.map(row => ({ ...row, contenido: admin ? JSON.parse(row.contenido || '[]') : undefined })));
  } catch (error) {
    console.error('Blog list error:', error?.name || 'unknown');
    return NextResponse.json({ error: 'No se pudieron cargar los artículos.' }, { status: 500 });
  }
}
