'use client';

import { useEffect, useRef, useState } from 'react';

const DURACION_VUELTA_MS = 15000;

export default function Modelo3DPreview({ src, alt, onOpen, showOpenButton = true, large = false }) {
  const viewerRef = useRef(null);
  const [mostrarIndicacion, setMostrarIndicacion] = useState(false);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    let timer;
    let iniciada = false;
    const iniciarVuelta = () => {
      if (iniciada) return;
      iniciada = true;
      setMostrarIndicacion(true);
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
        alt={alt}
        camera-controls
        touch-action="pan-y"
        interaction-prompt="none"
        loading="lazy"
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 12V6a2 2 0 0 1 4 0v5-6a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v8a7 7 0 0 1-7 7h-1a7 7 0 0 1-5-2l-3-3a2 2 0 0 1 3-3l2 2"/></svg>
          <span>Arrastra para girar</span>
        </span>
      )}
    </>
  );
}
