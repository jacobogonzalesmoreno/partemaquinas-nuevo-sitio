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
    const tokens = normalizarClave(queryNormalizada)
      .split(/\s+/)
      .filter(t => t.length >= 2);

    if (tokens.length === 0) {
      return NextResponse.json({ productos: [] });
    }

    // Construir cláusula WHERE con LIKE para cada token
    const likeConditions = [];
    const likeParams = [];

    for (const token of tokens) {
      const likePattern = `%${token}%`;
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
      // Fallback: buscar con solo el primer token
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
 * Rankea productos usando fuzzy scoring con bonificación para motores completos.
 * Los motores tienen nombres más cortos (ej: "Motor Komatsu 6BG1") vs sus partes
 * (ej: "Bomba de inyeccion para motor Komatsu 6BG1"). Se aplica un bonus
 * inversamente proporcional a la longitud del nombre.
 */
function rankearProductos(query, productos, limit) {
  // Calcular la longitud promedio de los nombres candidatos
  const longitudes = productos.map(p => (p.nombre || '').length);
  const promedioLongitud = longitudes.length > 0
    ? longitudes.reduce((a, b) => a + b, 0) / longitudes.length
    : 50;

  const scored = productos.map(p => {
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

    // Bonus por nombre corto: los motores completos suelen tener nombres
    // más concisos ("Motor Marca Modelo" vs "Parte para Motor Marca Modelo")
    const nombreLen = (p.nombre || '').length;
    let bonusNombreCorto = 0;
    if (nombreLen > 0 && nombreLen < promedioLongitud) {
      // Cuanto más corto respecto al promedio, mayor el bonus
      const ratio = promedioLongitud / Math.max(nombreLen, 1);
      // Ratio de 1.0 = promedio, 2.0 = la mitad del promedio
      // Bonus máximo de +15 para nombres muy cortos
      bonusNombreCorto = Math.min(15, Math.max(0, (ratio - 1) * 15));
    }

    // Bonus extra si el nombre empieza con "Motor" y es corto (motor completo)
    const nombreNorm = (p.nombre || '').toLowerCase().trim();
    let bonusMotorDirecto = 0;
    if (nombreNorm.startsWith('motor') && nombreLen < promedioLongitud * 0.8) {
      bonusMotorDirecto = 10;
    }

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
      puntuacion: puntuacion + bonusNombreCorto + bonusMotorDirecto,
      tipo,
    };
  });

  // Filtrar los que tengan puntuación significativa y ordenar
  return scored
    .filter(p => p.puntuacion >= 20)
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, limit);
}