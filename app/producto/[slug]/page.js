import db from '@/lib/db';
import { notFound, permanentRedirect } from 'next/navigation';

const slugifyProducto = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export const dynamic = 'force-dynamic';

export default async function LegacyProductoPage({ params }) {
  const { slug } = await params;
  const [rows] = await db.execute('SELECT id, nombre FROM productos WHERE nombre IS NOT NULL');
  const matches = (rows || []).filter(producto => slugifyProducto(producto.nombre) === slug);

  // Redirigir solo si la URL antigua identifica un único producto vigente.
  if (matches.length !== 1) notFound();
  permanentRedirect(`/productos/${encodeURIComponent(matches[0].id)}`);
}
