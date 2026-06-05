'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolverRutaBusquedaCatalogo, slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';

export default function Navbar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const [buscarNav, setBuscarNav] = useState('');
  const hideCategoriaTimer = useRef(null);
  const hideSubcategoriaTimer = useRef(null);
  const router = useRouter();

  const menuCategorias = MENU_CATEGORIAS;
  const navLinkClass = 'inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-[13px] font-semibold text-slate-600 transition-all border border-slate-200 bg-white shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md';
  const navDropdownLinkClass = 'inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-medium text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit';
  const navSubmenuLinkClass = 'inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit min-w-[124px]';
  const navSubmenuChildLinkClass = 'inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 transition-all shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md w-fit min-w-[116px]';
  const mobileLinkClass = 'inline-flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-all border border-slate-200 bg-white shadow-sm hover:text-slate-900 hover:border-amber-400 hover:ring-1 hover:ring-amber-200 hover:shadow-md';

  const hrefCategoria = nombre => `/productos/categorias/${slugifyCategoria(nombre)}`;
  const onSubmitBuscar = event => {
    event.preventDefault();
    const value = buscarNav.trim();
    router.push(resolverRutaBusquedaCatalogo(value));
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
              src="/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png"
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
        <form onSubmit={onSubmitBuscar} className="hidden lg:flex items-center gap-2">
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
              onChange={event => setBuscarNav(event.target.value)}
              placeholder="Buscar..."
              className="w-52 pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-orange-400 text-sm"
            />
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
              <form onSubmit={onSubmitBuscar} className="flex items-center gap-2">
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
                    onChange={event => setBuscarNav(event.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:outline-none focus:border-orange-400 text-sm"
                  />
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