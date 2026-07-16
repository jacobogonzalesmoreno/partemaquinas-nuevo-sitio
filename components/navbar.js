'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolverRutaBusquedaCatalogo, slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';
import { generarSugerencias, crearDebounce } from '@/lib/busqueda-tolerante';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const [buscarNav, setBuscarNav] = useState('');
  const [sugerenciasCats, setSugerenciasCats] = useState([]);       // categorías (client-side, instant)
  const [sugerenciasProds, setSugerenciasProds] = useState([]);      // productos (API, async)
  const [cargandoProds, setCargandoProds] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const hideCategoriaTimer = useRef(null);
  const hideSubcategoriaTimer = useRef(null);
  const searchRef = useRef(null);
  const abortRef = useRef(null);
  const router = useRouter();

  const menuCategorias = MENU_CATEGORIAS;
  const navLinkClass = 'inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-all border border-slate-200 bg-white shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md';
  const navDropdownLinkClass = 'inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit';
  const navSubmenuLinkClass = 'inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit min-w-[124px]';
  const navSubmenuChildLinkClass = 'inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit min-w-[116px]';
  const mobileLinkClass = 'inline-flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-all border border-slate-200 bg-white shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md';

  const hrefCategoria = nombre => `/productos/categorias/${slugifyCategoria(nombre)}`;

  // Total de sugerencias = categorías + productos + 1 (buscar todos)
  const totalSugerencias = sugerenciasCats.length + sugerenciasProds.length + 1;

  // --- Sugerencias de categorías (client-side, instant) ---
  const actualizarSugerenciasCats = useCallback(query => {
    if (!query || query.trim().length < 1) {
      setSugerenciasCats([]);
      return;
    }
    const resultados = generarSugerencias(query, menuCategorias, 4);
    setSugerenciasCats(resultados);
  }, [menuCategorias]);

  const debouncedCats = useRef(crearDebounce(actualizarSugerenciasCats, 150)).current;

  // --- Sugerencias de productos (API, async) ---
  const buscarProductosAPI = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSugerenciasProds([]);
      setCargandoProds(false);
      return;
    }

    // Cancelar petición anterior si existe
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setCargandoProds(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(query.trim())}&limit=5`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        setSugerenciasProds([]);
        return;
      }
      const data = await res.json();
      setSugerenciasProds(data.productos || []);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSugerenciasProds([]);
      }
    } finally {
      setCargandoProds(false);
    }
  }, []);

  const debouncedProds = useRef(crearDebounce(buscarProductosAPI, 250)).current;

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedCats.cancel();
      debouncedProds.cancel();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [debouncedCats, debouncedProds]);

  const onChangeBuscar = event => {
    const value = event.target.value;
    setBuscarNav(value);
    setSugerenciaActiva(-1);

    // Categorías: instant
    debouncedCats(value);

    // Productos: async con más debounce
    debouncedProds(value);

    // Mostrar dropdown si hay algo de contexto
    if (value.trim().length >= 2) {
      setMostrarSugerencias(true);
    } else {
      setMostrarSugerencias(false);
    }
  };

  const onSubmitBuscar = (event, overrideHref) => {
    event?.preventDefault();
    setMostrarSugerencias(false);
    debouncedCats.cancel();
    debouncedProds.cancel();
    if (abortRef.current) abortRef.current.abort();

    if (overrideHref) {
      router.push(overrideHref);
      setBuscarNav('');
      return;
    }

    const value = buscarNav.trim();
    if (!value) return;

    router.push(resolverRutaBusquedaCatalogo(value));
    setBuscarNav('');
  };

  const onFocusBuscar = () => {
    if (buscarNav.trim().length >= 2 && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0)) {
      setMostrarSugerencias(true);
    }
  };

  const onBlurBuscar = () => {
    setTimeout(() => {
      setMostrarSugerencias(false);
      setSugerenciaActiva(-1);
    }, 200);
  };

  const onKeyDownBuscar = event => {
    const haySugerencias = mostrarSugerencias &&
      (sugerenciasCats.length > 0 || sugerenciasProds.length > 0 || cargandoProds);

    if (!haySugerencias) {
      if (event.key === 'Enter') onSubmitBuscar(event);
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSugerenciaActiva(prev => (prev + 1) % totalSugerencias);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSugerenciaActiva(prev => (prev - 1 + totalSugerencias) % totalSugerencias);
        break;
      case 'Enter': {
        event.preventDefault();
        const idx = sugerenciaActiva;

        // ¿Es una categoría?
        if (idx >= 0 && idx < sugerenciasCats.length) {
          router.push(sugerenciasCats[idx].href);
          setBuscarNav('');
          setMostrarSugerencias(false);
          return;
        }

        // ¿Es un producto?
        const prodIdx = idx - sugerenciasCats.length;
        if (prodIdx >= 0 && prodIdx < sugerenciasProds.length) {
          router.push(`/productos/${sugerenciasProds[prodIdx].id}`);
          setBuscarNav('');
          setMostrarSugerencias(false);
          return;
        }

        // ¿Es "Buscar en todos"?
        if (idx === sugerenciasCats.length + sugerenciasProds.length) {
          onSubmitBuscar(event);
          return;
        }

        // Default: buscar
        onSubmitBuscar(event);
        break;
      }
      case 'Escape':
        setMostrarSugerencias(false);
        setSugerenciaActiva(-1);
        break;
    }
  };

  // Cerrar al clic fuera
  useEffect(() => {
    const handleClickOutside = event => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setMostrarSugerencias(false);
        setSugerenciaActiva(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Render del dropdown de sugerencias ---
  const renderSugerenciasDropdown = () => {
    const tieneCats = sugerenciasCats.length > 0;
    const tieneProds = sugerenciasProds.length > 0 || cargandoProds;

    if (!mostrarSugerencias || (!tieneCats && !tieneProds)) return null;

    let globalIndex = 0;

    return (
      <div className="absolute left-0 top-full z-[100] mt-1 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <ul className="py-1 max-h-[70vh] overflow-y-auto">
          {/* --- Sección: Categorías --- */}
          {tieneCats && (
            <li>
              <p className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">
                Categorías
              </p>
            </li>
          )}
          {sugerenciasCats.map((sug, i) => {
            const thisIndex = globalIndex++;
            const isActive = sugerenciaActiva === thisIndex;
            return (
              <li key={`cat-${sug.href}`}>
                <button
                  type="button"
                  className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors ${
                    isActive ? 'bg-amber-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onMouseDown={event => {
                    event.preventDefault();
                    router.push(sug.href);
                    setBuscarNav('');
                    setMostrarSugerencias(false);
                  }}
                  onMouseEnter={() => setSugerenciaActiva(thisIndex)}
                >
                  <span className="flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-slate-50 text-slate-400 flex-shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                    </svg>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sug.texto}</p>
                    {sug.textoCompleto !== sug.texto && (
                      <p className="text-[11px] text-slate-400 truncate">{sug.textoCompleto}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                    sug.nivel === 0 ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {sug.tipo}
                  </span>
                </button>
              </li>
            );
          })}

          {/* --- Separador --- */}
          {tieneCats && tieneProds && (
            <li className="border-t border-slate-100" />
          )}

          {/* --- Sección: Productos --- */}
          {tieneProds && (
            <li>
              <p className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">
                Productos
              </p>
            </li>
          )}
          {cargandoProds && sugerenciasProds.length === 0 && (
            <li>
              <div className="px-3.5 py-4 text-center text-sm text-slate-400">
                Buscando productos...
              </div>
            </li>
          )}
          {sugerenciasProds.map((prod, i) => {
            const thisIndex = globalIndex++;
            const isActive = sugerenciaActiva === thisIndex;
            return (
              <li key={`prod-${prod.id}`}>
                <button
                  type="button"
                  className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors ${
                    isActive ? 'bg-amber-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onMouseDown={event => {
                    event.preventDefault();
                    router.push(`/productos/${prod.id}`);
                    setBuscarNav('');
                    setMostrarSugerencias(false);
                  }}
                  onMouseEnter={() => setSugerenciaActiva(thisIndex)}
                >
                  {prod.imagen ? (
                    <img
                      src={prod.imagen}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-lg flex-shrink-0">
                      ⚙️
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prod.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {prod.sku && (
                        <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>
                      )}
                      {prod.marcas && (
                        <span className="text-[10px] text-orange-500 font-medium">{prod.marcas}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-orange-400 text-xs flex-shrink-0">→</span>
                </button>
              </li>
            );
          })}

          {/* --- Separador + "Buscar todos" --- */}
          <li className="border-t border-slate-100">
            <button
              type="button"
              className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 text-sm transition-colors ${
                sugerenciaActiva === totalSugerencias - 1
                  ? 'bg-amber-50 text-slate-900'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
              onMouseDown={event => {
                event.preventDefault();
                onSubmitBuscar(event);
              }}
              onMouseEnter={() => setSugerenciaActiva(totalSugerencias - 1)}
            >
              <span className="flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-slate-50 text-slate-400 flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <span>Buscar &quot;{buscarNav.trim()}&quot; en todos los productos</span>
            </button>
          </li>
        </ul>
      </div>
    );
  };

  const renderCategorias = onSelect => (
    <ul className="inline-flex flex-col gap-1 w-fit">
      {menuCategorias.map(categoria => {
        const submenuOffsetClass = categoria.nombre === 'Giro'
          ? 'left-[calc(100%+24px)] md:left-[calc(100%+40px)]'
          : categoria.nombre === 'Motor'
            ? 'left-[calc(100%+16px)] md:left-[calc(100%+28px)]'
          : 'left-[calc(100%+16px)]';

        return (
          <li
            key={categoria.nombre}
            className="relative group w-fit z-10 hover:z-30"
            onMouseEnter={() => {
              if (hideCategoriaTimer.current) {
                clearTimeout(hideCategoriaTimer.current);
                hideCategoriaTimer.current = null;
              }
              setCategoriaActiva(categoria.nombre);
            }}
            onMouseLeave={() => {
              if (hideCategoriaTimer.current) {
                clearTimeout(hideCategoriaTimer.current);
              }
              hideCategoriaTimer.current = setTimeout(() => {
                setCategoriaActiva(null);
              }, 150);
            }}
          >
            <Link
              href={hrefCategoria(categoria.nombre)}
              onClick={onSelect}
              className={navDropdownLinkClass}
            >
              <span>{categoria.nombre}</span>
              {categoria.hijos && <span className="text-orange-400">›</span>}
            </Link>
            {categoria.hijos && (
              <div
                className={`absolute ${submenuOffsetClass} top-0 z-[60] w-56 transition-all duration-200 ease-out ${
                  categoriaActiva === categoria.nombre
                    ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                    : 'opacity-0 translate-x-2 scale-95 pointer-events-none'
                }`}
              >
                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-2.5">
                  <ul className="space-y-0.5">
                    {categoria.hijos.map(hijo => (
                      <li
                        key={hijo.nombre}
                        className="relative group/child z-10 hover:z-30"
                        onMouseEnter={event => {
                          if (hideSubcategoriaTimer.current) {
                            clearTimeout(hideSubcategoriaTimer.current);
                            hideSubcategoriaTimer.current = null;
                          }
                          setSubcategoriaActiva(hijo.nombre);
                        }}
                        onMouseLeave={() => {
                          if (hideSubcategoriaTimer.current) {
                            clearTimeout(hideSubcategoriaTimer.current);
                          }
                          hideSubcategoriaTimer.current = setTimeout(() => {
                            setSubcategoriaActiva(null);
                          }, 150);
                        }}
                      >
                        <Link
                          href={hrefCategoria(hijo.nombre)}
                          onClick={onSelect}
                          className={navSubmenuLinkClass}
                        >
                          <span>{hijo.nombre}</span>
                          {hijo.hijos && <span className="text-orange-400">›</span>}
                        </Link>
                        {hijo.hijos && (
                          <div
                            className={`absolute left-[calc(100%+14px)] md:left-[calc(100%+18px)] top-0 z-[70] w-48 transition-all duration-200 ease-out ${
                              subcategoriaActiva === hijo.nombre
                                ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                                : 'opacity-0 translate-x-2 scale-95 pointer-events-none'
                            }`}
                          >
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-2">
                              <ul className="space-y-0.5">
                                {hijo.hijos.map(nieto => (
                                  <li key={nieto.nombre}>
                                    <Link
                                      href={hrefCategoria(nieto.nombre)}
                                      onClick={onSelect}
                                      className={navSubmenuChildLinkClass}
                                    >
                                      {nieto.nombre}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm relative overflow-visible">
      <div className="relative flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm">
            <Image
              src="/logo/logo-partemaquinas.png"
              alt="ParteMaquinas"
              width={32}
              height={32}
              priority
            />
          </span>
          <span className="text-slate-900 text-2xl font-bold tracking-tight">ParteMaquinas</span>
        </Link>
        <div className="hidden md:flex gap-6 text-sm font-semibold absolute left-1/2 -translate-x-1/2">
          <Link href="/" className={navLinkClass}>Inicio</Link>
          <div className="relative group">
            <Link href="/productos" className={`${navLinkClass} gap-1`}>
              Productos
              <span className="text-orange-400">▾</span>
            </Link>
            <div className="absolute left-0 top-full z-50 pt-3 opacity-0 translate-y-1 pointer-events-none transition-all duration-200 group-hover:!opacity-100 group-hover:!translate-y-0 group-hover:!pointer-events-auto">
              <div className="w-fit rounded-2xl border border-slate-200 bg-white shadow-xl p-2">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Categorias</p>
                <div className="mt-2.5">{renderCategorias()}</div>
              </div>
            </div>
          </div>
          <Link href="/nosotros" className={navLinkClass}>Nosotros</Link>
          <Link href="/contacto" className={navLinkClass}>Contacto</Link>
        </div>

        {/* --- Buscador desktop con autocompletado (categorías + productos) --- */}
        <div ref={searchRef} className="hidden lg:block relative">
          <form onSubmit={event => onSubmitBuscar(event)} className="flex items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={buscarNav}
                onChange={onChangeBuscar}
                onFocus={onFocusBuscar}
                onBlur={onBlurBuscar}
                onKeyDown={onKeyDownBuscar}
                placeholder="Buscar producto o categoría..."
                autoComplete="off"
                role="combobox"
                aria-expanded={mostrarSugerencias}
                aria-autocomplete="list"
                className="w-60 pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-orange-400 text-sm"
              />
              {renderSugerenciasDropdown()}
            </div>
            <button
              type="submit"
              className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-3 py-2 text-sm shadow-sm ring-1 ring-amber-200 transition-all hover:border-amber-300 hover:bg-slate-800 hover:shadow-md hover:ring-2 hover:ring-amber-300"
              aria-label="Buscar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setMenuAbierto(valor => !valor)}
          className="btn-anim inline-flex md:hidden items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-2 hover:ring-amber-200 hover:shadow-md"
        >
          <span className="sr-only">Abrir menu</span>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {menuAbierto && (
        <div className="absolute left-0 right-0 top-full z-50 bg-white border-b border-slate-200 shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-6 grid gap-6 md:grid-cols-[1.4fr_0.6fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">Categorias</p>
              <div className="mt-5">
                {renderCategorias(() => setMenuAbierto(false))}
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm font-semibold">
              {/* Buscador mobile con autocompletado */}
              <div ref={searchRef} className="relative">
                <form onSubmit={event => onSubmitBuscar(event)} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      value={buscarNav}
                      onChange={onChangeBuscar}
                      onFocus={onFocusBuscar}
                      onBlur={onBlurBuscar}
                      onKeyDown={onKeyDownBuscar}
                      placeholder="Buscar producto o categoría..."
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={mostrarSugerencias}
                      aria-autocomplete="list"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-orange-400 text-sm"
                    />
                    {renderSugerenciasDropdown()}
                  </div>
                  <button
                    type="submit"
                    className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-3 py-2 shadow-sm ring-1 ring-amber-200 transition-all hover:bg-slate-800 hover:shadow-md hover:ring-2 hover:ring-amber-300"
                    aria-label="Buscar"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                </form>
              </div>
              <Link href="/" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Inicio</Link>
              <Link href="/productos" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Productos</Link>
              <Link href="/nosotros" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Nosotros</Link>
              <Link href="/contacto" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Contacto</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}