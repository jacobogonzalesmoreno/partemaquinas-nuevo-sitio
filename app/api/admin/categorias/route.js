import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureCategoriasTable, getCategorias } from '@/lib/categorias-admin';

const normalizePayload = payload => {
  const nombre = String(payload?.nombre || '').trim();
  const emoji = String(payload?.emoji || '').trim();
  return { nombre, emoji: emoji || null };
};

export async function GET() {
  try {
    const categorias = await getCategorias();
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo cargar categorias.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await ensureCategoriasTable();
    const body = await request.json();
    const { nombre, emoji } = normalizePayload(body);

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
