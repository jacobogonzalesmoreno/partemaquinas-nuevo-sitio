'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { parseImagenesValue } from '@/lib/imagenes';
import {
  getCategoriasCatalogo,
  normalizarClave,
  productoCoincideCategoriaPorNombre,
  slugifyCategoria,
} from '@/lib/catalogo-categorias';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const buscarInicial = searchParams.get('buscar') || '';
  const [buscar, setBuscar] = useState(buscarInicial);
  const [inputBuscar, setInputBuscar] = useState(buscarInicial);
  const [cargando, setCargando] = useState(true);
  const esSubcategoria = buscar.trim().length > 0;

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
    // ✅ Correcto
const url = buscar ? '/api/productos?buscar=' + encodeURIComponent(buscar) + '&limit=1000' : '/api/productos?limit=1000';
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setProductos(data);
        setCargando(false);
      });
  }, [buscar]);

  const onSubmitBuscar = event => {
    event.preventDefault();
    const value = inputBuscar.trim();
    setBuscar(value);
    router.push(value ? `/productos?buscar=${encodeURIComponent(value)}` : '/productos');
  };

  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';
  const categoriaEmojis = {
    Motores: '⚙️',
    'Liner kit': '🧰',
    'Bomba Inyeccion': '⛽',
    Inyectores: '💉',
    Turbos: '🌀',
    Accesorios: '🧩',
    'Tuberia Inyeccion': '🧪',
    Correas: '🪢',
    Soportes: '🧲',
    Filtros: '🧴',
    Bloques: '🧱',
    Culatas: '🧠',
    Cigueñales: '🔩',
    Casquetes: '🪛',
    'Arbol de levas': '🌿',
    'Tapa Valvulas': '🛡️',
    Empaquetaduras: '🧻',
    Coronas: '👑',
    Piñones: '⚙️',
    Solares: '☀️',
    Planetario: '🪐',
    Ventiladores: '🌬️',
    Otros: '🧰',
  };
  const parseImagenes = parseImagenesValue;

  const obtenerImagenPrincipal = producto => {
    if (!producto) {
      return null;
    }
    const candidatos = [
      producto.imagenes,
      producto.imagen,
      producto.imagen_principal,
      producto.imagen_principal_url,
      producto.image,
      producto.img,
      producto.foto,
    ];
    for (const valor of candidatos) {
      const imagen = parseImagenes(valor)[0];
      if (imagen) {
        return imagen;
      }
    }
    return null;
  };

  const guardarScrollCatalogo = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('catalogoUrl', window.location.pathname + window.location.search);
    sessionStorage.setItem('catalogoScroll', String(window.scrollY));
  };

  const productosPorCategoria = useMemo(() => {
    const categoriasBase = getCategoriasCatalogo(productos);
    const entries = categoriasBase
      .map(categoria => {
        const items = productos.filter(producto => productoCoincideCategoriaPorNombre(producto, categoria));
        return [categoria, items];
      })
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (!esSubcategoria) {
      return entries;
    }
    const termino = normalizarClave(buscar);
    const indicePrincipal = entries.findIndex(([categoria]) => normalizarClave(categoria) === termino);
    if (indicePrincipal <= 0) {
      return entries;
    }
    const [principal] = entries.splice(indicePrincipal, 1);
    return [principal, ...entries];
  }, [productos, esSubcategoria, buscar]);

  const productoRecomendado = useMemo(() => {
    if (productos.length === 0) {
      return null;
    }
    const indice = Math.floor(Math.random() * productos.length);
    return productos[indice];
  }, [productos, buscar]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-white py-12 px-6 text-center border-b border-slate-200">
        <h2 className="text-4xl font-bold text-slate-900 mb-3">Catalogo de Repuestos</h2>
        <p className="text-slate-600 mb-6">Explora por categoria y encuentra el repuesto ideal.</p>
        <div className="w-full max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-anim inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-5 py-3"
          >
            Atras
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
        ) : productos.length === 0 ? (
          <div className="text-center text-slate-500 py-20 text-xl">No se encontraron productos</div>
        ) : (
          <div className="flex flex-col gap-10">
            {!esSubcategoria ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {productosPorCategoria.map(([categoria, items]) => {
                  const emoji = categoriaEmojis[categoria] || '🧰';
                  const categoriaSlug = slugifyCategoria(categoria);
                  return (
                    <Link
                      key={categoria}
                      href={`/productos/categorias/${categoriaSlug}`}
                      className="btn-anim bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:border-orange-300 flex flex-col items-center gap-2 text-center"
                      title={categoria}
                      onClick={guardarScrollCatalogo}
                    >
                      <span className="text-3xl" aria-hidden="true">{emoji}</span>
                      <span className="text-sm font-semibold text-slate-900">{categoria}</span>
                      <span className="text-xs text-slate-500">{items.length} productos</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
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
                {productoRecomendado && (
                  <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <p className="text-xl font-bold text-slate-900 mb-4">Producto recomendado</p>
                    <div className="max-w-sm">
                      {(() => {
                        const imagen = obtenerImagenPrincipal(productoRecomendado);
                        return (
                          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                            {imagen ? (
                              <img
                                src={imagen}
                                alt={productoRecomendado.nombre}
                                className="w-full h-48 object-contain bg-slate-100"
                                onError={e => { e.currentTarget.src = placeholderImage; }}
                              />
                            ) : (
                              <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-5xl text-slate-400">⚙️</div>
                            )}
                            <div className="p-4 flex flex-col gap-3">
                              <h4 className="text-slate-900 font-semibold text-sm line-clamp-2">{productoRecomendado.nombre}</h4>
                              <Link
                                href={'/productos/' + productoRecomendado.id}
                                className="btn-anim block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm py-2 rounded-lg transition-colors"
                                onClick={guardarScrollCatalogo}
                              >
                                Ver detalle
                              </Link>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </section>
                )}
              </div>
            )}
            {esSubcategoria && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700">Buscar de nuevo</label>
                <form onSubmit={onSubmitBuscar} className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar producto, marca o referencia..."
                    value={inputBuscar}
                    onChange={e => setInputBuscar(e.target.value)}
                    className="w-full pl-12 pr-5 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-300 focus:outline-none focus:border-orange-400 text-lg shadow-sm"
                  />
                </form>
              </section>
            )}
          </div>
        )}
      </div>
      {esSubcategoria && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="btn-anim fixed bottom-6 left-6 z-40 inline-flex items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold w-12 h-12 shadow-lg shadow-slate-900/30"
          aria-label="Subir arriba"
        >
          ↑
        </button>
      )}
    </main>
  );
}