'use client';
import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

function parseImagenes(imagenes) {
  if (!imagenes) return [];
  if (Array.isArray(imagenes)) return imagenes.filter(Boolean);
  return imagenes.split(/[,]+/).map(s => s.trim()).filter(Boolean);
}

function formatearPrecio(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const num = Number(valor);
  if (!Number.isFinite(num)) return null;
  return num.toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function estadoBadge(estado) {
  const map = {
    disponible: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    vendido: 'bg-red-100 text-red-700 border-red-200',
    reservado: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  return map[estado] || 'bg-slate-100 text-slate-600 border-slate-200';
}

function badgeInline(estado) {
  const map = {
    disponible: { background: '#d1fae5', color: '#047857', borderColor: '#a7f3d0' },
    vendido: { background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' },
    reservado: { background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' },
  };
  return map[estado] || { background: '#f1f5f9', color: '#475569', borderColor: '#e2e8f0' };
}

function ModalProducto({ producto, onClose }) {
  const [imagenIndex, setImagenIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const imagenes = parseImagenes(producto.imagenes);

  const siguiente = useCallback(() => {
    setImagenIndex(prev => (prev + 1) % imagenes.length);
  }, [imagenes.length]);

  const anterior = useCallback(() => {
    setImagenIndex(prev => (prev - 1 + imagenes.length) % imagenes.length);
  }, [imagenes.length]);

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') siguiente();
      if (e.key === 'ArrowLeft') anterior();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, siguiente, anterior]);

  if (!mounted) return null;

  const bs = badgeInline(producto.estado);
  const waLink = 'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa la maquinaria: ' + producto.nombre + (producto.precio ? ' - Precio: ' + formatearPrecio(producto.precio) : ''));

  return createPortal(
    <>
      <style>{`
        @media (min-width: 640px) {
          .mq-modal-box { flex-direction: row !important; }
          .mq-modal-info { width: 380px !important; max-height: 90vh !important; border-top: none !important; border-left: 1px solid #e2e8f0 !important; }
          .mq-modal-img { min-height: 500px !important; }
          .mq-modal-img img { max-height: 80vh !important; }
        }
      `}</style>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
        padding: '16px', boxSizing: 'border-box',
      }}>
        {/* Container */}
        <div className="mq-modal-box" onClick={e => e.stopPropagation()} style={{
          position: 'relative', width: '100%', maxWidth: '1024px', maxHeight: '90vh',
          borderRadius: '24px', border: '1px solid #e2e8f0', background: '#fff',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Close button */}
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: '36px', width: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
            border: '1px solid #e2e8f0', color: '#475569', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Image section */}
          <div className="mq-modal-img" style={{
            position: 'relative', flex: '1 1 auto', background: '#f1f5f9',
            minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {imagenes.length > 0 ? (
              <>
                <img src={imagenes[imagenIndex]} alt={producto.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '45vh' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                {imagenes.length > 1 && (
                  <>
                    <button onClick={anterior} style={{
                      position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      height: '40px', width: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: 0,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button onClick={siguiente} style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      height: '40px', width: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: 0,
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <div style={{
                      position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                      display: 'flex', alignItems: 'center', gap: '6px',
                    }}>
                      {imagenes.map((_, i) => (
                        <button key={i} onClick={() => setImagenIndex(i)} style={{
                          height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', padding: 0,
                          width: i === imagenIndex ? '24px' : '8px',
                          background: i === imagenIndex ? '#0f172a' : 'rgba(148,163,184,0.6)',
                          transition: 'all 0.2s',
                        }} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>Sin imagenes</p>
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="mq-modal-info" style={{
            width: '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px',
            padding: '20px', borderTop: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: '50vh',
          }}>
            <div>
              <span style={{
                display: 'inline-block', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.2em', padding: '4px 10px', borderRadius: '9999px', border: '1px solid',
                background: bs.background, color: bs.color, borderColor: bs.borderColor,
              }}>
                {producto.estado || 'disponible'}
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>{producto.nombre}</h2>
              {producto.precio !== null && producto.precio !== undefined && (
                <p style={{ marginTop: '12px', fontSize: '28px', fontWeight: 700, color: '#0284c7', margin: '12px 0 0 0' }}>{formatearPrecio(producto.precio)}</p>
              )}
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', margin: '0 0 8px 0' }}>Descripcion</p>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{producto.descripcion || 'Sin descripcion.'}</p>
            </div>
            {imagenes.length > 1 && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#94a3b8', margin: '0 0 8px 0' }}>Galeria</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {imagenes.map((url, i) => (
                    <button key={i} onClick={() => setImagenIndex(i)} style={{
                      height: '56px', width: '56px', borderRadius: '12px', padding: 0, cursor: 'pointer',
                      border: i === imagenIndex ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                      overflow: 'hidden', outline: i === imagenIndex ? '2px solid #bae6fd' : 'none',
                    }}>
                      <img src={url} alt="" style={{ height: '100%', width: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <a href={waLink} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%',
                borderRadius: '12px', background: '#10b981', color: '#fff', fontWeight: 600,
                padding: '12px', fontSize: '14px', textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

export default function MaquinariaPage() {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [modalProducto, setModalProducto] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarMaquinaria();
  }, []);

  const cargarMaquinaria = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/maquinaria');
      if (!res.ok) throw new Error('Error al cargar maquinaria');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const productosFiltrados = items.filter(p => {
    const q = filtro.toLowerCase();
    if (!q) return true;
    return (
      (p.nombre || '').toLowerCase().includes(q) ||
      (p.descripcion || '').toLowerCase().includes(q)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-white py-12 px-6 text-center border-b border-slate-200">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-sky-100 border border-sky-200 text-sky-600 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Maquinaria en Venta</h1>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <form onSubmit={e => { e.preventDefault(); setFiltro(busqueda.trim()); }} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar maquinaria..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-900 border border-slate-200 focus:outline-none focus:border-sky-400 text-sm shadow-sm" />
            </div>
            <button type="submit" className="btn-anim inline-flex items-center justify-center rounded-xl bg-sky-600 text-white px-6 py-3 text-sm font-semibold hover:bg-sky-500 transition-colors shadow-sm">Buscar</button>
            {filtro && (
              <button type="button" onClick={() => { setFiltro(''); setBusqueda(''); }}
                className="btn-anim inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-slate-300 transition-colors">Limpiar</button>
            )}
          </form>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700 mb-6 text-center">{error}</div>
        )}
        {cargando ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center gap-2 text-slate-500">
              <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
              Cargando maquinaria...
            </div>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <span className="text-5xl">&#x1F527;</span>
              <p className="text-lg text-slate-500 font-medium">{filtro ? `No se encontraron resultados para "${filtro}"` : 'No hay maquinaria disponible en este momento.'}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">Mostrando <span className="font-semibold text-slate-900">{productosFiltrados.length}</span> {productosFiltrados.length === 1 ? 'equipo' : 'equipos'}{filtro && <span className="ml-1">para &quot;{filtro}&quot;</span>}</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {productosFiltrados.map(producto => {
                const imagenes = parseImagenes(producto.imagenes);
                const primeraImagen = imagenes[0];
                const precioFmt = formatearPrecio(producto.precio);
                return (
                  <div key={producto.id} onClick={() => setModalProducto(producto)}
                    className="group bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {primeraImagen ? (
                        <img src={primeraImagen} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">&#x2699;</div>
                      )}
                      {imagenes.length > 1 && (
                        <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 text-white text-[10px] font-semibold px-2.5 py-1 backdrop-blur-sm">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          {imagenes.length}
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${estadoBadge(producto.estado)} bg-white/90 backdrop-blur-sm`}>
                          {producto.estado || 'disponible'}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-4 flex flex-col gap-1 sm:gap-2">
                      <h3 className="font-semibold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">{producto.nombre}</h3>
                      {precioFmt ? <p className="text-base sm:text-lg font-bold text-sky-600">{precioFmt}</p> : <p className="text-sm font-medium text-slate-400">Precio a convenir</p>}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{producto.descripcion || ''}</p>
                      <div className="mt-1 hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Medellin, Colombia
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      {modalProducto && <ModalProducto producto={modalProducto} onClose={() => setModalProducto(null)} />}
    </main>
  );
}