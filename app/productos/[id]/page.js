import db from '@/lib/db';
import DetalleClient from './DetalleClient';
import { notFound } from 'next/navigation';

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

  return <DetalleClient producto={productoLimpio} />;
}