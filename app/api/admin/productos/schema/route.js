import { NextResponse } from 'next/server';
import { getProductosSchema } from '@/lib/productos-admin';

export async function GET() {
  try {
    const schema = await getProductosSchema();
    return NextResponse.json(schema);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo leer el esquema.' }, { status: 500 });
  }
}
