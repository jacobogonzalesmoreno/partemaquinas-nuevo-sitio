'use client';
import { Suspense } from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getImagenesProducto } from '@/lib/imagenes';
import { resolverRutaBusquedaCatalogo, slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';
import { generarSugerencias, crearDebounce } from '@/lib/busqueda-tolerante';

const CATALOGO_URL_KEY = 'catalogoListadoUrl';
const CATALOGO_SCROLL_KEY = 'catalogoListadoScroll';

const obtenerClasesTarjeta = nivel => {
  if (nivel === 0) {
    return {
      wrapper: 'rounded-[28px]',
      image: 'aspect-[16/10]',
      padding: 'px-6 py-5',
      title: 'text-2xl',
      label: 'Categoria',
      icon: 'h-11 w-11 text-xl',
      cardTone: 'border-slate-200 bg-white',
      imageTone: 'bg-slate-100',
      labelTone: 'text-slate-400',
    };
  }

  if (nivel === 1) {
    return {
      wrapper: 'rounded-[20px]',
      image: 'aspect-[16/8]',
      padding: 'px-4 py-3',
      title: 'text-lg',
      label: 'Subcategoria',
      icon: 'h-9 w-9 text-base',
      cardTone: 'border-orange-200 bg-orange-50/70',
      imageTone: 'bg-orange-100/60',
      labelTone: 'text-orange-500',
    };
  }

  return {
    wrapper: 'rounded-[18px]',
    image: 'aspect-[5/4]',
    padding: 'px-3.5 py-3',
    title: 'text-base',
    label: 'Subnivel',
    icon: 'h-8 w-8 text-sm',
    cardTone: 'border-sky-200 bg-sky-50/70',
    imageTone: 'bg-sky-100/70',
    labelTone: 'text-sky-600',
  };
};

function TarjetaCategoria({ categoria, nivel, categoriasConImagenError, setCategoriasConImagenError, hrefCategoria, onNavigate }) {
  const slug = slugifyCategoria(categoria.nombre);
  const rutaImagen = `/categorias/${slug}.png`;
  const tieneError = Boolean(categoriasConImagenError[slug]);
  const clases = obtenerClasesTarjeta(nivel);

  return (
    <Link
      href={hrefCategoria(categoria.nombre)}
      onClick={onNavigate}
      className={`group overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl ${clases.wrapper} ${clases.cardTone}`}
    >
      <div className={`relative overflow-hidden ${clases.imageTone} ${clases.image}`}>
        {!tieneError ? (
          <img
            src={rutaImagen}
            alt={categoria.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setCategoriasConImagenError(prev => ({ ...prev, [slug]: true }))}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 text-center">
            <span className="text-4xl text-orange-300">🖼️</span>
            <p className="text-base font-semibold text-slate-800">Imagen de {categoria.nombre}</p>
            <p className="text-sm leading-relaxed text-slate-500">
              Crea el archivo en public/categorias/{slug}.png para mostrar esta tarjeta con tu diseño.
            </p>
          </div>
        )}
      </div>

      <div className={`flex items-center justify-between gap-4 ${clases.padding}`}>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.32em] ${clases.labelTone}`}>{clases.label}</p>
          <h3 className={`mt-2 font-bold text-slate-900 ${clases.title}`}>{categoria.nombre}</h3>
        </div>
        <span className={`inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 text-orange-500 transition-transform duration-300 group-hover:translate-x-1 ${clases.icon}`}>
          ›
        </span>
      </div>
    </Link>
  );
}

function BloqueCategorias({ items, nivel, categoriasConImagenError, setCategoriasConImagenError, hrefCategoria, onNavigate }) {
  if (!items?.length) return null;

  const columnas = nivel === 0
    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
    : nivel === 1
      ? 'grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

  return (
    <div className={`grid ${nivel === 0 ? 'gap-6' : 'gap-3'} ${columnas}`}>
      {items.map(categoria => (
        <TarjetaCategoria
          key={`${nivel}-${categoria.nombre}`}
          categoria={categoria}
          nivel={nivel}
          categoriasConImagenError={categoriasConImagenError}
          setCategoriasConImagenError={setCategoriasConImagenError}
          hrefCategoria={hrefCategoria}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function ProductosInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buscarInicial = searchParams.get('buscar') || '';
  const [inputBuscar, setInputBuscar] = useState(() => buscarInicial);
  const [categoriasConImagenError, setCategoriasConImagenError] = useState({});
  const [productos, setProductos] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(() => Boolean(buscarInicial));
  const [errorBusqueda, setErrorBusqueda] = useState('');
  const [sugerenciasVacio, setSugerenciasVacio] = useState([]);

  // --- Autocomplete del buscador de productos ---
  const searchInputRef = useRef(null);
  const abortRef = useRef(null);
  const [sugerenciasCats, setSugerenciasCats] = useState([]);
  const [sugerenciasProds, setSugerenciasProds] = useState([]);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Sugerencias de categorías (client-side, instantáneo)
  useEffect(() => {
    if (!inputBuscar || inputBuscar.length < 2) {
      setSugerenciasCats([]);
      return;
    }
    const cats = generarSugerencias(inputBuscar, MENU_CATEGORIAS, 4);
    setSugerenciasCats(cats);
  }, [inputBuscar]);

  // Sugerencias de productos (API, debounced 250ms)
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    if (!inputBuscar || inputBuscar.length < 2) {
      setSugerenciasProds([]);
      setCargandoSugerencias(false);
      setMostrarSugerencias(false);
      return;
    }
    abortRef.current = new AbortController();
    setCargandoSugerencias(true);
    setMostrarSugerencias(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(inputBuscar)}&limit=5`, {
          signal: abortRef.current.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        setSugerenciasProds(data.productos || []);
      } catch (e) {
        if (e.name !== 'AbortError') setSugerenciasProds([]);
      } finally {
        setCargandoSugerencias(false);
      }
    }, 250);
    return () => { clearTimeout(timer); if (abortRef.current) abortRef.current.abort(); };
  }, [inputBuscar]);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = e => {
      if (searchInputRef.current && !searchInputRef.current.closest('[data-search-wrapper]')) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalSugerencias = sugerenciasCats.length + sugerenciasProds.length;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUrl = sessionStorage.getItem(CATALOGO_URL_KEY);
    const savedScroll = sessionStorage.getItem(CATALOGO_SCROLL_KEY);
    const currentUrl = window.location.pathname + window.location.search;
    if (!savedUrl || !savedScroll || savedUrl !== currentUrl) return;

    const scrollY = Number(savedScroll);
    if (Number.isNaN(scrollY)) {
      sessionStorage.removeItem(CATALOGO_SCROLL_KEY);
      return;
    }

    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: 'auto' });
        sessionStorage.removeItem(CATALOGO_SCROLL_KEY);
      });
    });
  }, []);

  useEffect(() => {
    let activo = true;
    if (!buscarInicial) {
      Promise.resolve().then(() => {
        if (!activo) return;
        setProductos([]);
        setErrorBusqueda('');
        setCargandoBusqueda(false);
        setSugerenciasVacio([]);
      });
      return () => { activo = false; };
    }

    Promise.resolve().then(() => {
      if (!activo) return;
      setCargandoBusqueda(true);
      setErrorBusqueda('');
    });

    const timeout = setTimeout(async () => {
      if (!activo) return;
      try {
        // --- Buscar productos reales via API ---
        const res = await fetch(`/api/buscar?q=${encodeURIComponent(buscarInicial)}&limit=20`);
        if (!activo) return;

        if (res.ok) {
          const data = await res.json();
          if (!activo) return;
          const productosObtenidos = data.productos || [];

          setProductos(productosObtenidos);

          // Si no hay resultados, generar sugerencias
          if (productosObtenidos.length === 0) {
            const sugerencias = generarSugerencias(buscarInicial, MENU_CATEGORIAS, 5);
            if (activo) setSugerenciasVacio(sugerencias);
          } else {
            if (activo) setSugerenciasVacio([]);
          }
        } else {
          if (activo) {
            setErrorBusqueda('Error al buscar productos.');
            setProductos([]);
          }
        }
      } catch (e) {
        if (!activo) return;
        setErrorBusqueda('Error al conectar con el servidor.');
      } finally {
        if (activo) setCargandoBusqueda(false);
      }
    }, 0);

    return () => { activo = false; clearTimeout(timeout); };
  }, [buscarInicial]);

  const onSubmitBuscar = e => {
    e.preventDefault();
    const valor = inputBuscar.trim();
    if (valor) {
      // Usar el resolver con tolerancia para dirigir a la mejor ruta
      const ruta = resolverRutaBusquedaCatalogo(valor);
      router.push(ruta);
    } else {
      router.push('/productos');
    }
  };

  const hrefCategoria = nombre => `/productos/categorias/${slugifyCategoria(nombre)}`;
  const guardarScrollCatalogo = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CATALOGO_URL_KEY, window.location.pathname + window.location.search);
    sessionStorage.setItem(CATALOGO_SCROLL_KEY, String(window.scrollY));
  };
  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';
  const obtenerImagenPrincipal = producto => {
    const imagenes = getImagenesProducto(producto);
    return imagenes[0] || null;
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-white py-12 px-6 text-center border-b border-slate-200">
        <h2 className="text-4xl font-bold text-slate-900 mb-3">Catalogo de Repuestos</h2>
        <p className="text-slate-600 mb-6">Explora por categoria y encuentra el repuesto ideal.</p>
        <div className="w-full max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="btn-anim inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-5 py-3"
          >
            Volver al inicio
          </button>
          <div className="flex-1 relative" data-search-wrapper>
            <form onSubmit={onSubmitBuscar} className="flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar producto, marca o referencia..."
                value={inputBuscar}
                onChange={e => { setInputBuscar(e.target.value); setSugerenciaActiva(-1); }}
                onFocus={() => { if (inputBuscar.length >= 2) setMostrarSugerencias(true); }}
                onKeyDown={e => {
                  if (!mostrarSugerencias || totalSugerencias === 0) return;
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSugerenciaActiva(prev => Math.min(prev + 1, totalSugerencias - 1));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSugerenciaActiva(prev => Math.max(prev - 1, -1));
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setMostrarSugerencias(false);
                    searchInputRef.current?.blur();
                  } else if (e.key === 'Enter') {
                    if (sugerenciaActiva >= 0 && sugerenciaActiva < sugerenciasCats.length) {
                      e.preventDefault();
                      router.push(sugerenciasCats[sugerenciaActiva].href);
                      setMostrarSugerencias(false);
                    } else if (sugerenciaActiva >= sugerenciasCats.length) {
                      e.preventDefault();
                      const prod = sugerenciasProds[sugerenciaActiva - sugerenciasCats.length];
                      router.push(`/productos/${prod.id}`);
                      setMostrarSugerencias(false);
                    }
                  }
                }}
                className="w-full px-5 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-300 focus:outline-none focus:border-orange-400 text-lg shadow-sm"
              />
            </form>

            {/* Dropdown autocomplete */}
            {mostrarSugerencias && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0 || cargandoSugerencias) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-2xl z-50 max-h-[420px] overflow-y-auto">
                {sugerenciasCats.length > 0 && (
                  <div className="border-b border-slate-100">
                    <p className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">Categorias</p>
                    {sugerenciasCats.map((sug, i) => (
                      <Link
                        key={`cat-${i}`}
                        href={sug.href}
                        onClick={() => setMostrarSugerencias(false)}
                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${sugerenciaActiva === i ? 'bg-orange-50' : 'hover:bg-orange-50'}`}
                      >
                        <span className="text-orange-400 text-sm flex-shrink-0">📁</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{sug.texto}</p>
                          {sug.textoCompleto !== sug.texto && <p className="text-xs text-slate-400 truncate">{sug.textoCompleto}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {sugerenciasProds.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 font-semibold">Productos</p>
                    {sugerenciasProds.map((prod, i) => {
                      const idx = sugerenciasCats.length + i;
                      return (
                        <Link
                          key={`prod-${prod.id}`}
                          href={`/productos/${prod.id}`}
                          onClick={() => setMostrarSugerencias(false)}
                          className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${sugerenciaActiva === idx ? 'bg-orange-50' : 'hover:bg-orange-50'}`}
                        >
                          {prod.imagen ? (
                            <img src={prod.imagen} alt={prod.nombre} className="w-10 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-sm flex-shrink-0">⚙️</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{prod.nombre}</p>
                            <p className="text-xs text-slate-400 truncate">{prod.marcas || ''}{prod.marcas && prod.sku ? ' · ' : ''}{prod.sku || ''}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {cargandoSugerencias && sugerenciasProds.length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-400 text-center">Buscando productos...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {buscarInicial ? (
          cargandoBusqueda ? (
            <div className="py-20 text-center text-xl text-slate-500">Buscando productos...</div>
          ) : errorBusqueda ? (
            <div className="py-20 text-center text-xl text-red-600">{errorBusqueda}</div>
          ) : productos.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-xl text-slate-500 mb-2">
                  No se encontraron productos para &quot;{buscarInicial}&quot;
                </p>
                <p className="text-sm text-slate-400">
                  Intenta con otro término, revisa la ortografía o explora las categorías.
                </p>
              </div>

              {/* --- Sugerencias "¿Quizás quisiste decir...?" --- */}
              {sugerenciasVacio.length > 0 && (
                <div className="w-full max-w-lg">
                  <p className="text-sm font-semibold text-slate-500 mb-3 text-center">
                    Quizás quisiste buscar en estas categorías:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {sugerenciasVacio.map(sug => (
                      <Link
                        key={sug.href}
                        href={sug.href}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-orange-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md hover:text-slate-900"
                      >
                        <span>{sug.texto}</span>
                        {sug.textoCompleto !== sug.texto && (
                          <span className="text-xs text-slate-400">({sug.textoCompleto})</span>
                        )}
                        <span className="text-orange-400 text-xs">→</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => router.push('/productos')}
                className="btn-anim mt-2 rounded-xl border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
              >
                Ver todas las categorías
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-orange-500 font-semibold">Resultados de búsqueda</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Resultados para &quot;{buscarInicial}&quot;</h2>
                </div>
                <button
                  type="button"
                  onClick={() => router.push('/productos')}
                  className="btn-anim rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
                >
                  Ver todas las categorias
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {(Array.isArray(productos) ? productos : []).map(producto => {
                  const imagen = obtenerImagenPrincipal(producto);
                  return (
                    <div
                      key={producto.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-orange-400 transition-all overflow-hidden shadow-sm hover:shadow-md flex flex-col"
                    >
                      {imagen ? (
                        <img
                          src={imagen}
                          alt={producto.nombre}
                          className="w-full h-48 object-contain bg-slate-100"
                          onError={e => { e.currentTarget.src = placeholderImage; }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-5xl text-slate-400">⚙️</div>
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        {producto.marcas && <p className="mb-2 text-xs font-semibold text-orange-500">Marca: {producto.marcas}</p>}
                        <h3 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2">{producto.nombre}</h3>
                        {producto.categorias && <p className="text-slate-500 text-xs mb-3">{producto.categorias}</p>}
                        <div className="mt-auto flex flex-col gap-2">
                          <Link
                            href={`/productos/${producto.id}`}
                            onClick={guardarScrollCatalogo}
                            className="btn-anim block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm py-2 rounded-lg transition-colors"
                          >
                            Ver detalle
                          </Link>
                          <a
                            href={'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa: ' + producto.nombre)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-anim block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-white text-sm py-2 rounded-lg transition-colors"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-10">
            {MENU_CATEGORIAS.map(categoria => (
              <section key={categoria.nombre} className="flex flex-col gap-5">
                <BloqueCategorias
                  items={[categoria]}
                  nivel={0}
                  categoriasConImagenError={categoriasConImagenError}
                  setCategoriasConImagenError={setCategoriasConImagenError}
                  hrefCategoria={hrefCategoria}
                  onNavigate={guardarScrollCatalogo}
                />

                {categoria.hijos?.length > 0 && (
                  <div className="rounded-[24px] border border-orange-200 bg-gradient-to-b from-orange-50/80 to-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center gap-3 text-sm font-semibold text-orange-700">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-orange-300 bg-white text-orange-500 shadow-sm">↓</span>
                      <span className="uppercase tracking-[0.24em] text-[11px]">Subcategorias de {categoria.nombre}</span>
                    </div>
                    <BloqueCategorias
                      items={categoria.hijos}
                      nivel={1}
                      categoriasConImagenError={categoriasConImagenError}
                      setCategoriasConImagenError={setCategoriasConImagenError}
                      hrefCategoria={hrefCategoria}
                      onNavigate={guardarScrollCatalogo}
                    />

                    {categoria.hijos.some(hijo => hijo.hijos?.length > 0) && (
                      <div className="mt-5 flex flex-col gap-4">
                        {categoria.hijos.filter(hijo => hijo.hijos?.length > 0).map(hijo => (
                          <div key={`${categoria.nombre}-${hijo.nombre}`} className="rounded-[20px] border border-sky-200 bg-sky-50/80 p-3.5">
                            <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-sky-700">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sky-300 bg-white text-sky-500 shadow-sm">↓</span>
                              <span className="uppercase tracking-[0.22em]">Subnivel de {hijo.nombre}</span>
                            </div>
                            <BloqueCategorias
                              items={hijo.hijos}
                              nivel={2}
                              categoriasConImagenError={categoriasConImagenError}
                              setCategoriasConImagenError={setCategoriasConImagenError}
                              hrefCategoria={hrefCategoria}
                              onNavigate={guardarScrollCatalogo}
                            />
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