import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db';
import { ensureCategoriasTable, getCategorias } from '@/lib/categorias-admin';
import { requireRole } from '@/lib/auth';

const normalizePayload = payload => {
  const nombre = String(payload?.nombre || '').trim();
  const emoji = String(payload?.emoji || '').trim();
  return { nombre, emoji: emoji || null };
};

const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(255),
  emoji: z.string().trim().max(32).optional().nullable(),
});

export async function GET(request) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;
    const categorias = await getCategorias();
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo cargar categorias.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = requireRole(request, 'admin');
    if (!auth.ok) return auth.response;
    await ensureCategoriasTable();
    const body = await request.json();
    const parsed = categoriaSchema.safeParse(normalizePayload(body));

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos.' }, { status: 400 });
    }

    const { nombre, emoji } = parsed.data;

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const [result] = await db.query('INSERT INTO categorias (nombre, emoji) VALUES (?, ?)', [nombre, emoji]);
    return NextResponse.json({ id: result.insertId });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'La categoria ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo crear la categoria.' }, { status: 500 });
  }
}
