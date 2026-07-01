'use client';
import { Suspense, useRef, useCallback } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getImagenesProducto } from '@/lib/imagenes';
import { resolverRutaBusquedaCatalogo, slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS, MENU_CATEGORIAS_FLAT } from '@/lib/menu-categorias';
import { generarSugerencias, crearDebounce } from '@/lib/busqueda-tolerante';

const CATALOGO_URL_KEY = 'catalogoListadoUrl';
const CATALOGO_SCROLL_KEY = 'catalogoListadoScroll';

const obtenerClasesTarjeta = nivel => {
  if (nivel === 0) return { wrapper: 'rounded-[28px]', image: 'aspect-[16/10]', padding: 'px-6 py-5', title: 'text-2xl', label: 'Categoria', icon: 'h-11 w-11 text-xl', cardTone: 'border-slate-200 bg-white', imageTone: 'bg-slate-100', labelTone: 'text-slate-400' };
  if (nivel === 1) return { wrapper: 'rounded-[20px]', image: 'aspect-[16/8]', padding: 'px-4 py-3', title: 'text-lg', label: 'Subcategoria', icon: 'h-9 w-9 text-base', cardTone: 'border-orange-200 bg-orange-50/70', imageTone: 'bg-orange-100/60', labelTone: 'text-orange-500' };
  return { wrapper: 'rounded-[18px]', image: 'aspect-[5/4]', padding: 'px-3.5 py-3', title: 'text-base', label: 'Subnivel', icon: 'h-8 w-8 text-sm', cardTone: 'border-sky-200 bg-sky-50/70', imageTone: 'bg-sky-100/70', labelTone: 'text-sky-600' };
};

function TarjetaCategoria({ categoria, nivel, categoriasConImagenError, setCategoriasConImagenError, hrefCategoria, onNavigate }) {
  const slug = slugifyCategoria(categoria.nombre);
  const rutaImagen = `/categorias/${slug}.png`;
  const tieneError = Boolean(categoriasConImagenError[slug]);
  const c = obtenerClasesTarjeta(nivel);
  return (
    <Link href={hrefCategoria(categoria.nombre)} onClick={onNavigate}
      className={`group overflow-hidden border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl ${c.wrapper} ${c.cardTone}`}>
      <div className={`relative overflow-hidden ${c.imageTone} ${c.image}`}>
        {!tieneError ? (
          <img src={rutaImagen} alt={categoria.nombre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setCategoriasConImagenError(prev => ({ ...prev, [slug]: true }))} />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.18),_transparent_55%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-6 text-center">
            <span className="text-4xl text-orange-300">🖼️</span>
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
  const [inputBuscar, setInputBuscar] = useState(() => buscarInicial);
  const [categoriasConImagenError, setCategoriasConImagenError] = useState({});
  const [productos, setProductos] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(() => Boolean(buscarInicial));
  const [errorBusqueda, setErrorBusqueda] = useState('');

  // --- Dropdown autocomplete ---
  const [sugerenciasCats, setSugerenciasCats] = useState([]);
  const [sugerenciasProds, setSugerenciasProds] = useState([]);
  const [cargandoProds, setCargandoProds] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortRef = useRef(null);

  // --- Boton flotante volver arriba ---
  const [mostrarBtnArriba, setMostrarBtnArriba] = useState(false);

  const totalSugerencias = sugerenciasCats.length + sugerenciasProds.length + 1;

  const actualizarSugerenciasCats = useCallback(query => {
    if (!query || query.trim().length < 1) { setSugerenciasCats([]); return; }
    setSugerenciasCats(generarSugerencias(query, MENU_CATEGORIAS, 4));
  }, []);

  const debouncedCats = useRef(crearDebounce(actualizarSugerenciasCats, 150)).current;

  const buscarProductosAPI = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setSugerenciasProds([]); setCargandoProds(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setCargandoProds(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(query.trim())}&limit=5`, { signal: abortRef.current.signal });
      if (!res.ok) { setSugerenciasProds([]); return; }
      const data = await res.json();
      setSugerenciasProds(data.productos || []);
    } catch (err) {
      if (err.name !== 'AbortError') setSugerenciasProds([]);
    } finally { setCargandoProds(false); }
  }, []);

  const debouncedProds = useRef(crearDebounce(buscarProductosAPI, 250)).current;

  useEffect(() => {
    return () => { debouncedCats.cancel(); debouncedProds.cancel(); if (abortRef.current) abortRef.current.abort(); };
  }, [debouncedCats, debouncedProds]);

  // Cerrar dropdown al clic fuera (solo mousedown, NO al scroll del dropdown)
  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setMostrarSugerencias(false);
        setSugerenciaActiva(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cerrar dropdown al scroll de la PAGINA, pero NO al scroll dentro del dropdown
  useEffect(() => {
    const handler = (e) => {
      // Si el scroll viene del dropdown o de un descendiente, ignorarlo
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) {
        return;
      }
      setMostrarSugerencias(false);
      setSugerenciaActiva(-1);
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, []);

  // Mostrar/ocultar boton flotante "volver arriba"
  useEffect(() => {
    const handler = () => {
      setMostrarBtnArriba(window.scrollY > 400);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const onChangeInput = e => {
    const val = e.target.value;
    setInputBuscar(val);
    setSugerenciaActiva(-1);
    debouncedCats(val);
    debouncedProds(val);
    if (val.trim().length >= 2) setMostrarSugerencias(true);
    else setMostrarSugerencias(false);
  };

  const cerrarDropdown = () => {
    setMostrarSugerencias(false);
    setSugerenciaActiva(-1);
    debouncedCats.cancel();
    debouncedProds.cancel();
    if (abortRef.current) abortRef.current.abort();
  };

  const onKeyDownInput = e => {
    const haySugerencias = mostrarSugerencias && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0 || cargandoProds);
    if (!haySugerencias) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSugerenciaActiva(prev => (prev + 1) % totalSugerencias);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSugerenciaActiva(prev => (prev - 1 + totalSugerencias) % totalSugerencias);
        break;
      case 'Escape':
        cerrarDropdown();
        break;
      case 'Enter': {
        e.preventDefault();
        const idx = sugerenciaActiva;
        if (idx >= 0 && idx < sugerenciasCats.length) {
          cerrarDropdown();
          setInputBuscar('');
          router.push(sugerenciasCats[idx].href);
          return;
        }
        const prodIdx = idx - sugerenciasCats.length;
        if (prodIdx >= 0 && prodIdx < sugerenciasProds.length) {
          cerrarDropdown();
          setInputBuscar('');
          router.push(`/productos/${sugerenciasProds[prodIdx].id}`);
          return;
        }
        // "Buscar todos"
        cerrarDropdown();
        onSubmitBuscar(e);
        break;
      }
    }
  };

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

  const onSubmitBuscar = e => {
    e?.preventDefault();
    cerrarDropdown();
    if (inputBuscar.trim()) {
      const ruta = resolverRutaBusquedaCatalogo(inputBuscar.trim());
      setInputBuscar('');
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
  const obtenerImagenPrincipal = producto => { const imgs = getImagenesProducto(producto); return imgs[0] || null; };
  const irADetalle = (e, productoId) => { guardarScrollCatalogo(); router.push(`/productos/${productoId}`); };

  const irArriba = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-white py-12 px-6 text-center border-b border-slate-200">
        <h2 className="text-4xl font-bold text-slate-900 mb-3">Catalogo de Repuestos</h2>
        <p className="text-slate-600 mb-6">Explora por categoria y encuentra el repuesto ideal.</p>
        <div className="w-full max-w-xl mx-auto">
          <form onSubmit={onSubmitBuscar} className="relative" ref={searchRef}>
            <input
              type="text"
              placeholder="Buscar producto, marca o referencia..."
              value={inputBuscar}
              onChange={onChangeInput}
              onKeyDown={onKeyDownInput}
              onFocus={() => { if (inputBuscar.trim().length >= 2 && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0)) setMostrarSugerencias(true); }}
              className="w-full px-5 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-300 focus:outline-none focus:border-orange-400 text-lg shadow-sm"
              autoComplete="off"
            />
            {/* Dropdown de sugerencias */}
            {mostrarSugerencias && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0 || cargandoProds) && (
              <div
                ref={dropdownRef}
                className="absolute left-0 top-full z-[100] mt-1 w-full sm:w-[28rem] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                onScroll={e => e.stopPropagation()}
              >
                <ul className="py-1 max-h-[60vh] overflow-y-auto">
                  {sugerenciasCats.length > 0 && (
                    <li><p className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">Categorias</p></li>
                  )}
                  {sugerenciasCats.map((sug, i) => {
                    const isActive = sugerenciaActiva === i;
                    return (
                      <li key={`cat-${sug.href}`}>
                        <button type="button"
                          className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors ${isActive ? 'bg-amber-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                          onMouseDown={e => { e.preventDefault(); cerrarDropdown(); setInputBuscar(''); router.push(sug.href); }}
                          onMouseEnter={() => setSugerenciaActiva(i)}>
                          <span className="flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-slate-50 text-slate-400 shrink-0">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{sug.texto}</p>
                            {sug.textoCompleto !== sug.texto && <p className="text-[11px] text-slate-400 truncate">{sug.textoCompleto}</p>}
                          </div>
                          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${sug.nivel === 0 ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-600'}`}>{sug.tipo}</span>
                        </button>
                      </li>
                    );
                  })}
                  {sugerenciasCats.length > 0 && (sugerenciasProds.length > 0 || cargandoProds) && <li className="border-t border-slate-100" />}
                  {sugerenciasProds.length > 0 || cargandoProds ? (
                    <li><p className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">Productos</p></li>
                  ) : null}
                  {cargandoProds && sugerenciasProds.length === 0 && (
                    <li><div className="px-3.5 py-4 text-center text-sm text-slate-400">Buscando productos...</div></li>
                  )}
                  {sugerenciasProds.map((prod, i) => {
                    const thisIndex = sugerenciasCats.length + i;
                    const isActive = sugerenciaActiva === thisIndex;
                    return (
                      <li key={`prod-${prod.id}`}>
                        <button type="button"
                          className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors ${isActive ? 'bg-amber-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                          onMouseDown={e => { e.preventDefault(); cerrarDropdown(); setInputBuscar(''); router.push(`/productos/${prod.id}`); }}
                          onMouseEnter={() => setSugerenciaActiva(thisIndex)}>
                          {prod.imagen ? (
                            <img src={prod.imagen} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0" />
                          ) : (
                            <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-lg shrink-0">⚙️</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{prod.nombre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {prod.sku && <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>}
                              {prod.marcas && <span className="text-[10px] text-orange-500 font-medium">{prod.marcas}</span>}
                            </div>
                          </div>
                          <span className="text-orange-400 text-xs shrink-0">→</span>
                        </button>
                      </li>
                    );
                  })}
                  <li className="border-t border-slate-100">
                    <button type="button"
                      className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 text-sm transition-colors ${sugerenciaActiva === totalSugerencias - 1 ? 'bg-amber-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                      onMouseDown={e => { e.preventDefault(); onSubmitBuscar(e); }}
                      onMouseEnter={() => setSugerenciaActiva(totalSugerencias - 1)}>
                      <span className="flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-slate-50 text-slate-400 shrink-0">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      </span>
                      <span>Buscar &quot;{inputBuscar.trim()}&quot; en todos los productos</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {buscarInicial ? (
          cargandoBusqueda ? (
            <div className="py-20 text-center text-xl text-slate-500">Buscando productos...</div>
          ) : errorBusqueda ? (
            <div className="py-20 text-center text-xl text-red-600">{errorBusqueda}</div>
          ) : productos.length === 0 ? (
            <div className="py-20 text-center text-xl text-slate-500">No se encontraron productos para &quot;{buscarInicial}&quot;.</div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.32em] text-orange-500 font-semibold">Busqueda</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Resultados para &quot;{buscarInicial}&quot; ({productos.length})</h2>
                </div>
                <button type="button" onClick={() => router.push('/productos')}
                  className="btn-anim rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900">
                  Ver todas las categorias
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {(Array.isArray(productos) ? productos : []).map(producto => {
                  const imagen = producto.imagen || obtenerImagenPrincipal(producto);
                  return (
                    <div key={producto.id} onClick={(e) => irADetalle(e, producto.id)}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-orange-400 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg flex flex-col cursor-pointer hover:-translate-y-1">
                      {imagen ? (
                        <div className="w-full h-48 bg-slate-100 overflow-hidden">
                          <img src={imagen} alt={producto.nombre} className="w-full h-full object-contain transition-transform duration-300" onError={e => { e.currentTarget.src = placeholderImage; }} />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-5xl text-slate-300">⚙️</div>
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        {producto.marcas && <p className="mb-1.5 text-xs font-semibold text-orange-500 uppercase tracking-wider">{producto.marcas}</p>}
                        <h3 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2 leading-snug">{producto.nombre}</h3>
                        {producto.categorias && <p className="text-slate-400 text-xs mb-3 line-clamp-1">{producto.categorias}</p>}
                        <div className="mt-auto pt-3">
                          <a href={'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa: ' + producto.nombre)}
                            target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                            className="btn-anim block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-white text-sm py-2.5 rounded-lg transition-colors font-medium">
                            Consultar por WhatsApp
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
                <BloqueCategorias items={[categoria]} nivel={0} categoriasConImagenError={categoriasConImagenError} setCategoriasConImagenError={setCategoriasConImagenError} hrefCategoria={hrefCategoria} onNavigate={guardarScrollCatalogo} />
                {categoria.hijos?.length > 0 && (
                  <div className="rounded-[24px] border border-orange-200 bg-gradient-to-b from-orange-50/80 to-white p-4 shadow-sm">
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