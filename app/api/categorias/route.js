import { NextResponse } from 'next/server';
import { getCategorias } from '@/lib/categorias-admin';

export async function GET() {
  try {
    const categorias = await getCategorias();
    return NextResponse.json(categorias);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo cargar categorias.' }, { status: 500 });
  }
}
