import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { puntuarCoincidencia, normalizarQueryBusqueda, normalizarClave } from '@/lib/busqueda-tolerante';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/buscar?q=balancin+inyeccion&limit=5
 *
 * Búsqueda de productos con tolerancia máxima:
 * 1. SQL LIKE para filtrar candidatos (rápido, amplio)
 * 2. Scoring fuzzy en JavaScript (preciso, tolerante)
 * 3. Retorna productos ordenados por relevancia
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 20);

    if (!q || q.length < 2) {
      return NextResponse.json({ productos: [] });
    }

    // Normalizar y corregir el query
    const queryNormalizada = normalizarQueryBusqueda(q);

    // --- Paso 1: Filtrado SQL con LIKE (generoso) ---
    // Separar en tokens y crear condiciones LIKE para cada uno
    const tokens = normalizarClave(queryNormalizada)
      .split(/\s+/)
      .filter(t => t.length >= 2);

    if (tokens.length === 0) {
      return NextResponse.json({ productos: [] });
    }

    // Construir cláusula WHERE con LIKE para cada token
    // Busca en: nombre, sku, marcas, categorias, etiquetas, palabra_clave
    const likeConditions = [];
    const likeParams = [];

    for (const token of tokens) {
      const likePattern = `%${token}%`;
      // Para cada token, buscar en múltiples campos (OR entre campos, AND entre tokens)
      const tokenConditions = [
        'LOWER(p.nombre) LIKE LOWER(?)',
        'LOWER(p.sku) LIKE LOWER(?)',
        'LOWER(p.marcas) LIKE LOWER(?)',
        'LOWER(p.categorias) LIKE LOWER(?)',
        'LOWER(p.etiquetas) LIKE LOWER(?)',
        'LOWER(p.palabra_clave) LIKE LOWER(?)',
        'LOWER(p.descripcion_corta) LIKE LOWER(?)',
      ];
      likeConditions.push(`(${tokenConditions.join(' OR ')})`);
      for (let i = 0; i < tokenConditions.length; i++) {
        likeParams.push(likePattern);
      }
    }

    // AND entre tokens = todos los tokens deben aparecer en algún campo
    const whereClause = likeConditions.join(' AND ');

    const sql = `
      SELECT
        p.id,
        p.sku,
        p.nombre,
        p.descripcion_corta,
        p.categorias,
        p.marcas,
        p.etiquetas,
        p.palabra_clave,
        p.imagenes
      FROM productos p
      WHERE ${whereClause}
      LIMIT 100
    `;

    const [candidatos] = await db.execute(sql, likeParams);

    if (!candidatos || candidatos.length === 0) {
      // Fallback: buscar con solo el primer token (más generoso)
      if (tokens.length > 1) {
        const firstToken = tokens[0];
        const fallbackPattern = `%${firstToken}%`;
        const fallbackSql = `
          SELECT
            p.id, p.sku, p.nombre, p.descripcion_corta,
            p.categorias, p.marcas, p.etiquetas, p.palabra_clave, p.imagenes
          FROM productos p
          WHERE LOWER(p.nombre) LIKE LOWER(?)
             OR LOWER(p.sku) LIKE LOWER(?)
             OR LOWER(p.marcas) LIKE LOWER(?)
             OR LOWER(p.categorias) LIKE LOWER(?)
             OR LOWER(p.palabra_clave) LIKE LOWER(?)
          LIMIT 100
        `;
        const [fallbackResults] = await db.execute(fallbackSql, [
          fallbackPattern, fallbackPattern, fallbackPattern,
          fallbackPattern, fallbackPattern,
        ]);

        if (!fallbackResults || fallbackResults.length === 0) {
          return NextResponse.json({ productos: [] });
        }

        return NextResponse.json({
          productos: rankearProductos(queryNormalizada, fallbackResults, limit),
        });
      }

      return NextResponse.json({ productos: [] });
    }

    // --- Paso 2: Scoring fuzzy en JavaScript ---
    const productos = rankearProductos(queryNormalizada, candidatos, limit);

    return NextResponse.json({ productos });
  } catch (error) {
    console.error('[API /api/buscar] Error:', error);
    return NextResponse.json(
      { productos: [], error: 'Error interno en la búsqueda' },
      { status: 500 }
    );
  }
}

/**
 * Rankea productos usando fuzzy scoring.
 * Combina múltiples campos del producto para calcular la puntuación.
 */
function rankearProductos(query, productos, limit) {
  const scored = productos.map(p => {
    // Construir texto compuesto con todos los campos buscables
    const textoBuscable = [
      p.nombre || '',
      p.sku || '',
      p.marcas || '',
      p.categorias || '',
      p.etiquetas || '',
      p.palabra_clave || '',
      p.descripcion_corta || '',
    ].join(' ');

    const { puntuacion, tipo } = puntuarCoincidencia(query, textoBuscable);

    // Extraer primera imagen si existe
    const imagenes = (p.imagenes || '').split(',').map(s => s.trim()).filter(Boolean);
    const imagen = imagenes[0] || null;

    return {
      id: p.id,
      sku: p.sku || '',
      nombre: p.nombre || '',
      descripcion_corta: p.descripcion_corta || '',
      categorias: p.categorias || '',
      marcas: p.marcas || '',
      imagen,
      puntuacion,
      tipo,
    };
  });

  // Filtrar los que tengan puntuación significativa y ordenar
  return scored
    .filter(p => p.puntuacion >= 20)
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, limit);
}