'use client';

import { useEffect, useRef, useState } from 'react';

const DURACION_VUELTA_MS = 15000;

export default function Modelo3DPreview({ src, alt, poster, onOpen, showOpenButton = true, large = false }) {
  const viewerRef = useRef(null);
  const [mostrarIndicacion, setMostrarIndicacion] = useState(false);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let timer;
    let iniciada = false;
    const iniciarVuelta = () => {
      if (iniciada) return;
      iniciada = true;
      setMostrarIndicacion(true);
      if (reduceMotion) return;
      viewer.setAttribute('rotation-per-second', '24deg');
      viewer.setAttribute('auto-rotate-delay', '0');
      viewer.setAttribute('auto-rotate', '');
      timer = window.setTimeout(() => {
        viewer.removeAttribute('auto-rotate');
      }, DURACION_VUELTA_MS);
    };
    const detenerPorInteraccion = event => {
      if (event.detail?.source !== 'user-interaction') return;
      viewer.removeAttribute('auto-rotate');
      window.clearTimeout(timer);
    };

    viewer.addEventListener('load', iniciarVuelta);
    viewer.addEventListener('camera-change', detenerPorInteraccion);
    if (viewer.loaded) iniciarVuelta();

    return () => {
      viewer.removeEventListener('load', iniciarVuelta);
      viewer.removeEventListener('camera-change', detenerPorInteraccion);
      window.clearTimeout(timer);
      viewer.removeAttribute('auto-rotate');
    };
  }, [src]);

  return (
    <>
      <model-viewer
        ref={viewerRef}
        className="product-detail__model3d-viewer"
        src={src}
        poster={poster || undefined}
        alt={alt}
        reveal="auto"
        camera-controls
        disable-pan
        touch-action="none"
        interaction-prompt="none"
        loading={large ? 'eager' : 'lazy'}
        shadow-intensity="1"
        exposure="1"
        ar={false}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
      />
      {showOpenButton && (
        <button
          type="button"
          className="product-detail__model3d-open-button"
          aria-label="Abrir el modelo 3D ampliado"
          onClick={event => { event.stopPropagation(); onOpen(); }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></svg>
        </button>
      )}
      {mostrarIndicacion && (
        <span className={`product-detail__model3d-hint${large ? ' product-detail__model3d-hint--large' : ''}`} aria-hidden="true">
          <svg className="product-detail__model3d-hint-touch" viewBox="0 0 32 32" aria-hidden="true"><path d="M12.5 14.3V7.1a2.5 2.5 0 0 1 5 0v6.3-2a2.4 2.4 0 0 1 4.8 0v2.3-1a2.3 2.3 0 0 1 4.6 0v6.7c0 5.1-3.7 8.6-8.5 8.6h-1.1a8.3 8.3 0 0 1-6-2.6l-4.1-4.5a2.4 2.4 0 0 1 3.5-3.3l1.8 1.8v-4.1a2.5 2.5 0 0 1 0-5Z"/><path className="product-detail__model3d-hint-touch-line" d="M15 8v9m5-5v5m5-4v4"/></svg>
          <svg className="product-detail__model3d-hint-mouse" viewBox="0 0 32 32" aria-hidden="true"><path d="M6 3.5v23l6.4-6.1 5.1 8.1 4.1-2.5-5.1-8.1 8.8-.5L6 3.5Z"/></svg>
          <span className="product-detail__model3d-hint-mobile-text">Arrastra para girar</span>
          <span className="product-detail__model3d-hint-desktop-text">Arrastra con el clic para girar</span>
        </span>
      )}
    </>
  );
}
