import db from '@/lib/db';
import DetalleClient from './DetalleClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const [rows] = await db.execute('SELECT nombre, descripcion_corta FROM productos WHERE id = ?', [id]);
  const producto = rows?.[0];
  if (!producto) return { title: 'Producto no encontrado' };
  const description = String(producto.descripcion_corta || `Consulta disponibilidad y compatibilidad de ${producto.nombre} para maquinaria pesada.`).slice(0, 160);
  return { title: `${producto.nombre} | Repuestos para maquinaria pesada`, description, alternates: { canonical: `/productos/${id}` }, openGraph: { title: producto.nombre, description, type: 'website' } };
}

export const dynamic = 'force-dynamic';

export default async function ProductoDetalle({ params }) {
  const { id } = await params;

  const [rows] = await db.execute(
    'SELECT id, sku, nombre, descripcion_corta, categorias, marcas, etiquetas, palabra_clave, imagenes FROM productos WHERE id = ?',
    [id]
  );

  const producto = rows?.[0] || null;

  if (!producto) {
    notFound();
  }

  // Convertir a objeto plano para pasar al cliente
  const productoLimpio = {
    id: producto.id,
    sku: producto.sku || '',
    nombre: producto.nombre || '',
    descripcion_corta: producto.descripcion_corta || '',
    categorias: producto.categorias || '',
    marcas: producto.marcas || '',
    etiquetas: producto.etiquetas || '',
    palabra_clave: producto.palabra_clave || '',
    imagenes: producto.imagenes || '',
  };

  const nombreProducto = String(productoLimpio.nombre).trim();
  const modelo3d = /isuzu\s*6bg1/i.test(nombreProducto)
    ? { nombre: 'motor Isuzu 6BG1', archivo: 'motor-isuzu-6bg1.glb' }
    : /isuzu\s*4hk1/i.test(nombreProducto)
      ? { nombre: 'motor Isuzu 4HK1', archivo: 'motor-isuzu-4hk1.glb' }
    : /isuzu\s*6hk1/i.test(nombreProducto)
      ? { nombre: 'motor Isuzu 6HK1', archivo: 'motor-isuzu-6hk1.glb' }
    : /doosan\s*db\s*58/i.test(nombreProducto)
      ? { nombre: 'motor Doosan DB58', archivo: 'motor-doosan-db58.glb' }
      : /caterpillar\s*3066/i.test(nombreProducto)
        ? { nombre: 'motor Caterpillar 3066', archivo: 'motor-caterpillar-3066.glb' }
        : /cummins\s*6bt5\.9/i.test(nombreProducto)
          ? { nombre: 'motor Cummins 6BT5.9', archivo: 'motor-cummins-6bt59.glb' }
          : /cummins\s*n\s*14/i.test(nombreProducto)
            ? { nombre: 'motor Cummins N14 remanufacturado', archivo: 'motor-cummins-n14-remanufacturado.glb' }
            : /cummins\s*isx/i.test(nombreProducto)
              ? { nombre: 'motor Cummins ISX remanufacturado', archivo: 'motor-cummins-isx-remanufacturado.glb' }
              : /hino\s*j\s*08/i.test(nombreProducto)
                ? { nombre: 'motor Hino J08', archivo: 'motor-hino-j08.glb' }
                : String(productoLimpio.sku).trim().toUpperCase() === 'MM6D34'
                  ? { nombre: 'motor Mitsubishi 6D34', archivo: 'motor-mitsubishi-6d34-remanufacturado.glb' }
                  : String(productoLimpio.sku).trim().toUpperCase() === 'MM346D34'
                    ? { nombre: 'motor Mitsubishi 6D34 (3/4)', archivo: 'motor-mitsubishi-6d34.glb' }
                    : String(productoLimpio.sku).trim().toUpperCase() === 'MS6D34'
                      ? { nombre: 'motor Mitsubishi 6D34', archivo: 'motor-mitsubishi-ms6d34.glb' }
                  : null;

  const imagen = String(productoLimpio.imagenes).split(/[\n,;|]+/).map(value => value.trim()).find(Boolean);
  const schema = { '@context': 'https://schema.org', '@type': 'Product', name: productoLimpio.nombre, description: productoLimpio.descripcion_corta || undefined, sku: productoLimpio.sku || undefined, brand: productoLimpio.marcas ? { '@type': 'Brand', name: productoLimpio.marcas } : undefined, image: imagen ? [imagen] : undefined, url: `https://partemaquinas.com/productos/${id}` };
  return <><nav aria-label="Migas de pan" className="mx-auto w-full max-w-7xl px-4 py-3 text-sm text-slate-600"><ol className="flex flex-wrap gap-2"><li><Link href="/">Inicio</Link></li><li aria-hidden="true">/</li><li><Link href="/productos">Productos</Link></li><li aria-hidden="true">/</li><li aria-current="page">{productoLimpio.nombre}</li></ol></nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /><DetalleClient producto={productoLimpio} modelo3d={modelo3d} /></>;
}
