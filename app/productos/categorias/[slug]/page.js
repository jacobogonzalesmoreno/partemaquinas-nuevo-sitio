'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { parseImagenesValue } from '@/lib/imagenes';
import {
  CATEGORIAS_MENU,
  productoCoincideCategoriaPorNombre,
  slugifyCategoria,
} from '@/lib/catalogo-categorias';

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

export default function ProductosPorCategoria() {
  const { slug } = useParams();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [volverHref, setVolverHref] = useState('/productos');
  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';

 useEffect(() => {
    if (!slug) return;
    fetch('/api/productos?limit=1000')
      .then(res => res.json())
      .then(data => {
        setProductos(Array.isArray(data) ? data : []);
        setCargando(false);
      });
  }, [slug]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedUrl = sessionStorage.getItem('catalogoUrl');
    if (savedUrl) {
      setVolverHref(savedUrl);
    }
  }, []);

  const categoriaLabel = useMemo(() => {
    if (!slug) return '';
    const encontrada = CATEGORIAS_MENU.find(categoria => slugifyCategoria(categoria) === slug);
    return encontrada || slug.replace(/-/g, ' ');
  }, [slug]);

  const productosFiltrados = useMemo(
    () => productos.filter(producto => productoCoincideCategoriaPorNombre(producto, categoriaLabel)),
    [productos, categoriaLabel]
  );

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xl page-fade-in">
        Cargando productos...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 page-fade-in">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="brand-grid p-6 sm:p-8 flex flex-col gap-5">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="brand-pill rise-in" style={{ animationDelay: '40ms' }}>Catalogo</span>
              <Link
                href={volverHref}
                className="btn-anim inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-900 rise-in"
                style={{ animationDelay: '80ms' }}
              >
                ← Volver al catalogo
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-slate-900 accent-underline rise-in" style={{ animationDelay: '120ms' }}>{categoriaLabel}</h1>
              <p className="text-slate-600 rise-in" style={{ animationDelay: '160ms' }}>{productosFiltrados.length} productos</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="benefit-card rise-in" style={{ animationDelay: '200ms' }}>
                <p className="text-sm font-semibold text-slate-900">Garantia local</p>
                <p className="text-xs text-slate-500">Respaldo directo en Medellin.</p>
              </div>
              <div className="benefit-card rise-in" style={{ animationDelay: '240ms' }}>
                <p className="text-sm font-semibold text-slate-900">Soporte experto</p>
                <p className="text-xs text-slate-500">Asesoria tecnica al elegir.</p>
              </div>
              <div className="benefit-card rise-in" style={{ animationDelay: '280ms' }}>
                <p className="text-sm font-semibold text-slate-900">Entrega rapida</p>
                <p className="text-xs text-slate-500">Coordina envios con tu asesor.</p>
              </div>
            </div>
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center text-slate-500 py-20 text-xl">No se encontraron productos</div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {productosFiltrados.map((producto, index) => {
              const imagen = obtenerImagenPrincipal(producto);
              const delay = 160 + index * 70;
              return (
                <div
                  key={producto.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-orange-400 transition-all overflow-hidden shadow-sm hover:shadow-md flex flex-col card-rise"
                  style={{ animationDelay: `${delay}ms` }}
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
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="brand-pill">Categoria</span>
                      <span className="text-xs font-semibold text-slate-600">{categoriaLabel}</span>
                    </div>
                    <h4 className="text-slate-900 font-semibold text-sm mb-1 line-clamp-2">{producto.nombre}</h4>
                    {producto.marcas && <p className="text-slate-500 text-xs mb-3">🏷️ {producto.marcas}</p>}
                    <div className="mt-auto flex flex-col gap-2">
                      <Link
                        href={'/productos/' + producto.id}
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
        )}
      </div>
      <style jsx global>{`
        .page-fade-in {
          animation: pageFade 520ms ease-out both;
        }

        .rise-in {
          animation: riseIn 520ms ease-out both;
        }

        .card-rise {
          animation: cardRise 640ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes pageFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardRise {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
