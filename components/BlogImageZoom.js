'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const VIEWPORT_SCALE = 0.5;

export default function BlogImageZoom({ src, alt = '', className = '' }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const close = useCallback(() => {
    setOpen(false);
    setZoom(1);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = event => {
      if (event.key === 'Escape') close();
      if (event.key === '+' || event.key === '=') setZoom(current => Math.min(MAX_ZOOM, current + 0.25));
      if (event.key === '-') setZoom(current => Math.max(MIN_ZOOM, current - 0.25));
      if (event.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  const changeZoom = amount => setZoom(current => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((current + amount).toFixed(2)))));

  return <>
    <button
      type="button"
      className={`blog-image-zoom-trigger ${className}`.trim()}
      onClick={() => { setZoom(1); setOpen(true); }}
      aria-label={`Ampliar imagen${alt ? `: ${alt}` : ''}`}
      title="Haz clic para ampliar"
    >
      <img src={src} alt={alt} loading="lazy" />
      <span className="blog-image-zoom-hint" aria-hidden="true">⌕</span>
    </button>
    {open && createPortal(
      <div className="blog-image-lightbox" role="dialog" aria-modal="true" aria-label={alt || 'Imagen ampliada'} onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
        <div className="blog-image-lightbox__toolbar">
          <span className="blog-image-lightbox__caption">{alt || 'Imagen de referencia'}</span>
          <div className="blog-image-lightbox__controls" aria-label="Controles de zoom">
            <button type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= MIN_ZOOM} aria-label="Alejar">−</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= MAX_ZOOM} aria-label="Acercar">+</button>
            <button type="button" onClick={() => setZoom(1)} aria-label="Restablecer zoom">Restablecer</button>
          </div>
          <button type="button" className="blog-image-lightbox__close" onClick={close} aria-label="Cerrar imagen ampliada">×</button>
        </div>
        <div className="blog-image-lightbox__stage" onWheel={event => { event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.15 : -0.15); }}>
          <div className="blog-image-lightbox__canvas" style={{ width: `${zoom * VIEWPORT_SCALE * 100}%`, height: `${zoom * VIEWPORT_SCALE * 100}%` }}>
            <img src={src} alt={alt} draggable="false" />
          </div>
        </div>
        <p className="blog-image-lightbox__help">Usa + / − o la rueda del ratón para hacer zoom. Presiona 0 para restablecer y Esc para cerrar.</p>
      </div>,
      document.body,
    )}
  </>;
}
