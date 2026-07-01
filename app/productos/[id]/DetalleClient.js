'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { getImagenesProducto } from '@/lib/imagenes';

export default function DetalleClient({ producto }) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [montado, setMontado] = useState(false);
  const scrollAnterior = useRef(0);
  const placeholderImage = '/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png';

  const imagenes = producto ? getImagenesProducto(producto) : [];

  // Esperar a que el DOM esté listo para portales
  useEffect(() => { setMontado(true); }, []);

  const abrirLightbox = useCallback((idx) => {
    // 1. Guardar scroll actual
    scrollAnterior.current = window.scrollY;
    // 2. Scroll instantáneo al tope SIN animación
    window.scrollTo(0, 0);
    // 3. Bloquear scroll del body
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    // 4. Mostrar lightbox en el siguiente frame (después del scroll)
    requestAnimationFrame(() => {
      setLightboxIndex(idx);
    });
  }, []);

  const cerrarLightbox = useCallback(() => {
    // 1. Ocultar lightbox primero
    setLightboxIndex(-1);
    // 2. Restaurar scroll del body
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    // 3. Volver a la posición original
    window.scrollTo(0, scrollAnterior.current);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (lightboxIndex < 0) return;
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowRight' && lightboxIndex < imagenes.length - 1) setLightboxIndex(lightboxIndex + 1);
    if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  }, [lightboxIndex, imagenes.length, cerrarLightbox]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Limpieza por si el componente se desmonta con el lightbox abierto
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!producto) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-2xl text-slate-500 mb-6">Producto no encontrado</p>
          <button onClick={() => router.back()} className="btn-anim px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-semibold transition-colors">Volver</button>
        </div>
      </main>
    );
  }

  const whatsappUrl = 'https://api.whatsapp.com/send?phone=573163293151&text=' +
    encodeURIComponent('Hola, me interesa: ' + producto.nombre + (producto.sku ? ' (Ref: ' + producto.sku + ')' : ''));

  // Contenido del lightbox (se renderiza via portal para estar SIEMPRE al nivel de <body>)
  const lightboxContent = lightboxIndex >= 0 ? (
    <div
      onClick={cerrarLightbox}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        border: 'none',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0, position: 'relative', zIndex: 10 }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
          {lightboxIndex + 1} / {imagenes.length}
        </div>
        <button
          onClick={cerrarLightbox}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Area de imagen */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px 16px', minHeight: 0, overflow: 'hidden' }}>
        {/* Flecha anterior */}
        {lightboxIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', fontSize: 30, cursor: 'pointer',
            }}
          >
            ‹
          </button>
        )}

        {/* Imagen */}
        <img
          src={imagenes[lightboxIndex] || placeholderImage}
          alt={`Imagen ${lightboxIndex + 1} de ${producto.nombre}`}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }}
          onClick={e => e.stopPropagation()}
          onError={e => { e.currentTarget.src = placeholderImage; }}
          draggable={false}
        />

        {/* Flecha siguiente */}
        {lightboxIndex < imagenes.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
              width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
              color: 'white', fontSize: 30, cursor: 'pointer',
            }}
          >
            ›
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* LIGHTBOX via Portal - se monta directamente en <body>, fuera de cualquier contenedor con overflow */}
      {montado && lightboxContent && createPortal(lightboxContent, document.body)}

      {/* ===== ENCABEZADO ===== */}
      <div className="bg-white py-6 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()}
            className="btn-anim inline-flex items-center gap-2 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-4 py-2.5 transition-colors shrink-0">
            ← Volver
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Detalle de producto</p>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">{producto.nombre}</h2>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Columna de imágenes */}
          <div className="flex flex-col gap-4">
            <div
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-zoom-in hover:border-orange-300 transition-colors"
              onClick={() => imagenes.length > 0 && abrirLightbox(0)}
            >
              {imagenes[0] ? (
                <img src={imagenes[0]} alt={producto.nombre} className="w-full aspect-square object-contain bg-slate-50 p-4" onError={e => { e.currentTarget.src = placeholderImage; }} />
              ) : (
                <div className="w-full aspect-square bg-slate-50 flex items-center justify-center text-7xl text-slate-200">⚙️</div>
              )}
            </div>
            {imagenes.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imagenes.slice(0, 8).map((img, i) => (
                  <div key={i}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden cursor-zoom-in hover:border-orange-400 transition-all hover:shadow-md"
                    onClick={() => abrirLightbox(i)}>
                    <img src={img} alt={`Miniatura ${i + 1}`} className="w-full aspect-square object-contain bg-slate-50 p-2" onError={e => { e.currentTarget.src = placeholderImage; }} />
                  </div>
                ))}
              </div>
            )}
            {imagenes.length > 8 && (
              <p className="text-center text-sm text-slate-400">Haz clic en cualquier imagen para ver todas ({imagenes.length} en total)</p>
            )}
          </div>

          {/* Columna de información */}
          <div className="flex flex-col gap-5">
            {producto.marcas && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Marca</p>
                <p className="text-xl font-bold text-slate-900">{producto.marcas}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Producto</p>
              <p className="text-xl font-bold text-slate-900 leading-snug">{producto.nombre}</p>
            </div>
            {producto.sku && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">SKU / Referencia</p>
                <p className="text-lg text-slate-700 font-mono">{producto.sku}</p>
              </div>
            )}
            {producto.categorias && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Categorias</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {producto.categorias.split(/[,;|]/).map((cat, i) => (
                    <span key={i} className="inline-block bg-orange-50 text-orange-700 text-xs font-medium px-3 py-1 rounded-full border border-orange-200">{cat.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            {producto.descripcion_corta && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Descripcion</p>
                <p className="text-slate-600 leading-relaxed">{producto.descripcion_corta}</p>
              </div>
            )}
            {producto.etiquetas && (
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">Etiquetas</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {producto.etiquetas.split(/[,;|]/).map((tag, i) => (
                    <span key={i} className="inline-block bg-slate-100 text-slate-600 text-xs px-2.5 py-0.5 rounded-md">{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-auto pt-6 flex flex-col gap-3">
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className="btn-anim flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 rounded-xl transition-colors text-lg shadow-lg shadow-emerald-500/20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Consultar por WhatsApp
              </a>
              <button onClick={() => router.back()}
                className="btn-anim block w-full text-center border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold py-3 rounded-xl transition-colors">
                Volver al listado
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}