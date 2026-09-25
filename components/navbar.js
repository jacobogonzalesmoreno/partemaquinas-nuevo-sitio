'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';
import { crearDebounce } from '@/lib/busqueda-tolerante';

const RECURSOS = {
  Manuales: [
    ['Kobelco', 'https://truckmanualshub.com/kobelco-excavator-parts-manuals-wiring-diagrams-service-repair-and-workshop-manuals-pdf/'],
    ['Hitachi', 'https://truckmanualshub.com/hitachi-excavators-service-repair-and-workshop-manuals-pdf/'],
    ['Caterpillar', 'https://truckmanualshub.com/category/tractors/caterpillar/'],
    ['Komatsu', 'https://truckmanualshub.com/komatsu-excavator-service-workshop-parts-manual-pdf/'],
    ['LiuGong', 'https://truckmanualshub.com/liugong-excavators-service-operators-and-maintenance-manuals-pdf/'],
    ['Sany', 'https://truckmanualshub.com/sany-excavators-operators-maintenance-and-service-manuals-pdf/'],
    ['Bobcat', 'https://truckmanualshub.com/bobcat-excavator-service-repair-and-operators-manuals-parts-manuals-pdf/'],
    ['John Deere', 'https://truckmanualshub.com/excavator-service-repair-operators-and-parts-manuals-pdf/'],
    ['New Holland', 'https://truckmanualshub.com/category/new-holland/'],
  ].map(([nombre, href]) => ({ nombre, detalle: 'Manuales técnicos', href })),
  Mecánicos: [
    ['Carlos Mario Correa', 'Motor · Mantenimientos', '573154850226'],
    ['Victor Acevedo', 'Hidráulica', '573147695473'],
    ['Jimmy Ayala', 'Motor', '573148731060'],
    ['Wilson Bolivar', 'Motor · Hidráulico · Electrónico', '573162973949'],
    ['Carlos Gonzalez', 'Motor · Hidráulica', '573228596442'],
    ['Jairo Valencia', 'Motor · Hidráulica', '573146013706'],
  ].map(([nombre, detalle, telefono]) => ({ nombre, detalle, href: `https://wa.me/${telefono}` })),
  Aliados: [
    { nombre: 'Rectificadora H&M', detalle: 'Servicio especializado', href: 'https://wa.me/573146820296' },
    { nombre: 'JMM Hidráulicos', detalle: 'Sistemas hidráulicos', href: 'https://www.jmmhidraulicos.com/' },
  ],
};

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [recursosAbiertos, setRecursosAbiertos] = useState(false);
  const [seccionRecursos, setSeccionRecursos] = useState('Manuales');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [categoriaMovilAbierta, setCategoriaMovilAbierta] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const [productosMenuAbierto, setProductosMenuAbierto] = useState(false);
  const [panelAccesoRapido, setPanelAccesoRapido] = useState(null);
  const [buscarNav, setBuscarNav] = useState('');
  const [sugerenciasProds, setSugerenciasProds] = useState([]);
  const [cargandoProds, setCargandoProds] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const hideCategoriaTimer = useRef(null);
  const hideSubcategoriaTimer = useRef(null);
  const hideProductosTimer = useRef(null);
  const hideRecursosTimer = useRef(null);
  const hideSocialPanelTimer = useRef(null);
  const hideCartPanelTimer = useRef(null);
  const hideAccountPanelTimer = useRef(null);
  const searchRef = useRef(null);
  const abortRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const syncQuery = () => setBuscarNav(new URLSearchParams(window.location.search).get('buscar') || '');
    const syncCatalogSearch = event => setBuscarNav(event.detail || '');
    syncQuery();
    window.addEventListener('popstate', syncQuery);
    window.addEventListener('catalog-search', syncCatalogSearch);
    return () => { window.removeEventListener('popstate', syncQuery); window.removeEventListener('catalog-search', syncCatalogSearch); };
  }, []);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.dataset.mobileMenuOpen = String(menuAbierto);
    if (menuAbierto) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = overflowAnterior;
    return () => {
      delete document.body.dataset.mobileMenuOpen;
      document.body.style.overflow = overflowAnterior;
    };
  }, [menuAbierto]);

  const menuCategorias = MENU_CATEGORIAS;
  const navLinkClass = 'site-nav-link';
  const navDropdownLinkClass = 'nav-category-item inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit';
  const navSubmenuLinkClass = 'nav-category-item inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit min-w-[124px]';
  const navSubmenuChildLinkClass = 'nav-category-item inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit min-w-[116px]';
  const mobileLinkClass = 'inline-flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-all border border-slate-200 bg-white shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md';

  const hrefCategoria = nombre => `/productos/categorias/${slugifyCategoria(nombre)}`;
  const renderRecursos = () => (
    <div className="support-menu__content">
      <div className="support-menu__tabs" role="tablist" aria-label="Recursos y soporte">
        {Object.keys(RECURSOS).map(seccion => (
          <button key={seccion} type="button" role="tab" aria-selected={seccionRecursos === seccion}
            onClick={() => setSeccionRecursos(seccion)}>{seccion}</button>
        ))}
      </div>
      <div className="support-menu__list" role="tabpanel">
        {RECURSOS[seccionRecursos].map(item => (
          <a key={item.nombre} className="support-menu__item" href={item.href}
            target="_blank" rel="noreferrer" onClick={() => { setRecursosAbiertos(false); setMenuAbierto(false); }}>
            <strong>{item.nombre}</strong><small>{item.detalle}</small>
          </a>
        ))}
      </div>
    </div>
  );
  const totalSugerencias = sugerenciasProds.length + 1;

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
    return () => { debouncedProds.cancel(); if (abortRef.current) abortRef.current.abort(); };
  }, [debouncedProds]);

  const onChangeBuscar = event => {
    const value = event.target.value;
    setBuscarNav(value);
    setSugerenciaActiva(-1);
    debouncedProds(value);
    if (value.trim().length >= 2) setMostrarSugerencias(true);
    else setMostrarSugerencias(false);
  };

  const onSubmitBuscar = (event, overrideHref) => {
    event?.preventDefault();
    setMostrarSugerencias(false);
    debouncedProds.cancel();
    if (abortRef.current) abortRef.current.abort();
    if (overrideHref) { router.push(overrideHref); setBuscarNav(''); return; }
    const value = buscarNav.trim();
    if (!value) return;
    router.push(`/productos?buscar=${encodeURIComponent(value)}`);
    setBuscarNav(value);
  };

  const onFocusBuscar = () => {
    if (buscarNav.trim().length >= 2 && sugerenciasProds.length > 0) setMostrarSugerencias(true);
  };

  const onBlurBuscar = () => {
    setTimeout(() => { setMostrarSugerencias(false); setSugerenciaActiva(-1); }, 200);
  };

  const onKeyDownBuscar = event => {
    const haySugerencias = mostrarSugerencias && (sugerenciasProds.length > 0 || cargandoProds);
    if (!haySugerencias) { if (event.key === 'Enter') onSubmitBuscar(event); return; }
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); setSugerenciaActiva(prev => (prev + 1) % totalSugerencias); break;
      case 'ArrowUp': event.preventDefault(); setSugerenciaActiva(prev => (prev - 1 + totalSugerencias) % totalSugerencias); break;
      case 'Enter': {
        event.preventDefault();
        const idx = sugerenciaActiva;
        if (idx >= 0 && idx < sugerenciasProds.length) { router.push(`/productos/${sugerenciasProds[idx].id}`); setBuscarNav(''); setMostrarSugerencias(false); return; }
        if (idx === sugerenciasProds.length) { onSubmitBuscar(event); return; }
        onSubmitBuscar(event); break;
      }
      case 'Escape': setMostrarSugerencias(false); setSugerenciaActiva(-1); break;
    }
  };

  useEffect(() => {
    const handleClickOutside = event => { if (searchRef.current && !searchRef.current.contains(event.target)) { setMostrarSugerencias(false); setSugerenciaActiva(-1); } };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderSugerenciasDropdown = () => {
    const tieneProds = sugerenciasProds.length > 0 || cargandoProds;
    if (!mostrarSugerencias || !tieneProds) return null;
    return (
      <div className="absolute left-0 top-full z-[100] mt-1 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        <ul className="py-1 max-h-[70vh] overflow-y-auto">
          <li><p className="px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">Productos</p></li>
          {cargandoProds && sugerenciasProds.length === 0 && (<li><div className="px-3.5 py-4 text-center text-sm text-slate-400">Buscando productos...</div></li>)}
          {sugerenciasProds.map((prod, index) => {
            const thisIndex = index;
            const isActive = sugerenciaActiva === thisIndex;
            return (
              <li key={`prod-${prod.id}`}>
                <button type="button" className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 transition-colors ${isActive ? 'bg-amber-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                  onMouseDown={event => { event.preventDefault(); router.push(`/productos/${prod.id}`); setBuscarNav(''); setMostrarSugerencias(false); }}
                  onMouseEnter={() => setSugerenciaActiva(thisIndex)}>
                  {prod.imagen ? <img src={prod.imagen} alt="" className="h-10 w-10 rounded-lg object-contain bg-white border border-slate-200 flex-shrink-0" /> : <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 flex-shrink-0" aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 8h16v11H4zM7 8l1.5-3h7L17 8M8 13h.01M12 13h.01M16 13h.01"/><path d="M7 19v2m10-2v2"/></svg></span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prod.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {prod.sku && <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>}
                      {prod.marcas && <span className="text-[10px] text-orange-500 font-medium">{prod.marcas}</span>}
                    </div>
                  </div>
                  <span className="text-orange-400 text-xs flex-shrink-0">→</span>
                </button>
              </li>
            );
          })}
          <li className="border-t border-slate-100">
            <button type="button" className={`w-full text-left px-3.5 py-2.5 flex items-center gap-3 text-sm transition-colors ${sugerenciaActiva === totalSugerencias - 1 ? 'bg-amber-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
              onMouseDown={event => { event.preventDefault(); onSubmitBuscar(event); }}
              onMouseEnter={() => setSugerenciaActiva(totalSugerencias - 1)}>
              <span className="flex items-center justify-center h-7 w-7 rounded-full border border-slate-200 bg-slate-50 text-slate-400 flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <span>Buscar &quot;{buscarNav.trim()}&quot; en todos los productos</span>
            </button>
          </li>
        </ul>
      </div>
    );
  };

  const renderCategorias = (onSelect, mobile = false) => (
    <ul className={`${mobile ? 'grid grid-cols-2 gap-2 w-full' : 'nav-categories-list inline-flex flex-col gap-1 w-fit'}`}>
      {menuCategorias.map(categoria => {
        const submenuOffsetClass = 'left-[calc(100%+8px)]';
        return (
          <li key={categoria.nombre} className={`${mobile ? 'w-full' : 'relative group w-fit z-10 hover:z-30'}`}
            onMouseEnter={() => { if (hideCategoriaTimer.current) { clearTimeout(hideCategoriaTimer.current); hideCategoriaTimer.current = null; } setCategoriaActiva(categoria.nombre); }}
            onMouseLeave={() => { if (hideCategoriaTimer.current) clearTimeout(hideCategoriaTimer.current); hideCategoriaTimer.current = setTimeout(() => setCategoriaActiva(null), 100); }}>
            <Link href={hrefCategoria(categoria.nombre)} onClick={onSelect} className={mobile ? `${navDropdownLinkClass} w-full min-h-11 px-3` : navDropdownLinkClass}>
              <span>{categoria.nombre}</span>{categoria.hijos && <span className="text-orange-400">›</span>}
            </Link>
            {categoria.hijos && !mobile && (
                <div className={`nav-subcategory-panel absolute ${submenuOffsetClass} top-0 z-[60] transition-all duration-200 ease-out ${categoriaActiva === categoria.nombre ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-2 scale-95 pointer-events-none'}`}>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-2.5">
                  <ul className="nav-subcategory-list">
                    {categoria.hijos.map(hijo => (
                      <li key={hijo.nombre} className="relative group/child z-10 hover:z-30"
                        onMouseEnter={() => { if (hideCategoriaTimer.current) { clearTimeout(hideCategoriaTimer.current); hideCategoriaTimer.current = null; } if (hideSubcategoriaTimer.current) { clearTimeout(hideSubcategoriaTimer.current); hideSubcategoriaTimer.current = null; } setCategoriaActiva(categoria.nombre); setSubcategoriaActiva(hijo.nombre); }}
                        onMouseLeave={() => { if (hideSubcategoriaTimer.current) clearTimeout(hideSubcategoriaTimer.current); hideSubcategoriaTimer.current = setTimeout(() => setSubcategoriaActiva(null), 100); }}>
                        <Link href={hrefCategoria(hijo.nombre)} onClick={onSelect} className={navSubmenuLinkClass}>
                          <span>{hijo.nombre}</span>{hijo.hijos && <span className="text-orange-400">›</span>}
                        </Link>
                        {hijo.hijos && (
                          <div
                            onMouseEnter={() => {
                              if (hideCategoriaTimer.current) { clearTimeout(hideCategoriaTimer.current); hideCategoriaTimer.current = null; }
                              if (hideSubcategoriaTimer.current) { clearTimeout(hideSubcategoriaTimer.current); hideSubcategoriaTimer.current = null; }
                              setCategoriaActiva(categoria.nombre);
                              setSubcategoriaActiva(hijo.nombre);
                            }}
                            onMouseLeave={() => {
                              if (hideSubcategoriaTimer.current) clearTimeout(hideSubcategoriaTimer.current);
                              hideSubcategoriaTimer.current = setTimeout(() => setSubcategoriaActiva(null), 100);
                            }}
                            className={`nav-child-category-panel absolute left-[calc(100%+8px)] top-0 z-[70] transition-all duration-200 ease-out ${subcategoriaActiva === hijo.nombre ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto' : 'opacity-0 translate-x-2 scale-95 pointer-events-none'}`}>
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-2">
                              <ul className="space-y-0.5">
                                {hijo.hijos.map(nieto => (
                                  <li key={nieto.nombre}><Link href={hrefCategoria(nieto.nombre)} onClick={onSelect} className={navSubmenuChildLinkClass}>{nieto.nombre}</Link></li>
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

  const renderCategoriasMovil = () => (
    <ul className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
      {menuCategorias.map(categoria => {
        const abierta = categoriaMovilAbierta === categoria.nombre;
        return (
          <li key={categoria.nombre}>
            <div className="flex min-h-12 items-center gap-2 px-3">
              <Link href={hrefCategoria(categoria.nombre)} onClick={() => setMenuAbierto(false)} className="flex min-w-0 flex-1 items-center py-3 text-sm font-semibold text-slate-700">
                <span className="truncate">{categoria.nombre}</span>
              </Link>
              {categoria.hijos && (
                <button type="button" aria-label={`${abierta ? 'Ocultar' : 'Mostrar'} subcategorias de ${categoria.nombre}`} aria-expanded={abierta}
                  onClick={() => setCategoriaMovilAbierta(abierta ? null : categoria.nombre)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-orange-500 transition-colors hover:bg-orange-100">
                  <svg className={`h-4 w-4 transition-transform ${abierta ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </button>
              )}
            </div>
            {categoria.hijos && abierta && (
              <ul className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white px-3 py-3">
                {categoria.hijos.map(hijo => (
                  <li key={hijo.nombre}>
                    <Link href={hrefCategoria(hijo.nombre)} onClick={() => setMenuAbierto(false)} className="flex min-h-10 items-center rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-600 hover:border-orange-300 hover:bg-orange-50">
                      {hijo.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <nav className="site-navbar sticky top-0 z-50 relative overflow-visible">
      <div className="site-navbar__inner relative flex items-center gap-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-none bg-[#1b1b1d] border border-[#38383a] shadow-sm">
            <Image src="/logo/logo-partemaquinas-oficial.jpeg" alt="ParteMaquinas" width={38} height={38} className="object-contain" priority />
          </span>
          <span className="truncate text-slate-900 text-xl sm:text-2xl font-bold tracking-tight">ParteMaquinas</span>
        </Link>
        <div className="site-navbar__links hidden xl:flex gap-2 text-sm font-semibold">
          <Link href="/" className={navLinkClass}>Inicio</Link>
          <div className="nav-products-menu relative" onMouseEnter={() => { if (hideProductosTimer.current) clearTimeout(hideProductosTimer.current); setProductosMenuAbierto(true); }} onMouseLeave={() => { if (hideProductosTimer.current) clearTimeout(hideProductosTimer.current); hideProductosTimer.current = setTimeout(() => setProductosMenuAbierto(false), 100); }}>
            <Link href="/productos" aria-expanded={productosMenuAbierto} className={`${navLinkClass} gap-1`}>Productos<span className="text-orange-400">▾</span></Link>
            <div className={`nav-products-menu__flyout absolute left-0 top-full z-50 pt-2 transition-all duration-200 ${productosMenuAbierto ? 'visible translate-y-0 opacity-100 pointer-events-auto' : 'invisible translate-y-1 opacity-0 pointer-events-none'}`}>
              <div className="nav-categories-panel w-fit border p-3 shadow-xl">
                <p className="text-[10px] uppercase tracking-[0.28em] text-slate-400 font-semibold">Categorias</p>
                <div className="mt-2.5">{renderCategorias()}</div>
              </div>
            </div>
          </div>
          <div className="relative nav-resources-menu" onMouseEnter={() => { if (hideRecursosTimer.current) { clearTimeout(hideRecursosTimer.current); hideRecursosTimer.current = null; } setRecursosAbiertos(true); }} onMouseLeave={() => { if (hideRecursosTimer.current) clearTimeout(hideRecursosTimer.current); hideRecursosTimer.current = setTimeout(() => setRecursosAbiertos(false), 100); }}>
            <button type="button" className={`${navLinkClass} ${recursosAbiertos ? 'bg-white/10' : ''}`} aria-expanded={recursosAbiertos}
              onClick={() => setRecursosAbiertos(open => !open)}>Recursos<span className="text-orange-400">▾</span></button>
            {recursosAbiertos && <div className="support-menu">{renderRecursos()}</div>}
          </div>
          <Link href="/nosotros" className={navLinkClass}>Nosotros</Link>
          <Link href="/contacto" className={navLinkClass}>Contacto</Link>
        </div>
        <div ref={searchRef} className="site-navbar__search relative hidden md:block">
          <form onSubmit={event => onSubmitBuscar(event)} className="flex items-center gap-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" value={buscarNav} onChange={onChangeBuscar} onFocus={onFocusBuscar} onBlur={onBlurBuscar} onKeyDown={onKeyDownBuscar} placeholder="Buscar repuestos..." autoComplete="off" role="combobox" aria-expanded={mostrarSugerencias} aria-autocomplete="list"
                className="site-navbar__input w-full pl-10 pr-3 py-2.5 rounded-full text-sm" />
              {renderSugerenciasDropdown()}
            </div>
            <button type="submit" className="site-navbar__search-button btn-anim inline-flex items-center justify-center rounded-full px-3 py-2.5 text-sm" aria-label="Buscar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </form>
        </div>
        <div className="site-navbar__quick-actions">
          <div className="site-navbar__quick-item" onMouseEnter={() => { if (hideSocialPanelTimer.current) { clearTimeout(hideSocialPanelTimer.current); hideSocialPanelTimer.current = null; } }} onMouseLeave={() => { if (panelAccesoRapido === 'social') { if (hideSocialPanelTimer.current) clearTimeout(hideSocialPanelTimer.current); hideSocialPanelTimer.current = setTimeout(() => setPanelAccesoRapido(current => current === 'social' ? null : current), 180); } }}>
            <button type="button" className="site-navbar__icon-button" aria-label="Redes sociales" aria-expanded={panelAccesoRapido === 'social'} onClick={() => setPanelAccesoRapido(panelAccesoRapido === 'social' ? null : 'social')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
            </button>
            {panelAccesoRapido === 'social' && <div className="site-navbar__quick-panel"><strong>ParteMáquinas</strong>
              <a className="site-navbar__social-link" href="https://www.instagram.com/partemaquinas/" target="_blank" rel="noreferrer"><svg className="site-social-icon site-social-icon--instagram" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle className="site-social-icon__dot" cx="17.5" cy="6.7" r="1"/></svg>Instagram</a>
              <a className="site-navbar__social-link" href="https://www.facebook.com/ParteMaquinasCol" target="_blank" rel="noreferrer"><svg className="site-social-icon site-social-icon--facebook" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.6 1.6-1.6h1.7V3.5c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.2H7.3V13h2.8v8h3.4Z"/></svg>Facebook</a>
              <a className="site-navbar__social-link" href="https://www.tiktok.com/@partemaquinas" target="_blank" rel="noreferrer"><svg className="site-social-icon site-social-icon--tiktok" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 8.2a6.7 6.7 0 0 1-4.1-1.4v7.1a5.7 5.7 0 1 1-5-5.7v3.6a2.2 2.2 0 1 0 1.5 2.1V2.8h3.5c.1 2.1 1.6 3.9 4.1 4.2v1.2Z"/></svg>TikTok</a>
            </div>}
          </div>
          <div className="site-navbar__quick-item" onMouseEnter={() => { if (hideCartPanelTimer.current) { clearTimeout(hideCartPanelTimer.current); hideCartPanelTimer.current = null; } }} onMouseLeave={() => { if (panelAccesoRapido === 'cart') { if (hideCartPanelTimer.current) clearTimeout(hideCartPanelTimer.current); hideCartPanelTimer.current = setTimeout(() => setPanelAccesoRapido(current => current === 'cart' ? null : current), 180); } }}>
            <button type="button" className="site-navbar__icon-button" aria-label="Carrito" aria-expanded={panelAccesoRapido === 'cart'} onClick={() => setPanelAccesoRapido(panelAccesoRapido === 'cart' ? null : 'cart')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
            </button>
            {panelAccesoRapido === 'cart' && <div className="site-navbar__quick-panel"><strong>Tu carrito</strong><p>Aún no has agregado productos.</p><Link href="/productos" onClick={() => setPanelAccesoRapido(null)}>Explorar catálogo</Link></div>}
          </div>
          <div className="site-navbar__quick-item" onMouseEnter={() => { if (hideAccountPanelTimer.current) { clearTimeout(hideAccountPanelTimer.current); hideAccountPanelTimer.current = null; } }} onMouseLeave={() => { if (panelAccesoRapido === 'account') { if (hideAccountPanelTimer.current) clearTimeout(hideAccountPanelTimer.current); hideAccountPanelTimer.current = setTimeout(() => setPanelAccesoRapido(current => current === 'account' ? null : current), 180); } }}>
            <button type="button" className="site-navbar__icon-button" aria-label="Cuenta" aria-expanded={panelAccesoRapido === 'account'} onClick={() => setPanelAccesoRapido(panelAccesoRapido === 'account' ? null : 'account')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            {panelAccesoRapido === 'account' && <div className="site-navbar__quick-panel"><strong>Cuenta</strong><Link href="/admin" onClick={() => setPanelAccesoRapido(null)}>Acceso administrativo</Link></div>}
          </div>
        </div>
        <button type="button" onClick={() => { setMenuAbierto(valor => !valor); setRecursosAbiertos(false); }} aria-expanded={menuAbierto} aria-controls="mobile-navigation" className="site-navbar__menu btn-anim inline-flex xl:hidden items-center justify-center rounded-xl px-3 py-2.5">
          <span className="sr-only">{menuAbierto ? 'Cerrar menu' : 'Abrir menu'}</span>
          {menuAbierto ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
        </button>
      </div>
      {menuAbierto && (
        <div id="mobile-navigation" className="site-navbar__mobile absolute left-0 right-0 top-full z-50 max-h-[calc(100svh-4.5rem)] overflow-y-auto overscroll-contain border-b shadow-xl xl:hidden">
          <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-2 text-sm font-semibold">
              <p className="px-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">Navegacion</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Inicio</Link>
                <Link href="/productos" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Productos</Link>
                <Link href="/nosotros" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Nosotros</Link>
                <Link href="/contacto" onClick={() => setMenuAbierto(false)} className={mobileLinkClass}>Contacto</Link>
              </div>
            </div>
            <div>
              <button type="button" className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700"
                aria-expanded={recursosAbiertos} onClick={() => setRecursosAbiertos(open => !open)}>
                Manuales, mecánicos y aliados
                <svg className={`h-4 w-4 transition-transform ${recursosAbiertos ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {recursosAbiertos && <div className="support-menu mt-2">{renderRecursos()}</div>}
            </div>
            <div ref={searchRef} className="relative">
              <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">Buscar</p>
                <form onSubmit={event => onSubmitBuscar(event)} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </span>
                    <input type="text" value={buscarNav} onChange={onChangeBuscar} onFocus={onFocusBuscar} onBlur={onBlurBuscar} onKeyDown={onKeyDownBuscar} placeholder="Buscar productos..." autoComplete="off" role="combobox" aria-expanded={mostrarSugerencias} aria-autocomplete="list"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-orange-400 text-sm" />
                    {renderSugerenciasDropdown()}
                  </div>
                  <button type="submit" className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-3 py-2 shadow-sm ring-1 ring-amber-200 transition-all hover:bg-slate-800 hover:shadow-md hover:ring-2 hover:ring-amber-300" aria-label="Buscar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  </button>
                </form>
            </div>
            <div>
              <p className="mb-2 px-1 text-[10px] uppercase tracking-[0.28em] text-slate-400">Categorias</p>
              {renderCategoriasMovil()}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
