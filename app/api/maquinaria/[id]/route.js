import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [rows] = await db.query(
      'SELECT id, nombre, descripcion, precio, imagenes, estado, created_at FROM maquinaria WHERE id = ?',
      [id]
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error('Error GET maquinaria/id:', err);
    return NextResponse.json({ error: 'Error al cargar el equipo.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, descripcion, precio, imagenes, estado } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const [result] = await db.query(
      'UPDATE maquinaria SET nombre = ?, descripcion = ?, precio = ?, imagenes = ?, estado = ? WHERE id = ?',
      [nombre.trim(), descripcion || null, precio || null, imagenes || null, estado || 'disponible', id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Maquinaria actualizada.' });
  } catch (err) {
    console.error('Error PUT maquinaria:', err);
    return NextResponse.json({ error: 'Error al actualizar maquinaria.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const [result] = await db.query('DELETE FROM maquinaria WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Maquinaria eliminada.' });
  } catch (err) {
    console.error('Error DELETE maquinaria:', err);
    return NextResponse.json({ error: 'Error al eliminar maquinaria.' }, { status: 500 });
  }
}