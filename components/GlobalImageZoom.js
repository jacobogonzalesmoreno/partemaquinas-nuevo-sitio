'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const MIN_ZOOM = 0.8;
const MAX_ZOOM = 2;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default function GlobalImageZoom() {
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const pointers = useRef(new Map());
  const pinch = useRef(null);
  const drag = useRef(null);
  const stage = useRef(null);

  const close = useCallback(() => {
    setImage(null);
    setZoom(1);
    pointers.current.clear();
    pinch.current = null;
  }, []);

  const adjust = useCallback(amount => setZoom(value => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((value + amount).toFixed(2))))), []);

  useEffect(() => {
    const onClick = event => {
      const img = event.target?.closest?.('img');
      if (!img || !img.currentSrc && !img.src) return;
      if (img.closest('.blog-image-zoom-trigger,.product-detail__gallery,.product-detail__thumbnail,.product-lightbox,.global-image-lightbox,[data-image-zoom-ignore],.word-editable')) return;
      if (img.closest('nav,header') && /logo|icon/i.test(`${img.alt} ${img.src}`)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      setZoom(1);
      setImage({ src: img.currentSrc || img.src, alt: img.alt || img.title || 'Imagen ampliada' });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  useEffect(() => {
    if (!image) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = event => {
      if (event.key === 'Escape') close();
      if (event.key === '+' || event.key === '=') adjust(0.25);
      if (event.key === '-') adjust(-0.25);
      if (event.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [image, close, adjust]);

  const onPointerDown = event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: distance(a, b), zoom };
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
      const ratio = distance(a, b) / Math.max(pinch.current.distance, 1);
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

  if (!image || typeof document === 'undefined') return null;
  return createPortal(
    <div className="global-image-lightbox" role="dialog" aria-modal="true" aria-label={image.alt} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="global-image-lightbox__toolbar">
        <span title={image.alt}>{image.alt}</span>
        <div className="global-image-lightbox__controls">
          <button type="button" onClick={() => adjust(-0.1)} disabled={zoom <= MIN_ZOOM} aria-label="Alejar">−</button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" onClick={() => adjust(0.1)} disabled={zoom >= MAX_ZOOM} aria-label="Acercar">+</button>
          <button type="button" onClick={() => setZoom(1)}>Restablecer</button>
        </div>
        <button type="button" className="global-image-lightbox__close" onClick={close} aria-label="Cerrar imagen ampliada">×</button>
      </div>
      <div ref={stage} className="global-image-lightbox__stage" onWheel={event => { if (!event.ctrlKey) return; event.preventDefault(); adjust(event.deltaY < 0 ? 0.05 : -0.05); }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="global-image-lightbox__canvas" style={{ width: `${Math.max(100, zoom * 100)}%`, height: `${Math.max(100, zoom * 100)}%` }}>
          <img src={image.src} alt={image.alt} draggable="false" />
        </div>
      </div>
      <p>Usa los controles o pellizca con dos dedos en el trackpad o la pantalla. Arrastra la imagen ampliada para recorrerla.</p>
    </div>,
    document.body,
  );
}
