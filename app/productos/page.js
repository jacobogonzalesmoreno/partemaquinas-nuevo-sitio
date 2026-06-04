'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getImagenesProducto } from '@/lib/imagenes';
import { resolverRutaBusquedaCatalogo, slugifyCategoria } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const buscarInicial = searchParams.get('buscar') || '';
  const [buscar, setBuscar] = useState(buscarInicial);
  const [inputBuscar, setInputBuscar] = useState(buscarInicial);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [subcategoriaActiva, setSubcategoriaActiva] = useState(null);
  const hideCategoriaTimer = useRef(null);
  const hideSubcategoriaTimer = useRef(null);

  useEffect(() => {
    setBuscar(buscarInicial);
    setInputBuscar(buscarInicial);
  }, [buscarInicial]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUrl = sessionStorage.getItem('catalogoUrl');
    const savedScroll = sessionStorage.getItem('catalogoScroll');
    const currentUrl = window.location.pathname + window.location.search;
    if (savedUrl && savedScroll && savedUrl === currentUrl) {
      const scrollY = Number(savedScroll);
      if (!Number.isNaN(scrollY)) {
        window.scrollTo({ top: scrollY, behavior: 'auto' });
      }
      sessionStorage.removeItem('catalogoUrl');
      sessionStorage.removeItem('catalogoScroll');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        guardarScrollCatalogo();
      }
    };
    window.addEventListener('pagehide', guardarScrollCatalogo);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('pagehide', guardarScrollCatalogo);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    setCargando(true);
    setError('');
    // ✅ Correcto
const url = buscar ? '/api/productos?buscar=' + encodeURIComponent(buscar) + '&limit=1000' : '/api/productos?limit=1000';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProductos(data);
        setCargando(false);
      })
      .catch(() => {
        setError('No se pudo cargar productos.');
        setCargando(false);
      });
  }, [buscar]);

  const onSubmitBuscar = event => {
    event.preventDefault();
    const value = inputBuscar.trim();
    setBuscar(value);
    router.push(resolverRutaBusquedaCatalogo(value));
  };

  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';
  const obtenerImagenPrincipal = producto => {
    const imagenes = getImagenesProducto(producto);
    return imagenes[0] || null;
  };

  const guardarScrollCatalogo = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('catalogoUrl', window.location.pathname + window.location.search);
    sessionStorage.setItem('catalogoScroll', String(window.scrollY));
  };

  const hrefCategoria = nombre => `/productos/categorias/${slugifyCategoria(nombre)}`;

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
          <form onSubmit={onSubmitBuscar} className="flex-1">
            <input
              type="text"
              placeholder="Buscar producto, marca o referencia..."
              value={inputBuscar}
              onChange={e => setInputBuscar(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-300 focus:outline-none focus:border-orange-400 text-lg shadow-sm"
            />
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {cargando ? (
          <div className="text-center text-slate-500 py-20 text-xl">Cargando productos...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-20 text-xl">{error}</div>
        ) : productos.length === 0 ? (
          <div className="text-center text-slate-500 py-20 text-xl">No se encontraron productos</div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block relative z-20">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">Categorias</p>
                <ul className="mt-4 inline-flex flex-col gap-2 w-fit">
                  {MENU_CATEGORIAS.map(categoria => {
                    const submenuOffsetClass = categoria.nombre === 'Giro'
                      ? 'left-[calc(100%+32px)]'
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
                          onClick={guardarScrollCatalogo}
                          className="inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:border-orange-300 w-fit"
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
                            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-3">
                              <ul className="space-y-1.5">
                                {categoria.hijos.map(hijo => (
                                  <li
                                    key={hijo.nombre}
                                    className="relative group/child z-10 hover:z-30"
                                    onMouseEnter={() => {
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
                                      onClick={guardarScrollCatalogo}
                                      className="inline-flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:border-orange-300 w-fit min-w-[160px]"
                                    >
                                      <span>{hijo.nombre}</span>
                                      {hijo.hijos && <span className="text-orange-400">›</span>}
                                    </Link>
                                    {hijo.hijos && (
                                      <div
                                        className={`absolute left-[calc(100%+16px)] top-0 z-[70] w-52 transition-all duration-200 ease-out ${
                                          subcategoriaActiva === hijo.nombre
                                            ? 'opacity-100 translate-x-0 scale-100 pointer-events-auto'
                                            : 'opacity-0 translate-x-2 scale-95 pointer-events-none'
                                        }`}
                                      >
                                        <div className="rounded-2xl border border-slate-200 bg-white shadow-lg p-3">
                                          <ul className="space-y-1.5">
                                            {hijo.hijos.map(nieto => (
                                              <li key={nieto.nombre}>
                                                <Link
                                                  href={hrefCategoria(nieto.nombre)}
                                                  onClick={guardarScrollCatalogo}
                                                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:border-orange-300 w-fit min-w-[150px]"
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
              </div>
            </aside>

            <div className="flex flex-col gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {productos.map(producto => {
                  const imagen = obtenerImagenPrincipal(producto);
                  return (
                    <div key={producto.id} className="bg-slate-50 rounded-2xl border border-slate-200 hover:border-orange-400 transition-all overflow-hidden shadow-sm hover:shadow-md flex flex-col">
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
                        <h4 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2">{producto.nombre}</h4>
                        {producto.marcas && <p className="text-slate-500 text-xs mb-3">🏷️ {producto.marcas}</p>}
                        <div className="mt-auto flex flex-col gap-2">
                          <Link
                            href={'/productos/' + producto.id}
                            className="btn-anim block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm py-2 rounded-lg transition-colors"
                            onClick={guardarScrollCatalogo}
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
          </div>
        )}
      </div>
    </main>
  );
}