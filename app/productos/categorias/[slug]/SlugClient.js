'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getImagenesProducto } from '@/lib/imagenes';
import { slugifyCategoria } from '@/lib/catalogo-categorias';

const CATALOGO_URL_KEY = 'catalogoListadoUrl';
const CATALOGO_SCROLL_KEY = 'catalogoListadoScroll';

export default function SlugClient({ categoria, categoriaPadre }) {
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const placeholderImage = '/logo/logo-partemaquinas-oficial.jpeg';

  const obtenerImagenPrincipal = producto => {
    const imagenes = getImagenesProducto(producto);
    return imagenes[0] || null;
  };

  useEffect(() => {
    let activa = true;
    const cargarProductos = async () => {
      setCargando(true);
      setErrorCarga(false);
      try {
        const respuesta = await fetch(`/api/productos?categoria=${encodeURIComponent(categoria)}&limit=1000`, { cache: 'no-store' });
        if (!respuesta.ok) throw new Error('No se pudieron cargar los productos.');
        const datos = await respuesta.json();
        if (activa) setProductos(Array.isArray(datos) ? datos : []);
      } catch {
        if (activa) setErrorCarga(true);
      } finally {
        if (activa) setCargando(false);
      }
    };
    cargarProductos();
    return () => { activa = false; };
  }, [categoria, intentoCarga]);

  // Restaurar posición de scroll al montar
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

  const guardarScroll = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CATALOGO_URL_KEY, window.location.pathname + window.location.search);
    sessionStorage.setItem(CATALOGO_SCROLL_KEY, String(window.scrollY));
  };

  const irADetalle = (e, productoId) => {
    guardarScroll();
    router.push(`/productos/${productoId}`);
  };

  return (
    <main className="catalog-page min-h-screen bg-slate-50 text-slate-900">
      {/* Encabezado con breadcrumb */}
      <div className="bg-white py-10 px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4 flex-wrap">
            <button
              onClick={() => router.push('/productos')}
              className="hover:text-orange-500 transition-colors"
            >
              Catalogo
            </button>
            {categoriaPadre && (
              <>
                <span className="text-slate-300">/</span>
                <button
                  onClick={() => router.push(`/productos/categorias/${slugifyCategoria(categoriaPadre)}`)}
                  className="hover:text-orange-500 transition-colors"
                >
                  {categoriaPadre}
                </button>
              </>
            )}
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">{categoria}</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => router.push('/productos')}
              className="btn-anim inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-4 py-2.5"
            >
              Volver al catalogo
            </button>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">{categoria}</h2>
              <p className="text-slate-500 mt-1">{productos.length} producto{productos.length !== 1 ? 's' : ''} encontrado{productos.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 py-10">
        {cargando ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-slate-500 shadow-sm">Cargando productos…</div>
        ) : errorCarga ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <svg className="mx-auto mb-4 h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3 2.8 20h18.4L12 3Z"/><path d="M12 9v5m0 3h.01"/></svg>
            <p className="mb-2 text-xl font-semibold text-slate-800">No pudimos cargar los productos</p>
            <p className="mb-6 text-slate-500">Intenta de nuevo en unos segundos.</p>
            <button type="button" onClick={() => setIntentoCarga(intento => intento + 1)} className="btn-anim rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">Reintentar</button>
          </div>
        ) : productos.length === 0 ? (
          <div className="py-20 text-center">
            <svg className="mx-auto mb-4 h-14 w-14 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m3 7 9-4 9 4v10l-9 4-9-4V7Z"/><path d="m3 7 9 4 9-4m-9 4v10"/></svg>
            <p className="text-xl text-slate-500 mb-6">No se encontraron productos en esta categoria.</p>
            <button
              onClick={() => router.push('/productos')}
              className="btn-anim inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
            >
              Ver todas las categorias
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {productos.map(producto => {
              const imagen = obtenerImagenPrincipal(producto);
              return (
                <div
                  key={producto.id}
                  onClick={(e) => irADetalle(e, producto.id)}
                  className="catalog-product-card bg-white rounded-2xl border border-slate-200 hover:border-orange-400 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg flex flex-col cursor-pointer hover:-translate-y-1"
                >
                  {imagen ? (
                    <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
                      <Image
                        src={imagen}
                        alt={producto.nombre}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain"
                        onError={e => { e.currentTarget.src = placeholderImage; }}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-slate-100 flex items-center justify-center text-5xl text-slate-300">
                      <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 18h32v20H8zM14 18l3-7h14l3 7M17 27h.01M24 27h.01M31 27h.01M14 38v3m20-3v3"/></svg>
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    {producto.marcas && (
                      <p className="mb-1.5 text-xs font-semibold text-orange-500 uppercase tracking-wider">
                        {producto.marcas}
                      </p>
                    )}
                    <h3 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2 leading-snug">
                      {producto.nombre}
                    </h3>
                    {producto.categorias && (
                      <p className="text-slate-400 text-xs mb-3 line-clamp-1">{producto.categorias}</p>
                    )}
                    <div className="mt-auto pt-3">
                      <a
                        href={'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa: ' + producto.nombre)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="btn-anim block w-full text-center bg-emerald-500 hover:bg-emerald-400 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
                      >
                        Consultar por WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
