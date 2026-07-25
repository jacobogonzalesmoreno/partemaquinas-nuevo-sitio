'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

function parseImagenes(imagenes) {
  if (!imagenes) return [];
  if (Array.isArray(imagenes)) return imagenes.filter(Boolean);
  return imagenes.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
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

function ModalProducto({ producto, onClose }) {
  const [imagenIndex, setImagenIndex] = useState(0);
  const [montado, setMontado] = useState(false);
  const scrollAnterior = useRef(0);
  const imagenes = parseImagenes(producto.imagenes);

  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    scrollAnterior.current = window.scrollY;
    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') cerrar();
      if (e.key === 'ArrowRight') setImagenIndex(p => (p + 1) % imagenes.length);
      if (e.key === 'ArrowLeft') setImagenIndex(p => (p - 1 + imagenes.length) % imagenes.length);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  const cerrar = useCallback(() => {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.scrollTo(0, scrollAnterior.current);
    onClose();
  }, [onClose]);

  if (!montado) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 0, margin: 0, border: 'none', width: '100%', height: '100%', boxSizing: 'border-box',
      }}
      onClick={cerrar}
    >
      <style>{`
        @media (min-width: 640px) {
          #mq-modal-wrap { align-items: center !important; padding: 24px !important; }
          #mq-modal-card { max-width: 1024px !important; max-height: 90vh !important; border-radius: 24px !important; flex-direction: row !important; overflow: hidden !important; }
          #mq-modal-img { height: auto !important; flex: 1 1 0% !important; min-height: 500px !important; }
          #mq-modal-info { width: 380px !important; border-left: 1px solid #e2e8f0 !important; border-top: none !important; max-height: 90vh !important; }
          #mq-modal-close { position: absolute !important; top: 16px !important; right: 16px !important; }
        }
      `}</style>
      <div
        id="mq-modal-wrap"
        style={{
          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 0, boxSizing: 'border-box', height: '100vh', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          id="mq-modal-card"
          style={{
            position: 'relative', width: '100%', maxWidth: '100%', maxHeight: '100vh',
            borderRadius: '16px 16px 0 0', border: '1px solid #e2e8f0', backgroundColor: 'white',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box', paddingTop: '10%'
          }}
        >
          {/* Cerrar */}
          <button
            id="mq-modal-close"
            onClick={cerrar}
            style={{
              position: 'sticky', top: 8, zIndex: 20, alignSelf: 'flex-end', marginRight: 12, marginTop: 8,
              width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0',
              color: '#475569', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', padding: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Imagen */}
          <div
            id="mq-modal-img"
            style={{
              position: 'relative', backgroundColor: '#f1f5f9',
              height: '45vh', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}
          >
            {imagenes.length > 0 ? (
              <>
                <img src={imagenes[imagenIndex]} alt={producto.nombre} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} draggable={false} />
                {imagenes.length > 1 && (
                  <>
                    <button onClick={() => setImagenIndex(p => (p - 1 + imagenes.length) % imagenes.length)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button onClick={() => setImagenIndex(p => (p + 1) % imagenes.length)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', padding: 0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}>
                      {imagenes.map((_, i) => (
                        <button key={i} onClick={() => setImagenIndex(i)} style={{ height: 8, borderRadius: 9999, border: 'none', cursor: 'pointer', padding: 0, width: i === imagenIndex ? 24 : 8, backgroundColor: i === imagenIndex ? '#0f172a' : 'rgba(148, 163, 184, 0.6)', transition: 'all 0.2s' }} />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#94a3b8' }}>
                <span style={{ fontSize: 48 }}>Sin imagen</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div
            id="mq-modal-info"
            style={{
              width: '100%', display: 'flex', flexDirection: 'column', gap: 16,
              padding: 20, borderTop: '1px solid #e2e8f0',
              overflowY: 'auto', maxHeight: '55vh', boxSizing: 'border-box',
            }}
          >
            <div>
              <span style={{
                display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '4px 10px', borderRadius: 9999, border: '1px solid',
                backgroundColor: producto.estado === 'vendido' ? '#fee2e2' : producto.estado === 'reservado' ? '#fef3c7' : '#d1fae5',
                color: producto.estado === 'vendido' ? '#b91c1c' : producto.estado === 'reservado' ? '#b45309' : '#047857',
                borderColor: producto.estado === 'vendido' ? '#fecaca' : producto.estado === 'reservado' ? '#fde68a' : '#a7f3d0',
              }}>
                {producto.estado || 'disponible'}
              </span>
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>{producto.nombre}</h2>
              {producto.precio !== null && producto.precio !== undefined && (
                <p style={{ marginTop: 10, fontSize: 28, fontWeight: 700, color: '#0284c7' }}>{formatearPrecio(producto.precio)}</p>
              )}
            </div>
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 8 }}>Descripcion</p>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>{producto.descripcion || 'Sin descripcion.'}</p>
            </div>
            {imagenes.length > 1 && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 8 }}>Galeria</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {imagenes.map((url, i) => (
                    <button key={i} onClick={() => setImagenIndex(i)} style={{
                      height: 52, width: 52, borderRadius: 10, padding: 0,
                      border: i === imagenIndex ? '2px solid #38bdf8' : '1px solid #e2e8f0',
                      overflow: 'hidden', cursor: 'pointer',
                      boxShadow: i === imagenIndex ? '0 0 0 2px rgba(56, 189, 248, 0.3)' : 'none',
                    }}>
                      <img src={url} alt="" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ marginTop: 'auto', paddingTop: 14 }}>
              <a
                href={'https://api.whatsapp.com/send?phone=573163293151&text=' + encodeURIComponent('Hola, me interesa la maquinaria: ' + producto.nombre + (producto.precio ? ' - Precio: ' + formatearPrecio(producto.precio) : ''))}
                target="_blank" rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', borderRadius: 12, backgroundColor: '#10b981', color: 'white',
                  fontWeight: 600, padding: '12px 0', fontSize: 14, textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
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
              <span className="text-5xl">🔧</span>
              <p className="text-lg text-slate-500 font-medium">{filtro ? `No se encontraron resultados para "${filtro}"` : 'No hay maquinaria disponible en este momento.'}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">Mostrando <span className="font-semibold text-slate-900">{productosFiltrados.length}</span> {productosFiltrados.length === 1 ? 'equipo' : 'equipos'}{filtro && <span className="ml-1">para "{filtro}"</span>}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {productosFiltrados.map(producto => {
                const imagenes = parseImagenes(producto.imagenes);
                const primeraImagen = imagenes[0];
                const precioFmt = formatearPrecio(producto.precio);
                return (
                  <div key={producto.id} onClick={() => setModalProducto(producto)}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-sky-300 transition-all duration-300 cursor-pointer hover:-translate-y-1">
                    <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                      {primeraImagen ? (
                        <img src={primeraImagen} alt={producto.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={e => { e.currentTarget.style.display = 'none'; }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">⚙️</div>
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
                    <div className="p-4 flex flex-col gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-sky-700 transition-colors">{producto.nombre}</h3>
                      {precioFmt ? <p className="text-lg font-bold text-sky-600">{precioFmt}</p> : <p className="text-sm font-medium text-slate-400">Precio a convenir</p>}
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{producto.descripcion || ''}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
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