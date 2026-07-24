import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET() {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, descripcion, precio, imagenes, estado, created_at FROM maquinaria ORDER BY created_at DESC'
    );
    return NextResponse.json(rows);
  } catch (err) {
    console.error('Error GET maquinaria:', err);
    return NextResponse.json({ error: 'Error al cargar maquinaria.' }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { nombre, descripcion, precio, imagenes, estado } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const [result] = await db.query(
      'INSERT INTO maquinaria (nombre, descripcion, precio, imagenes, estado) VALUES (?, ?, ?, ?, ?)',
      [nombre.trim(), descripcion || null, precio || null, imagenes || null, estado || 'disponible']
    );

    return NextResponse.json({ id: result.insertId, message: 'Maquinaria creada.' }, { status: 201 });
  } catch (err) {
    console.error('Error POST maquinaria:', err);
    return NextResponse.json({ error: 'Error al crear maquinaria.' }, { status: 500 });
  }
}