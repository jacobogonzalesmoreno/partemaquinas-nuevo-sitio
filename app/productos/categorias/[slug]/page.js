import { MENU_CATEGORIAS_FLAT, MENU_CATEGORIAS } from '@/lib/menu-categorias';
import { slugifyCategoria } from '@/lib/catalogo-categorias';
import SlugClient from './SlugClient';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const name = MENU_CATEGORIAS_FLAT.find(cat => slugifyCategoria(cat) === slug);
  if (!name) return { title: 'Categoría no encontrada' };
  const description = `Explora repuestos de ${name} para maquinaria pesada. Consulta disponibilidad, referencias y compatibilidad con nuestro equipo en Medellín.`;
  return { title: `Repuestos de ${name} | ParteMáquinas`, description, alternates: { canonical: `/productos/categorias/${slug}` } };
}

export const dynamic = 'force-dynamic';

export default async function CategoriaSlugPage({ params }) {
  const { slug } = await params;

  // Buscar el nombre de categoría que coincide con el slug
  const categoriaNombre = MENU_CATEGORIAS_FLAT.find(
    cat => slugifyCategoria(cat) === slug
  );

  if (!categoriaNombre) {
    notFound();
  }

  // Buscar la categoría padre para el breadcrumb
  let categoriaPadre = null;
  for (const cat of MENU_CATEGORIAS) {
    if (slugifyCategoria(cat.nombre) === slug) {
      break;
    }
    if (cat.hijos) {
      for (const hijo of cat.hijos) {
        if (slugifyCategoria(hijo.nombre) === slug) {
          categoriaPadre = cat.nombre;
          break;
        }
        if (hijo.hijos) {
          for (const nieto of hijo.hijos) {
            if (slugifyCategoria(nieto.nombre) === slug) {
              categoriaPadre = hijo.nombre;
              break;
            }
          }
        }
      }
    }
    if (categoriaPadre) break;
  }

  return (
    <><nav aria-label="Migas de pan" className="mx-auto w-full max-w-7xl px-4 py-3 text-sm text-slate-600"><ol className="flex flex-wrap gap-2"><li><Link href="/">Inicio</Link></li><li aria-hidden="true">/</li><li><Link href="/productos">Productos</Link></li>{categoriaPadre && <><li aria-hidden="true">/</li><li><Link href={`/productos/categorias/${slugifyCategoria(categoriaPadre)}`}>{categoriaPadre}</Link></li></>}<li aria-hidden="true">/</li><li aria-current="page">{categoriaNombre}</li></ol></nav><SlugClient
      categoria={categoriaNombre}
      categoriaPadre={categoriaPadre}
    /></>
  );
}
