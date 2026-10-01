'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Script from 'next/script';
import { getImagenesProducto } from '@/lib/imagenes';
import ImagenProducto from '@/components/ImagenProducto';
import Modelo3DPreview from './Modelo3DPreview';

if (typeof window !== 'undefined') {
  window.ModelViewerElement = window.ModelViewerElement || {};
  window.ModelViewerElement.meshoptDecoderLocation = 'https://cdn.jsdelivr.net/npm/meshoptimizer/meshopt_decoder.js';
}

export default function DetalleClient({ producto, modelo3d = null }) {
  const router = useRouter();
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [mostrarModeloAmpliado, setMostrarModeloAmpliado] = useState(false);
  const [montado, setMontado] = useState(false);
  const [mostrarInfoModelo, setMostrarInfoModelo] = useState(false);
  const scrollAnterior = useRef(0);
  const estilosScrollPrevios = useRef(null);
  const placeholderImage = '/logo/logo-partemaquinas-oficial.jpeg';

  const imagenes = producto ? getImagenesProducto(producto) : [];
  const cantidadElementosLightbox = imagenes.length + (modelo3d ? 1 : 0);
  const lightboxMuestraModelo = Boolean(modelo3d) && lightboxIndex === imagenes.length;

  // Esperar a que el DOM esté listo para portales
  useEffect(() => { setMontado(true); }, []);

  const bloquearScrollFondo = useCallback(() => {
    if (estilosScrollPrevios.current) return;
    const body = document.body;
    const html = document.documentElement;
    scrollAnterior.current = window.scrollY;
    estilosScrollPrevios.current = {
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };
    html.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollAnterior.current}px`;
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }, []);

  const restaurarScrollFondo = useCallback(() => {
    const estilos = estilosScrollPrevios.current;
    if (!estilos) return;
    document.documentElement.style.overflow = estilos.htmlOverflow;
    document.body.style.position = estilos.bodyPosition;
    document.body.style.top = estilos.bodyTop;
    document.body.style.width = estilos.bodyWidth;
    document.body.style.overflow = estilos.bodyOverflow;
    estilosScrollPrevios.current = null;
    window.scrollTo(0, scrollAnterior.current);
  }, []);

  const abrirLightbox = useCallback((idx) => {
    bloquearScrollFondo();
    requestAnimationFrame(() => {
      setLightboxIndex(idx);
    });
  }, [bloquearScrollFondo]);

  const cerrarLightbox = useCallback(() => {
    // 1. Ocultar lightbox primero
    setLightboxIndex(-1);
    restaurarScrollFondo();
  }, [restaurarScrollFondo]);

  const abrirModeloAmpliado = useCallback(() => {
    bloquearScrollFondo();
    setMostrarModeloAmpliado(true);
  }, [bloquearScrollFondo]);

  const cerrarModeloAmpliado = useCallback(() => {
    setMostrarModeloAmpliado(false);
    restaurarScrollFondo();
  }, [restaurarScrollFondo]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && mostrarModeloAmpliado) cerrarModeloAmpliado();
    if (lightboxIndex < 0) return;
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowRight' && lightboxIndex < cantidadElementosLightbox - 1) setLightboxIndex(lightboxIndex + 1);
    if (e.key === 'ArrowLeft' && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
  }, [lightboxIndex, imagenes.length, cantidadElementosLightbox, cerrarLightbox, mostrarModeloAmpliado, cerrarModeloAmpliado]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => () => restaurarScrollFondo(), [restaurarScrollFondo]);

  if (!producto) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-12 w-12 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
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
        overscrollBehavior: 'none',
        touchAction: 'none',
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
          {lightboxMuestraModelo ? 'Modelo 3D' : `${lightboxIndex + 1} / ${imagenes.length}`}
        </div>
        <button
          onClick={cerrarLightbox}
          style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0, backgroundColor: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: 20, cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Area de imagen */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '0 16px 16px', minHeight: 0, overflow: 'hidden' }}>
        {/* Flecha anterior */}
        {lightboxIndex > 0 && (
          <button
            type="button"
            className="product-lightbox__arrow product-lightbox__arrow--previous"
            aria-label="Ver imagen anterior"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}

        {/* Imagen */}
        {lightboxMuestraModelo ? (
          <div style={{ position: 'relative', width: 'min(900px, 100%)', height: '100%', background: '#e9e4d7', borderRadius: 4 }}>
            <Modelo3DPreview
              src={`/modelos/${modelo3d.archivo}`}
              alt={`Modelo 3D ampliado del ${modelo3d.nombre}`}
              poster={imagenes[0]}
              showOpenButton={false}
              large
            />
          </div>
        ) : (
          <img
            key={lightboxIndex}
            className="product-lightbox__image"
            src={imagenes[lightboxIndex] || placeholderImage}
            alt={`Imagen ${lightboxIndex + 1} de ${producto.nombre}`}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8, display: 'block' }}
            onClick={e => e.stopPropagation()}
            onError={e => { e.currentTarget.src = placeholderImage; }}
            draggable={false}
          />
        )}

        {/* Flecha siguiente */}
        {lightboxIndex < cantidadElementosLightbox - 1 && (
          <button
            type="button"
            className="product-lightbox__arrow product-lightbox__arrow--next"
            aria-label="Ver imagen siguiente"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        )}
      </div>
    </div>
  ) : null;

  const modeloAmpliadoContent = mostrarModeloAmpliado ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Modelo 3D ampliado del ${modelo3d?.nombre || 'motor'}`}
      onClick={cerrarModeloAmpliado}
      style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,.86)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 4vw, 40px)', overscrollBehavior: 'none', touchAction: 'none' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 'min(900px, 100%)', height: 'min(80dvh, 720px)', background: '#e9e4d7', border: '1px solid #ddc98e', overscrollBehavior: 'none', touchAction: 'none' }}>
        <button type="button" onClick={cerrarModeloAmpliado} aria-label="Cerrar modelo 3D" style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, width: 40, height: 40, border: '1px solid #d3bd7a', background: 'rgba(255,255,255,.92)', color: '#171719', fontSize: 24, cursor: 'pointer' }}>×</button>
        <Modelo3DPreview
          src={`/modelos/${modelo3d.archivo}`}
          alt={`Modelo 3D ampliado del ${modelo3d.nombre}`}
          poster={imagenes[0]}
          showOpenButton={false}
          large
        />
      </div>
    </div>
  ) : null;

  return (
    <main className="catalog-page product-detail-page min-h-screen bg-slate-50 text-slate-900">
      {modelo3d && <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.3.1/model-viewer.min.js" strategy="afterInteractive" />}
      {/* LIGHTBOX via Portal - se monta directamente en <body>, fuera de cualquier contenedor con overflow */}
      {montado && (lightboxContent || modeloAmpliadoContent) && createPortal(<>{lightboxContent}{modeloAmpliadoContent}</>, document.body)}

      {/* ===== ENCABEZADO ===== */}
      <div className="bg-white py-6 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()}
            className="product-detail__back btn-anim inline-flex items-center gap-2 border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-4 py-2.5 transition-colors shrink-0">
            ← Volver
          </button>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Detalle de producto</p>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 truncate">{producto.nombre}</h2>
          </div>
        </div>
      </div>

      {/* ===== CONTENIDO ===== */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          {/* Columna de imágenes */}
          <div className="flex flex-col gap-4">
            <div
              className="product-detail__gallery relative aspect-[4/3] bg-white border border-slate-200 overflow-hidden cursor-zoom-in hover:border-orange-300 transition-colors"
              onClick={() => imagenes.length > 0 && abrirLightbox(0)}
            >
              {imagenes[0] ? (
                <ImagenProducto src={imagenes[0]} alt={producto.nombre} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain bg-slate-50 p-4" priority />
              ) : (
                <div className="w-full aspect-square bg-slate-50 flex items-center justify-center text-slate-300"><svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 18h32v20H8zM14 18l3-7h14l3 7M17 27h.01M24 27h.01M31 27h.01M14 38v3m20-3v3"/></svg></div>
              )}
            </div>
            {(imagenes.length > 1 || modelo3d) && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                {imagenes.map((img, i) => (
                  <div key={i}
                    className="product-detail__thumbnail relative aspect-square bg-white border border-slate-200 overflow-hidden cursor-zoom-in hover:border-orange-400 transition-all hover:shadow-md"
                    onClick={() => abrirLightbox(i)}>
                    <ImagenProducto src={img} alt={`${producto.nombre}, foto ${i + 1}`} fill sizes="(min-width: 640px) 12vw, 33vw" className="object-contain bg-slate-50 p-2" />
                  </div>
                ))}
                {modelo3d && (
                  <section key="modelo3d" className="product-detail__model3d" aria-label={`Modelo 3D del ${modelo3d.nombre}`} onClick={abrirModeloAmpliado}>
                    <button
                      type="button"
                      className="product-detail__model3d-poster"
                      aria-label={`Abrir el modelo 3D del ${modelo3d.nombre}`}
                      onClick={event => { event.stopPropagation(); abrirModeloAmpliado(); }}
                    >
                      {imagenes[0] && <ImagenProducto src={imagenes[0]} alt="" fill sizes="(min-width: 640px) 12vw, 33vw" className="object-contain bg-[#e9e4d7] p-2" />}
                      <span>Ver modelo 3D</span>
                    </button>
                    <button
                      type="button"
                      className="product-detail__model3d-info-button"
                      aria-label="Información y licencia del modelo 3D"
                      aria-expanded={mostrarInfoModelo}
                      aria-controls="product-model3d-info"
                      onClick={event => { event.stopPropagation(); setMostrarInfoModelo(value => !value); }}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></svg>
                    </button>
                    {mostrarInfoModelo && (
                      <div className="product-detail__model3d-info" id="product-model3d-info" onClick={event => event.stopPropagation()}>
                        Modelo ilustrativo generado con Meshy AI; no es un escaneo técnico. <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Licencia CC BY 4.0</a>.
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}
            {imagenes.length > 8 && (
              <p className="text-center text-sm text-slate-400">Haz clic en cualquier imagen para ampliarla ({imagenes.length} en total)</p>
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
                className="product-detail__whatsapp btn-anim flex items-center justify-center gap-2 w-full font-semibold py-4 transition-colors text-lg">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Consultar por WhatsApp
              </a>
              <button onClick={() => router.back()}
                className="product-detail__back btn-anim block w-full text-center border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold py-3 transition-colors">
                Volver al listado
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
