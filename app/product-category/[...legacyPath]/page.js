import { permanentRedirect, notFound } from 'next/navigation';

const legacyCategories = new Map([
  ['motores-de-giro', 'motor-giro'],
  ['reductores-giro', 'reductor-giro'],
  ['bloques-motor-para-excavadoras', 'bloques'],
]);

export default async function LegacyCategoryPage({ params }) {
  const { legacyPath = [] } = await params;
  const oldSlug = legacyPath[0];
  const destination = legacyCategories.get(oldSlug);
  if (!destination) notFound();
  permanentRedirect(`/productos/categorias/${destination}`);
}
