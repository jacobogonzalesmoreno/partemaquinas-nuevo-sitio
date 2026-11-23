'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2;
const pointerDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default function BlogImageZoom({ src, alt = '', className = '' }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const drag = useRef(null);
  const stage = useRef(null);

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
  const onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: pointerDistance(a, b), zoom };
      drag.current = null;
    } else if (zoom > 1) {
      drag.current = { x: event.clientX, y: event.clientY, left: stage.current?.scrollLeft || 0, top: stage.current?.scrollTop || 0 };
    }
  };
  const onPointerMove = event => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const ratio = pointerDistance(a, b) / Math.max(pinch.current.distance, 1);
      setZoom(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((pinch.current.zoom * ratio).toFixed(2)))));
    } else if (drag.current && stage.current) {
      stage.current.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
      stage.current.scrollTop = drag.current.top - (event.clientY - drag.current.y);
    }
  };
  const onPointerUp = event => {
    pointers.current.delete(event.pointerId);
    drag.current = null;
    if (pointers.current.size < 2) pinch.current = null;
  };

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
      <div className="blog-image-lightbox" role="dialog" aria-modal="true" aria-label={alt || 'Imagen ampliada'} onClick={event => { if (event.target === event.currentTarget) close(); }}>
        <div className="blog-image-lightbox__toolbar">
          <span className="blog-image-lightbox__caption">{alt || 'Imagen de referencia'}</span>
          <div className="blog-image-lightbox__controls" aria-label="Controles de zoom">
            <button type="button" onClick={() => changeZoom(-0.1)} disabled={zoom <= MIN_ZOOM} aria-label="Alejar">−</button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => changeZoom(0.1)} disabled={zoom >= MAX_ZOOM} aria-label="Acercar">+</button>
            <button type="button" onClick={() => setZoom(1)} aria-label="Restablecer zoom">Restablecer</button>
          </div>
          <button type="button" className="blog-image-lightbox__close" onClick={close} aria-label="Cerrar imagen ampliada">×</button>
        </div>
        <div ref={stage} className="blog-image-lightbox__stage" onWheel={event => { if (!event.ctrlKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.05 : -0.05); }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <div className="blog-image-lightbox__canvas" style={{ width: `${Math.max(100, zoom * 100)}%`, height: `${Math.max(100, zoom * 100)}%` }}>
            <img src={src} alt={alt} draggable="false" />
          </div>
        </div>
        <p className="blog-image-lightbox__help">Usa + / − o pellizca con dos dedos para hacer zoom. Arrastra la imagen ampliada para recorrerla; pulsa fuera o Esc para cerrar.</p>
      </div>,
      document.body,
    )}
  </>;
}
