'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getImagenesProducto } from '@/lib/imagenes';

const CATEGORIA_URL_KEY = 'catalogoCategoriaUrl';
const PLACEHOLDER_IMG = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';

export default function DetalleProducto() {
  const { id } = useParams();
  const router = useRouter();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [erroresImagen, setErroresImagen] = useState({});
  const carruselRef = useRef(null);
  const [volverHref] = useState(() => {
    if (typeof window === 'undefined') {
      return '/productos';
    }
    return sessionStorage.getItem(CATEGORIA_URL_KEY) || '/productos';
  });

  useEffect(() => {
    if (!id) return;
    fetch('/api/productos/' + id)
      .then(res => res.json())
      .then(data => {
        setProducto(data);
        setCargando(false);
      });
  }, [id]);

  // Sincroniza el indice activo cuando el usuario hace scroll/swipe en el carrusel movil
  const onScrollCarrusel = () => {
    const el = carruselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setImagenActiva(prev => (prev === index ? prev : index));
  };

  const irAImagen = index => {
    setImagenActiva(index);
    const el = carruselRef.current;
    if (el) {
      el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
    }
  };

  if (cargando) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-xl">Cargando producto...</div>
  );

  if (!producto || producto.error) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-slate-500 text-xl">Producto no encontrado</div>
  );

  const imagenes = getImagenesProducto(producto);
  const whatsappUrl = 'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa: ' + producto.nombre);
  const descripcionCorta = producto.descripcion_corta || '';
  const descripcionCortaTexto = descripcionCorta.replace(/\\n/g, '\n');
  const volverAtras = event => {
    event.preventDefault();
    router.push(volverHref);
  };

  const marcarError = index => {
    setErroresImagen(prev => (prev[index] ? prev : { ...prev, [index]: true }));
  };

  const srcDe = index => (erroresImagen[index] ? PLACEHOLDER_IMG : imagenes[index]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">

        <Link
          href={volverHref}
          onClick={volverAtras}
          className="btn-anim inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:text-slate-900 mb-8"
        >
          Atras
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">

          {/* GALERIA */}
          <div className="flex flex-col gap-3">

            {/* Carrusel movil: swipe horizontal con scroll-snap */}
            <div className="md:hidden">
              {imagenes.length > 0 ? (
                <div
                  ref={carruselRef}
                  onScroll={onScrollCarrusel}
                  className="flex w-full overflow-x-auto snap-x snap-mandatory rounded-xl border border-gray-200 bg-gray-100"
                  style={{ scrollbarWidth: 'none' }}
                >
                  {imagenes.map((_, index) => (
                    <div
                      key={index}
                      className="snap-center shrink-0 w-full h-80 flex items-center justify-center"
                    >
                      <img
                        src={srcDe(index)}
                        alt={producto.nombre + ' imagen ' + (index + 1)}
                        className="w-full h-full object-contain"
                        onError={() => marcarError(index)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full h-80 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-7xl">
                  <img src={PLACEHOLDER_IMG} alt={producto.nombre} className="w-24 h-24 object-contain opacity-60" />
                </div>
              )}

              {imagenes.length > 1 && (
                <div className="flex justify-center gap-2 mt-3">
                  {imagenes.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => irAImagen(index)}
                      aria-label={'Ir a imagen ' + (index + 1)}
                      className={`h-2.5 rounded-full transition-all ${imagenActiva === index ? 'w-6 bg-yellow-400' : 'w-2.5 bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Galeria desktop: imagen grande + thumbnails (igual que antes) */}
            <div className="hidden md:flex md:flex-col gap-3">
              <div className="w-full h-80 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {imagenes.length > 0 ? (
                  <img
                    src={srcDe(imagenActiva)}
                    alt={producto.nombre}
                    className="w-full h-full object-contain bg-gray-100"
                    onError={() => marcarError(imagenActiva)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <img src={PLACEHOLDER_IMG} alt={producto.nombre} className="w-24 h-24 object-contain opacity-60" />
                  </div>
                )}
              </div>

              {imagenes.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {imagenes.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setImagenActiva(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${imagenActiva === index ? 'border-yellow-400' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      <img
                        src={srcDe(index)}
                        alt={'imagen ' + (index + 1)}
                        className="w-full h-full object-contain bg-gray-100"
                        onError={() => marcarError(index)}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* INFO */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold text-slate-900">{producto.nombre}</h1>
            {producto.categorias && <p className="text-orange-500 text-sm">Categoria: {producto.categorias}</p>}
            {producto.marcas && <p className="text-slate-500 text-sm">Marca: {producto.marcas}</p>}
            {producto.sku && <p className="text-slate-500 text-sm">SKU: {producto.sku}</p>}
            {descripcionCorta && (
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">{descripcionCortaTexto}</p>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block text-center bg-green-600 hover:bg-green-500 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              Consultar por WhatsApp
            </a>
          </div>

        </div>

        {producto.descripcion && (
          <div className="mt-12 bg-slate-50 rounded-xl border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Descripcion del producto</h2>
            <div className="text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: producto.descripcion }} />
          </div>
        )}

      </div>
    </main>
  );
}