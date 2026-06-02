import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getProductosSchema, pickWritableFields } from '@/lib/productos-admin';

export async function GET(request, { params }) {
  const { id } = await Promise.resolve(params);
  const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

export async function PUT(request, { params }) {
  const { id } = await Promise.resolve(params);

  try {
    const body = await request.json();
    const schema = await getProductosSchema();
    const writableSchema = schema.filter(column => column.name !== 'id');
    const payload = pickWritableFields(body, writableSchema);
    const columns = Object.keys(payload);

    if (columns.length === 0) {
      return NextResponse.json({ error: 'No hay campos validos para actualizar.' }, { status: 400 });
    }

    const setClause = columns.map(column => `${column} = ?`).join(', ');
    const values = columns.map(column => payload[column]);
    values.push(id);

    const [result] = await db.query(`UPDATE productos SET ${setClause} WHERE id = ?`, values);
    return NextResponse.json({ updated: result.affectedRows });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo actualizar el producto.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await Promise.resolve(params);

  try {
    const [result] = await db.query('DELETE FROM productos WHERE id = ?', [id]);
    return NextResponse.json({ deleted: result.affectedRows });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo eliminar el producto.' }, { status: 500 });
  }
}