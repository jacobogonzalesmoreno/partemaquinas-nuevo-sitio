import { MENU_CATEGORIAS_FLAT, MENU_CATEGORIAS } from '@/lib/menu-categorias';
import { slugifyCategoria } from '@/lib/catalogo-categorias';
import SlugClient from './SlugClient';
import { notFound } from 'next/navigation';

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
    <SlugClient
      categoria={categoriaNombre}
      categoriaPadre={categoriaPadre}
    />
  );
}
