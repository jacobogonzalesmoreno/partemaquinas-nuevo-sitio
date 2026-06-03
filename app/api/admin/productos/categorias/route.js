import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { getCategorias } from '@/lib/categorias-admin';
import { parseCategoriasValue } from '@/lib/categorias';
import { requireRole } from '@/lib/auth';

export async function GET(request) {
  try {
    const auth = requireRole(request, 'editor');
    if (!auth.ok) return auth.response;
    const categorias = await getCategorias();
    if (categorias.length > 0) {
      return NextResponse.json(categorias.map(item => item.nombre));
    }

    const [rows] = await db.query('SELECT categorias FROM productos');
    const categoriasSet = new Set();

    rows.forEach(row => {
      const parsed = parseCategoriasValue(row?.categorias);
      parsed.forEach(item => {
        if (item) categoriasSet.add(item);
      });
    });

    const lista = Array.from(categoriasSet).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    return NextResponse.json(lista);
  } catch (error) {
    return NextResponse.json({ error: 'No se pudo cargar categorias.' }, { status: 500 });
  }
}
