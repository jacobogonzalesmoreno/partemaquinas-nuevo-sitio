import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProductosSchema, pickWritableFields, validateWritablePayload } from '@/lib/productos-admin';
import { productoCoincideCategoriaPorNombre } from '@/lib/catalogo-categorias';
import { requireRole } from '@/lib/auth';

const querySchema = z.object({
  buscar: z.string().trim().max(100).optional(),
  categoria: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  page: z.coerce.number().int().min(1).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    buscar: searchParams.get('buscar') || undefined,
    categoria: searchParams.get('categoria') || undefined,
    limit: searchParams.get('limit') || undefined,
    page: searchParams.get('page') || undefined,
    offset: searchParams.get('offset') || undefined,
  });

  if (!parsedQuery.success) {
    return NextResponse.json({ error: 'Parametros invalidos.' }, { status: 400 });
  }

  const { buscar, categoria, limit: parsedLimit, page: parsedPage, offset: parsedOffset } = parsedQuery.data;
  const limit = parsedLimit ?? 100;

  let offset = 0;
  if (Number.isFinite(parsedOffset)) {
    offset = parsedOffset;
  } else {
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
    const listQuery = `SELECT * FROM productos${whereClause} ORDER BY nombre ASC`;
    const [rows] = await db.query(listQuery, params);
    const filtered = rows.filter(row => productoCoincideCategoriaPorNombre(row, categoria));
    const total = filtered.length;
    const paged = filtered.slice(offset, offset + limit);
    const response = NextResponse.json(paged);
    response.headers.set('X-Total-Count', String(total));
    return response;
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
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const schema = await getProductosSchema();
    const validation = validateWritablePayload(body, schema);
    if (!validation.ok) {
      return NextResponse.json({ error: 'Datos invalidos.', details: validation.errors }, { status: 400 });
    }
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
