'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getImagenesProducto } from '@/lib/imagenes';
import { slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';

const CATALOGO_URL_KEY = 'catalogoListadoUrl';
const CATALOGO_SCROLL_KEY = 'catalogoListadoScroll';
const PORTADAS_CATEGORIA = {
  giro: '/categorias/giro-portada.png',
  motores: '/categorias/motores-portada.png',
  ventiladores: '/categorias/ventiladores-portada.png',
};

const obtenerClasesTarjeta = nivel => {
  if (nivel === 0) return { wrapper: 'rounded-[28px]', image: 'aspect-[6/5]', padding: 'px-6 py-5', title: 'text-2xl', label: 'Categoria', icon: 'h-11 w-11 text-xl', cardTone: 'border-slate-200 bg-white', imageTone: 'bg-slate-100', labelTone: 'text-slate-400' };
  if (nivel === 1) return { wrapper: 'rounded-[20px]', image: 'aspect-[6/5]', padding: 'px-4 py-3', title: 'text-lg', label: 'Subcategoria', icon: 'h-9 w-9 text-base', cardTone: 'border-orange-200 bg-orange-50/70', imageTone: 'bg-orange-100/60', labelTone: 'text-orange-500' };
  return { wrapper: 'rounded-[18px]', image: 'aspect-[6/5]', padding: 'px-3.5 py-3', title: 'text-base', label: 'Subnivel', icon: 'h-8 w-8 text-sm', cardTone: 'border-sky-200 bg-sky-50/70', imageTone: 'bg-sky-100/70', labelTone: 'text-sky-600' };
};

function TarjetaCategoria({ categoria, nivel, categoriasConImagenError, setCategoriasConImagenError, hrefCategoria, onNavigate }) {
  const slug = slugifyCategoria(categoria.nombre);
  const rutaImagen = PORTADAS_CATEGORIA[slug] || `/categorias/${slug}.png`;
  const tieneError = Boolean(categoriasConImagenError[slug]);
  const c = obtenerClasesTarjeta(nivel);
  return (
    <Link href={hrefCategoria(categoria.nombre)} onClick={onNavigate}
      className={`group overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl ${c.wrapper} ${c.cardTone}`}>
      <div className={`relative overflow-hidden ${c.imageTone} ${c.image}`}>
        {!tieneError ? (
          <Image src={rutaImagen} alt={categoria.nombre} fill sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-contain"
            onError={() => setCategoriasConImagenError(prev => ({ ...prev, [slug]: true }))} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
            <svg className="h-10 w-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></svg>
            <p className="text-base font-semibold text-slate-800">Imagen de {categoria.nombre}</p>
          </div>
        )}
      </div>
      <div className={`flex items-center justify-between gap-4 ${c.padding}`}>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.32em] ${c.labelTone}`}>{c.label}</p>
          <h3 className={`mt-2 font-bold text-slate-900 ${c.title}`}>{categoria.nombre}</h3>
        </div>
        <span className={`inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-500 transition-transform duration-300 group-hover:translate-x-1 ${c.icon}`}>›</span>
      </div>
    </Link>
  );
}

function BloqueCategorias({ items, nivel, categoriasConImagenError, setCategoriasConImagenError, hrefCategoria, onNavigate }) {
  if (!items?.length) return null;
  const columnas = nivel === 0 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : nivel === 1 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
  return (
    <div className={`grid ${nivel === 0 ? 'gap-6' : 'gap-3'} ${columnas}`}>
      {items.map(cat => (
        <TarjetaCategoria key={`${nivel}-${cat.nombre}`} categoria={cat} nivel={nivel}
          categoriasConImagenError={categoriasConImagenError} setCategoriasConImagenError={setCategoriasConImagenError}
          hrefCategoria={hrefCategoria} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function ProductosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buscarInicial = searchParams.get('buscar') || '';
  const [categoriasConImagenError, setCategoriasConImagenError] = useState({});
  const [productos, setProductos] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(() => Boolean(buscarInicial));
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState({ marcas: [], categorias: [] });
  const [paginaResultados, setPaginaResultados] = useState(1);

  // --- Boton flotante volver arriba ---
  const [mostrarBtnArriba, setMostrarBtnArriba] = useState(false);

  // Mostrar/ocultar boton flotante "volver arriba"
  useEffect(() => {
    const handler = () => {
      setMostrarBtnArriba(window.scrollY > 400);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // --- Scroll restore ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUrl = sessionStorage.getItem(CATALOGO_URL_KEY);
    const savedScroll = sessionStorage.getItem(CATALOGO_SCROLL_KEY);
    const currentUrl = window.location.pathname + window.location.search;
    if (!savedUrl || !savedScroll || savedUrl !== currentUrl) return;
    const scrollY = Number(savedScroll);
    if (Number.isNaN(scrollY)) { sessionStorage.removeItem(CATALOGO_SCROLL_KEY); return; }
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      requestAnimationFrame(() => { window.scrollTo({ top: scrollY, behavior: 'auto' }); sessionStorage.removeItem(CATALOGO_SCROLL_KEY); });
    });
  }, []);

  // --- Buscar productos (al cargar con ?buscar=) ---
  useEffect(() => {
    let activo = true;
    setFiltrosAbiertos({ marcas: [], categorias: [] });
    setPaginaResultados(1);
    if (!buscarInicial) { Promise.resolve().then(() => { if (!activo) return; setProductos([]); setErrorBusqueda(''); setCargandoBusqueda(false); }); return () => { activo = false; }; }
    Promise.resolve().then(() => { if (!activo) return; setCargandoBusqueda(true); setErrorBusqueda(''); });
    const timeout = setTimeout(async () => {
      if (!activo) return;
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(buscarInicial)}&limit=100`);
        const data = await res.json();
        if (!activo) return;
        setProductos(data.productos || []);
      } catch (e) { if (!activo) return; setErrorBusqueda('Error al buscar productos.'); }
      finally { if (activo) setCargandoBusqueda(false); }
    }, 0);
    return () => { activo = false; clearTimeout(timeout); };
  }, [buscarInicial]);

  const hrefCategoria = nombre => `/productos/categorias/${slugifyCategoria(nombre)}`;
  const valoresFiltro = (campo) => [...new Set(productos.flatMap(p => String(p[campo] || '').split(/[,;|]/).map(value => value.trim()).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es'));
  const marcasDisponibles = valoresFiltro('marcas');
  const categoriasDisponibles = valoresFiltro('categorias');
  const productosFiltrados = productos.filter(producto => {
    const marca = String(producto.marcas || '').toLocaleLowerCase();
    const categoria = String(producto.categorias || '').toLocaleLowerCase();
    return (!filtrosAbiertos.marcas.length || filtrosAbiertos.marcas.some(value => marca.includes(value.toLocaleLowerCase()))) &&
      (!filtrosAbiertos.categorias.length || filtrosAbiertos.categorias.some(value => categoria.includes(value.toLocaleLowerCase())));
  });
  const paginaMaxima = Math.max(1, Math.ceil(productosFiltrados.length / 15));
  const productosVisibles = productosFiltrados.slice((paginaResultados - 1) * 15, paginaResultados * 15);
  const alternarFiltro = (tipo, valor) => {
    setPaginaResultados(1);
    setFiltrosAbiertos(actual => ({ ...actual, [tipo]: actual[tipo].includes(valor) ? actual[tipo].filter(item => item !== valor) : [...actual[tipo], valor] }));
  };
  const guardarScrollCatalogo = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CATALOGO_URL_KEY, window.location.pathname + window.location.search);
    sessionStorage.setItem(CATALOGO_SCROLL_KEY, String(window.scrollY));
  };
  const placeholderImage = '/logo/logo-partemaquinas-oficial.jpeg';
  const obtenerImagenPrincipal = producto => { const imgs = getImagenesProducto(producto); return imgs[0] || null; };
  const irADetalle = (e, productoId) => { guardarScrollCatalogo(); router.push(`/productos/${productoId}`); };

  const irArriba = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="catalog-page min-h-screen bg-slate-50 text-slate-900">
      <div className={`catalog-content w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-8 ${buscarInicial ? 'catalog-content--searching' : ''}`}>
        {buscarInicial ? (
          cargandoBusqueda ? (
            <div className="py-20 text-center text-xl text-slate-500">Buscando productos...</div>
          ) : errorBusqueda ? (
            <div className="py-20 text-center text-xl text-red-600">{errorBusqueda}</div>
          ) : productos.length === 0 ? (
            <div className="py-20 text-center text-xl text-slate-500">No se encontraron productos para &quot;{buscarInicial}&quot;.</div>
          ) : (
            <div className="catalog-search-layout">
              <aside className="catalog-filters">
                <div className="catalog-filters__heading"><h2>Filtrar resultados</h2><button type="button" onClick={() => { setFiltrosAbiertos({ marcas: [], categorias: [] }); setPaginaResultados(1); }}>Limpiar</button></div>
                {marcasDisponibles.length > 0 && <fieldset><legend>Marca</legend>{marcasDisponibles.map(marca => <label key={marca}><input type="checkbox" checked={filtrosAbiertos.marcas.includes(marca)} onChange={() => alternarFiltro('marcas', marca)} /><span>{marca}</span><small>{productos.filter(p => String(p.marcas || '').toLowerCase().includes(marca.toLowerCase())).length}</small></label>)}</fieldset>}
                {categoriasDisponibles.length > 0 && <fieldset><legend>Categoría</legend>{categoriasDisponibles.map(categoria => <label key={categoria}><input type="checkbox" checked={filtrosAbiertos.categorias.includes(categoria)} onChange={() => alternarFiltro('categorias', categoria)} /><span>{categoria}</span><small>{productos.filter(p => String(p.categorias || '').toLowerCase().includes(categoria.toLowerCase())).length}</small></label>)}</fieldset>}
                {!marcasDisponibles.length && !categoriasDisponibles.length && <p className="catalog-filters__empty">No hay más filtros para esta búsqueda.</p>}
              </aside>
              <div className="catalog-results">
              <div className="catalog-results__header flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div>
                  <p className="catalog-eyebrow">Búsqueda <span /> {productosFiltrados.length} resultados</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Resultados para &quot;{buscarInicial}&quot; ({productosFiltrados.length})</h2>
                </div>
                <button type="button" onClick={() => { setFiltrosAbiertos({ marcas: [], categorias: [] }); setPaginaResultados(1); router.push('/productos'); }}
                  className="catalog-results__all btn-anim rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors">
                  Ver catálogo completo
                </button>
              </div>
              {productosFiltrados.length === 0 ? <div className="catalog-filter-empty">No hay productos que coincidan con los filtros seleccionados.</div> : <div className="catalog-results-grid grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {productosVisibles.map(producto => {
                  const imagen = producto.imagen || obtenerImagenPrincipal(producto);
                  return (
                    <div key={producto.id} onClick={(e) => irADetalle(e, producto.id)}
                      className="catalog-product-card bg-white rounded-2xl border border-slate-200 transition-all duration-300 overflow-hidden shadow-sm flex flex-col cursor-pointer">
                      {imagen ? (
                        <div className="catalog-product-card__media relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                          <Image src={imagen} alt={producto.nombre} fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw" className="object-contain" onError={e => { e.currentTarget.src = placeholderImage; }} />
                        </div>
                      ) : (
                        <div className="catalog-product-card__media catalog-product-card__media--empty w-full aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-300"><svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 18h32v20H8zM14 18l3-7h14l3 7M17 27h.01M24 27h.01M31 27h.01M14 38v3m20-3v3"/></svg></div>
                      )}
                      <div className="catalog-product-card__content p-4 flex flex-col flex-1">
                        {producto.marcas && <p className="catalog-product-card__brand mb-1.5 text-xs font-semibold uppercase tracking-wider">{producto.marcas}</p>}
                        <h3 className="catalog-product-card__title text-slate-900 font-semibold text-sm mb-1 line-clamp-2 leading-snug">{producto.nombre}</h3>
                        {producto.sku && <p className="catalog-product-card__sku">Ref. {producto.sku}</p>}
                        {producto.categorias && <p className="catalog-product-card__category text-slate-400 text-xs mb-3 line-clamp-1">{producto.categorias}</p>}
                        <div className="mt-auto pt-3">
                          <a href={'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa: ' + producto.nombre)}
                            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            className="catalog-product-card__action btn-anim block w-full text-center text-sm py-2.5 rounded-lg transition-colors font-medium">
                            Consultar disponibilidad
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              }
              {paginaMaxima > 1 && <nav className="catalog-pagination" aria-label="Paginación de resultados"><button type="button" disabled={paginaResultados === 1} onClick={() => setPaginaResultados(p => p - 1)}>Anterior</button><span>Página {paginaResultados} de {paginaMaxima}</span><button type="button" disabled={paginaResultados === paginaMaxima} onClick={() => setPaginaResultados(p => p + 1)}>Siguiente</button></nav>}
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-10">
            {MENU_CATEGORIAS.map(categoria => (
              <section key={categoria.nombre} className="flex flex-col gap-5">
                <BloqueCategorias items={[categoria]} nivel={0} categoriasConImagenError={categoriasConImagenError} setCategoriasConImagenError={setCategoriasConImagenError} hrefCategoria={hrefCategoria} onNavigate={guardarScrollCatalogo} />
                {categoria.hijos?.length > 0 && (
                  <div className="rounded-[24px] border border-orange-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-orange-700">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-300 bg-white text-orange-500 shadow-sm">↓</span>
                      <span className="uppercase tracking-[0.24em] text-[11px]">Subcategorias de {categoria.nombre}</span>
                    </div>
                    <BloqueCategorias items={categoria.hijos} nivel={1} categoriasConImagenError={categoriasConImagenError} setCategoriasConImagenError={setCategoriasConImagenError} hrefCategoria={hrefCategoria} onNavigate={guardarScrollCatalogo} />
                    {categoria.hijos.some(h => h.hijos?.length > 0) && (
                      <div className="mt-5 flex flex-col gap-4">
                        {categoria.hijos.filter(h => h.hijos?.length > 0).map(hijo => (
                          <div key={`${categoria.nombre}-${hijo.nombre}`} className="rounded-[20px] border border-sky-200 bg-sky-50/80 p-3.5">
                            <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-sky-700">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sky-300 bg-white text-sky-500 shadow-sm">↓</span>
                              <span className="uppercase tracking-[0.22em]">Subnivel de {hijo.nombre}</span>
                            </div>
                            <BloqueCategorias items={hijo.hijos} nivel={2} categoriasConImagenError={categoriasConImagenError} setCategoriasConImagenError={setCategoriasConImagenError} hrefCategoria={hrefCategoria} onNavigate={guardarScrollCatalogo} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Boton flotante "Volver arriba" - aparece al scrollear */}
      {mostrarBtnArriba && (
        <button
          type="button"
          onClick={irArriba}
          className="btn-anim fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
          aria-label="Volver arriba"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
      )}
    </main>
  );
}

export default function Productos() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xl">Cargando...</div>}>
      <ProductosInner />
    </Suspense>
  );
}
