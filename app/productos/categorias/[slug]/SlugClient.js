'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getImagenesProducto } from '@/lib/imagenes';
import { slugifyCategoria } from '@/lib/catalogo-categorias';

const CATALOGO_URL_KEY = 'catalogoListadoUrl';
const CATALOGO_SCROLL_KEY = 'catalogoListadoScroll';

export default function SlugClient({ productos, categoria, categoriaPadre, slug }) {
  const router = useRouter();
  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';

  const obtenerImagenPrincipal = producto => {
    const imagenes = getImagenesProducto(producto);
    return imagenes[0] || null;
  };

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
    <main className="min-h-screen bg-slate-50 text-slate-900">
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
      <div className="max-w-6xl mx-auto px-6 py-10">
        {productos.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-6xl mb-4 text-slate-300">📦</div>
            <p className="text-xl text-slate-500 mb-6">No se encontraron productos en esta categoria.</p>
            <button
              onClick={() => router.push('/productos')}
              className="btn-anim inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
            >
              Ver todas las categorias
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {productos.map(producto => {
              const imagen = obtenerImagenPrincipal(producto);
              return (
                <div
                  key={producto.id}
                  onClick={(e) => irADetalle(e, producto.id)}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-orange-400 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg flex flex-col cursor-pointer hover:-translate-y-1"
                >
                  {imagen ? (
                    <div className="w-full h-48 bg-slate-100 overflow-hidden">
                      <img
                        src={imagen}
                        alt={producto.nombre}
                        className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        onError={e => { e.currentTarget.src = placeholderImage; }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-5xl text-slate-300">
                      ⚙️
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