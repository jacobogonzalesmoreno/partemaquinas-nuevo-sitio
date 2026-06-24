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

const CATALOGO_URL_KEY = 'catalogoListadoUrl';
const CATEGORIA_URL_KEY = 'catalogoCategoriaUrl';
const CATEGORIA_SCROLL_KEY = 'catalogoCategoriaScroll';

const obtenerImagenPrincipal = producto => {
  if (!producto) return null;
  const candidatos = [
    producto.imagenes, producto.imagen, producto.imagen_principal,
    producto.imagen_principal_url, producto.image, producto.img, producto.foto,
  ];
  for (const valor of candidatos) {
    const imagen = parseImagenesValue(valor)[0];
    if (imagen) return imagen;
  }
  return null;
};

function TarjetaProducto({ producto, categoriaLabel, placeholderImage, onNavigate }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [imgCargada, setImgCargada] = useState(false);
  const imagen = obtenerImagenPrincipal(producto);

  useEffect(() => {
    if (imagen) setImgSrc(imagen);
  }, [imagen]);

  const whatsappUrl = 'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa: ' + producto.nombre);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-orange-400 transition-all overflow-hidden shadow-sm hover:shadow-md flex flex-col">
      <div className="w-full h-48 bg-slate-100 overflow-hidden relative">
        {!imgCargada && (
          <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        )}
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={producto.nombre}
            loading="lazy"
            className={'w-full h-full object-contain transition-opacity duration-300 ' + (imgCargada ? 'opacity-100' : 'opacity-0')}
            onLoad={() => setImgCargada(true)}
            onError={() => { setImgSrc(placeholderImage); setImgCargada(true); }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl text-slate-400">⚙️</div>
        )}
      </div>
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
            onClick={onNavigate}
            className="btn-anim block w-full text-center bg-slate-900 hover:bg-slate-800 text-white text-sm py-2 rounded-lg transition-colors"
          >
            Ver detalle
          </Link>
          <a
            href={whatsappUrl}
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
}

export default function ProductosPorCategoria() {
  const { slug } = useParams();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 24;

  const [volverHref] = useState(() => {
    if (typeof window === 'undefined') return '/productos';
    return sessionStorage.getItem(CATALOGO_URL_KEY) || '/productos';
  });

  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';

  const guardarScrollCategoria = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(CATEGORIA_URL_KEY, window.location.pathname + window.location.search);
    sessionStorage.setItem(CATEGORIA_SCROLL_KEY, String(window.scrollY));
  };

  useEffect(() => {
    if (!slug) return;
    setCargando(true);
    fetch('/api/productos?limit=1000')
      .then(res => res.json())
      .then(data => {
        setProductos(Array.isArray(data) ? data : []);
        setCargando(false);
      });
  }, [slug]);

  const categoriaLabel = useMemo(() => {
    if (!slug) return '';
    const encontrada = CATEGORIAS_MENU.find(c => slugifyCategoria(c) === slug);
    return encontrada || slug.replace(/-/g, ' ');
  }, [slug]);

  const productosFiltrados = useMemo(
    () => productos.filter(p => productoCoincideCategoriaPorNombre(p, categoriaLabel)),
    [productos, categoriaLabel]
  );

  const totalPaginas = Math.ceil(productosFiltrados.length / POR_PAGINA);
  const productosPagina = productosFiltrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-xl">
        Cargando productos...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="brand-grid p-6 sm:p-8 flex flex-col gap-5 mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="brand-pill">Catalogo</span>
            <Link
              href={volverHref}
              className="btn-anim inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-900"
            >
              ← Volver al catalogo
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 accent-underline">{categoriaLabel}</h1>
            <p className="text-slate-600 mt-1">{productosFiltrados.length} productos</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="benefit-card">
              <p className="text-sm font-semibold text-slate-900">Garantia local</p>
              <p className="text-xs text-slate-500">Respaldo directo en Medellin.</p>
            </div>
            <div className="benefit-card">
              <p className="text-sm font-semibold text-slate-900">Soporte experto</p>
              <p className="text-xs text-slate-500">Asesoria tecnica al elegir.</p>
            </div>
            <div className="benefit-card">
              <p className="text-sm font-semibold text-slate-900">Entrega rapida</p>
              <p className="text-xs text-slate-500">Coordina envios con tu asesor.</p>
            </div>
          </div>
        </div>

        {productosFiltrados.length === 0 ? (
          <div className="text-center text-slate-500 py-20 text-xl">No se encontraron productos</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {productosPagina.map(producto => (
                <TarjetaProducto
                  key={producto.id}
                  producto={producto}
                  categoriaLabel={categoriaLabel}
                  placeholderImage={placeholderImage}
                  onNavigate={guardarScrollCategoria}
                />
              ))}
            </div>

            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => { setPagina(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={pagina === 1}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:border-slate-400"
                >
                  ← Anterior
                </button>
                <span className="text-sm text-slate-600">Página {pagina} de {totalPaginas}</span>
                <button
                  onClick={() => { setPagina(p => Math.min(totalPaginas, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={pagina === totalPaginas}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:border-slate-400"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}