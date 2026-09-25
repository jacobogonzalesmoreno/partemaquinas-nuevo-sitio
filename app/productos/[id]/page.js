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

  const imagen = String(productoLimpio.imagenes).split(/[\n,;|]+/).map(value => value.trim()).find(Boolean);
  const schema = { '@context': 'https://schema.org', '@type': 'Product', name: productoLimpio.nombre, description: productoLimpio.descripcion_corta || undefined, sku: productoLimpio.sku || undefined, brand: productoLimpio.marcas ? { '@type': 'Brand', name: productoLimpio.marcas } : undefined, image: imagen ? [imagen] : undefined, url: `https://partemaquinas.com/productos/${id}` };
  return <><nav aria-label="Migas de pan" className="mx-auto w-full max-w-7xl px-4 py-3 text-sm text-slate-600"><ol className="flex flex-wrap gap-2"><li><Link href="/">Inicio</Link></li><li aria-hidden="true">/</li><li><Link href="/productos">Productos</Link></li><li aria-hidden="true">/</li><li aria-current="page">{productoLimpio.nombre}</li></ol></nav><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} /><DetalleClient producto={productoLimpio} /></>;
}
