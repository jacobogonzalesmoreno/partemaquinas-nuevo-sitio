import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db';
import { ensureCategoriasTable } from '@/lib/categorias-admin';
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

const idSchema = z.string().regex(/^\d+$/);

export async function PUT(request, { params }) {
  try {
    const auth = requireRole(request, 'admin');
    if (!auth.ok) return auth.response;
    await ensureCategoriasTable();
    const { id } = await Promise.resolve(params);
    const parsedId = idSchema.safeParse(String(id));
    if (!parsedId.success) {
      return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = categoriaSchema.safeParse(normalizePayload(body));

    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos invalidos.' }, { status: 400 });
    }

    const { nombre, emoji } = parsed.data;

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
    const auth = requireRole(request, 'admin');
    if (!auth.ok) return auth.response;
    await ensureCategoriasTable();
    const { id } = await Promise.resolve(params);
    const parsedId = idSchema.safeParse(String(id));
    if (!parsedId.success) {
      return NextResponse.json({ error: 'ID invalido.' }, { status: 400 });
    }
    const [result] = await db.query('DELETE FROM categorias WHERE id = ?', [id]);
    return NextResponse.json({ deleted: result.affectedRows });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo eliminar la categoria.' }, { status: 500 });
  }
}
