import { NextResponse } from 'next/server';
import { ensureBlogTable } from '@/lib/blog';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    await ensureBlogTable();
    const { slug } = await params;
    const [rows] = await db.execute("SELECT id, titulo, slug, resumen, imagen_portada, contenido, publicado_en FROM articulos_blog WHERE slug = ? AND estado = 'publicado' AND publicado_en <= NOW() LIMIT 1", [slug]);
    if (!rows.length) return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    return NextResponse.json({ ...rows[0], contenido: JSON.parse(rows[0].contenido || '[]') });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo cargar el artículo.' }, { status: 500 });
  }
}
