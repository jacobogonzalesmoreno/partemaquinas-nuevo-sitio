import { NextResponse } from 'next/server';
import { getProductosSchema } from '@/lib/productos-admin';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;
    const schema = await getProductosSchema();
    return NextResponse.json(schema);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo leer el esquema.' }, { status: 500 });
  }
}
