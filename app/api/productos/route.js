import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getProductosSchema, pickWritableFields } from '@/lib/productos-admin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const buscar = searchParams.get('buscar');
  const categoria = searchParams.get('categoria');
  const rawLimit = searchParams.get('limit');
  const rawPage = searchParams.get('page');
  const rawOffset = searchParams.get('offset');
  const parsedLimit = rawLimit ? Number(rawLimit) : 100;
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 1000) : 100;

  let offset = 0;
  const parsedOffset = rawOffset ? Number(rawOffset) : null;
  if (Number.isFinite(parsedOffset) && parsedOffset >= 0) {
    offset = parsedOffset;
  } else {
    const parsedPage = rawPage ? Number(rawPage) : 1;
    if (Number.isFinite(parsedPage) && parsedPage > 1) {
      offset = (parsedPage - 1) * limit;
    }
  }

  let whereClause = ' WHERE 1=1';
  const params = [];

  if (buscar) {
    whereClause += ' AND (LOWER(nombre) LIKE ? OR LOWER(descripcion_corta) LIKE ? OR LOWER(categorias) LIKE ? OR LOWER(marcas) LIKE ?)';
    const buscarLower = `%${buscar.toLowerCase()}%`;
    params.push(buscarLower, buscarLower, buscarLower, buscarLower);
  }

  if (categoria) {
    whereClause += ' AND (LOWER(categorias) LIKE ? OR LOWER(nombre) LIKE ?)';
    const categoriaLower = `%${categoria.toLowerCase()}%`;
    params.push(categoriaLower, categoriaLower);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM productos${whereClause}`;
  const listQuery = `SELECT * FROM productos${whereClause} ORDER BY nombre ASC LIMIT ? OFFSET ?`;

  const [countRows] = await db.query(countQuery, params);
  const total = countRows?.[0]?.total ?? 0;

  const listParams = [...params, limit, offset];
  const [rows] = await db.query(listQuery, listParams);
  const response = NextResponse.json(rows);
  response.headers.set('X-Total-Count', String(total));
  return response;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const schema = await getProductosSchema();
    const writableSchema = schema.filter(column => column.name !== 'id');
    const payload = pickWritableFields(body, writableSchema);
    const columns = Object.keys(payload);

    if (columns.length === 0) {
      return NextResponse.json({ error: 'No hay campos validos para guardar.' }, { status: 400 });
    }

    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(column => payload[column]);
    const query = `INSERT INTO productos (${columns.join(', ')}) VALUES (${placeholders})`;

    const [result] = await db.query(query, values);
    return NextResponse.json({ id: result.insertId });
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo crear el producto.' }, { status: 500 });
  }
}
