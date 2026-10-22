import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireRole } from '@/lib/auth';
import { ensureBlogTable } from '@/lib/blog';
import db from '@/lib/db';

export async function POST(request, { params }) {
  const auth = requireRole(request, 'editor');
  if (!auth.ok) return auth.response;
  try {
    await ensureBlogTable();
    const { id } = await params;
    const [articles] = await db.execute('SELECT id FROM articulos_blog WHERE id = ? LIMIT 1', [id]);
    if (!articles.length) return NextResponse.json({ error: 'Artículo no encontrado.' }, { status: 404 });
    const token = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    // Keep every shared draft link valid. Reviewers often open the link later,
    // so generating a new one must not invalidate an older message.
    await db.execute('INSERT INTO articulos_blog_previews (articulo_id, token_hash) VALUES (?, ?)', [id, tokenHash]);
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Blog preview token error:', error?.name || 'unknown');
    return NextResponse.json({ error: 'No se pudo generar la vista previa.' }, { status: 500 });
  }
}
