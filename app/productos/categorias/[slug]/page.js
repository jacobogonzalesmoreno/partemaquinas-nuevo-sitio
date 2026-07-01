import db from '@/lib/db';
import { MENU_CATEGORIAS_FLAT, MENU_CATEGORIAS } from '@/lib/menu-categorias';
import { slugifyCategoria, productoCoincideCategoriaPorNombre } from '@/lib/catalogo-categorias';
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

  // Consultar TODOS los productos de la base de datos
  const [rows] = await db.execute(
    'SELECT id, sku, nombre, descripcion_corta, categorias, marcas, etiquetas, palabra_clave, imagenes FROM productos'
  );

  // Filtrar usando la función de coincidencia (esto aplica el filtro de Motores)
  const productos = (rows || [])
    .filter(p => productoCoincideCategoriaPorNombre(p, categoriaNombre))
    .map(p => ({
      id: p.id,
      sku: p.sku || '',
      nombre: p.nombre || '',
      descripcion_corta: p.descripcion_corta || '',
      categorias: p.categorias || '',
      marcas: p.marcas || '',
      etiquetas: p.etiquetas || '',
      palabra_clave: p.palabra_clave || '',
      imagenes: p.imagenes || '',
    }));

  return (
    <SlugClient
      productos={productos}
      categoria={categoriaNombre}
      categoriaPadre={categoriaPadre}
      slug={slug}
    />
  );
}