import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { ensureCategoriasTable } from '@/lib/categorias-admin';

const normalizePayload = payload => {
  const nombre = String(payload?.nombre || '').trim();
  const emoji = String(payload?.emoji || '').trim();
  return { nombre, emoji: emoji || null };
};

export async function PUT(request, { params }) {
  try {
    await ensureCategoriasTable();
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { nombre, emoji } = normalizePayload(body);

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const [result] = await db.query('UPDATE categorias SET nombre = ?, emoji = ? WHERE id = ?', [nombre, emoji, id]);
    return NextResponse.json({ updated: result.affectedRows });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'La categoria ya existe.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo actualizar la categoria.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await ensureCategoriasTable();
    const { id } = await Promise.resolve(params);
    const [result] = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    return NextResponse.json({ deleted: result.affectedRows });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo eliminar la categoria.' }, { status: 500 });
  }
}
