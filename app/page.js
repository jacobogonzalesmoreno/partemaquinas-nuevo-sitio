'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import { generarSugerencias, crearDebounce } from '@/lib/busqueda-tolerante';
import { resolverRutaBusquedaCatalogo } from '@/lib/catalogo-categorias';
import { MENU_CATEGORIAS } from '@/lib/menu-categorias';

/* -- Fuentes --------------------------------------------- */
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

/* -- Hooks personalizados -------------------------------- */

function useCountUp(end, duration = 1400) {
  const [count, setCount] = useState(0);
  const [go, setGo] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGo(true); obs.disconnect(); } }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!go) return;
    let t0 = null;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [go, end, duration]);
  return [count, ref];
}

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, v];
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const h = () => { const t = document.documentElement.scrollHeight - window.innerHeight; setP(t > 0 ? window.scrollY / t : 0); };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return p;
}

/* -- Iconos SVG ------------------------------------------ */

function IconShield({ c = 'w-6 h-6' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
}
function IconWrench({ c = 'w-6 h-6' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
}
function IconTruck({ c = 'w-6 h-6' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function IconChat({ c = 'w-6 h-6' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>;
}
function IconSearch({ c = 'w-5 h-5' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
}
function IconArrow({ c = 'w-4 h-4' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
}
function IconMenu({ c = 'w-6 h-6' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>;
}
function IconX({ c = 'w-6 h-6' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
}
function IconWhatsApp({ c = 'w-5 h-5' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
}
function IconPhone({ c = 'w-4 h-4' }) {
  return <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>;
}

/* -- Wrapper de animación al scroll ---------------------- */

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, v] = useInView(0.08);
  return (
    <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.6s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* -- Sidebar con tabs ------------------------------------ */

function SidebarTabs({ manualesPorMarca, mecanicos, aliados }) {
  const [tab, setTab] = useState('manuales');
  const tabs = [
    { id: 'manuales', label: 'Manuales', count: manualesPorMarca.length },
    { id: 'mecanicos', label: 'Mecanicos', count: mecanicos.length },
    { id: 'aliados', label: 'Aliados', count: aliados.length },
  ];

  const tabContent = {
    manuales: (
      <div className="p-4 flex flex-col gap-2">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold">Manuales</p>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">Biblioteca tecnica</h4>
          <p className="text-xs text-slate-500 mt-1">Manuales y recursos por marca para diagnostico y referencias rapidas.</p>
        </div>
        {manualesPorMarca.map((item, i) => (
          <Link key={item.nombre} href={item.url} target="_blank" rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-orange-500"
            style={{ animationDelay: `${i * 40}ms` }}>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900">{item.nombre}</span>
              <span className="text-[11px] text-slate-400">Documentacion de referencia</span>
            </span>
            <span className="text-orange-500 group-hover:translate-x-1 transition-transform duration-200"><IconArrow /></span>
          </Link>
        ))}
      </div>
    ),
    mecanicos: (
      <div className="p-4 flex flex-col gap-2">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold">Mecanicos</p>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">Red de confianza</h4>
          <p className="text-xs text-slate-500 mt-1">Contactos directos para motor, hidraulica y mantenimiento especializado.</p>
        </div>
        {mecanicos.map((item, i) => (
          <a key={item.nombre} href={item.url} target="_blank" rel="noopener noreferrer"
            className="group rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 block focus-visible:outline-2 focus-visible:outline-orange-500"
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{item.nombre}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.especialidad}</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 flex items-center gap-1"><IconWhatsApp c="w-3 h-3" />WhatsApp</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500 flex items-center gap-1.5"><IconPhone c="w-3.5 h-3.5" />{item.tel}</span>
              <span className="text-xs font-semibold text-orange-500 group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-0.5">Abrir chat <IconArrow c="w-3 h-3" /></span>
            </div>
          </a>
        ))}
      </div>
    ),
    aliados: (
      <div className="p-4 flex flex-col gap-2">
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold">Aliados</p>
          <h4 className="text-base font-bold text-slate-900 mt-0.5">Talleres de confianza</h4>
          <p className="text-xs text-slate-500 mt-1">Empresas aliadas para servicios especializados y rectificacion.</p>
        </div>
        {aliados.map((item, i) => (
          <Link key={item.nombre} href={item.url} target="_blank" rel="noopener noreferrer"
            className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-orange-500"
            style={{ animationDelay: `${i * 40}ms` }}>
            <span className="text-sm font-semibold text-slate-900">{item.nombre}</span>
            <span className="text-orange-500 group-hover:translate-x-1 transition-transform duration-200"><IconArrow /></span>
          </Link>
        ))}
      </div>
    ),
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex border-b border-slate-100 px-3 pt-3 gap-1 shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center px-3 py-2.5 rounded-t-xl text-xs font-semibold transition-all duration-200 flex-1 border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${
              tab === t.id ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
            }`}>
            <span className="uppercase tracking-widest text-[10px]">{t.label}</span>
            <span className={`text-sm font-bold mt-0.5 ${tab === t.id ? 'text-yellow-400' : 'text-slate-700'}`}>{t.count}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 custom-scroll">
        <div key={tab} className="animate-tab-in">{tabContent[tab]}</div>
      </div>
    </div>
  );
}

/* -- Drawer móvil ---------------------------------------- */

function MobileDrawer({ manualesPorMarca, mecanicos, aliados }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Abrir panel de soporte"
        className="lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/30 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-orange-500">
        <IconMenu />
      </button>
      <div className={`lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)} />
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold">Red de soporte</p>
            <h3 className="text-lg font-bold text-slate-900">Aliados y mecanicos</h3>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Cerrar panel" className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <IconX />
          </button>
        </div>
        <SidebarTabs manualesPorMarca={manualesPorMarca} mecanicos={mecanicos} aliados={aliados} />
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGINA PRINCIPAL
   ══════════════════════════════════════════════════════════ */

export default function Home() {

  const scrollProgress = useScrollProgress();
  const [stat1, ref1] = useCountUp(390);
  const [stat2, ref2] = useCountUp(24, 1000);

  /* -- Datos ------------------------------------------- */
  const marcas = [
    { nombre: 'Case', archivo: 'case.png', buscar: 'case' },
    { nombre: 'Caterpillar', archivo: 'Caterpillar-Logo-1989-present.png', buscar: 'caterpillar' },
    { nombre: 'Cummins', archivo: 'Cummins-logo.png', buscar: 'cummins' },
    { nombre: 'Doosan', archivo: 'doosan.png', buscar: 'doosan' },
    { nombre: 'Hino', archivo: 'Hino-symbol-1440x900.png', buscar: 'hino' },
    { nombre: 'Hitachi', archivo: 'Hitachi-Logo-1968-1992.png', buscar: 'hitachi' },
    { nombre: 'IHI', archivo: 'ihi.png', buscar: 'ihi' },
    { nombre: 'Isuzu', archivo: 'isuzu_PNG23.png', buscar: 'isuzu' },
    { nombre: 'Kobelco', archivo: 'Kobelco-Logo.png', buscar: 'kobelco' },
    { nombre: 'Komatsu', archivo: 'Komatsu-Logo.png', buscar: 'komatsu' },
    { nombre: 'Kubota', archivo: 'Kubota-logo.png', buscar: 'kubota' },
    { nombre: 'Link-Belt', archivo: 'linkbelt.png', buscar: 'linkbelt' },
    { nombre: 'LiuGong', archivo: 'liugong.png', buscar: 'liugong' },
    { nombre: 'Mitsubishi', archivo: 'Mitsubishi.png', buscar: 'mitsubishi' },
    { nombre: 'SANY', archivo: 'sany.png', buscar: 'sany' },
    { nombre: 'Shibaura', archivo: 'shibaura-logo-png_seeklogo-278990.png', buscar: 'shibaura' },
    { nombre: 'Volvo', archivo: 'volvo.png', buscar: 'volvo' },
  ];

  const sellos = [
    { icono: <IconShield c="w-7 h-7" />, titulo: 'Garantia 30 dias', descripcion: 'Cobertura por falla de fabrica en nuestros equipos.' },
    { icono: <IconWrench c="w-7 h-7" />, titulo: 'Garantia 60 dias', descripcion: 'Si tu excavadora presenta fallas, asumimos costos y repuestos necesarios.' },
    { icono: <IconTruck c="w-7 h-7" />, titulo: 'Envios internacionales', descripcion: 'Enviamos a todo Colombia, Ecuador y Venezuela.' },
    { icono: <IconChat c="w-7 h-7" />, titulo: 'Somos una solucion', descripcion: 'Ayudamos y vendemos. Asesoria tecnica especializada por WhatsApp.' },
  ];

  const manualesPorMarca = [
    { nombre: 'Kobelco', url: 'https://truckmanualshub.com/kobelco-excavator-parts-manuals-wiring-diagrams-service-repair-and-workshop-manuals-pdf/' },
    { nombre: 'Hitachi', url: 'https://truckmanualshub.com/hitachi-excavators-service-repair-and-workshop-manuals-pdf/' },
    { nombre: 'Caterpillar', url: 'https://truckmanualshub.com/category/tractors/caterpillar/' },
    { nombre: 'Komatsu', url: 'https://truckmanualshub.com/komatsu-excavator-service-workshop-parts-manual-pdf/' },
    { nombre: 'Liugong', url: 'https://truckmanualshub.com/liugong-excavators-service-operators-and-maintenance-manuals-pdf/' },
    { nombre: 'Sany', url: 'https://truckmanualshub.com/sany-excavators-operators-maintenance-and-service-manuals-pdf/' },
    { nombre: 'Bobcat', url: 'https://truckmanualshub.com/bobcat-excavator-service-repair-and-operators-manuals-parts-manuals-pdf/' },
    { nombre: 'John Deere', url: 'https://truckmanualshub.com/excavator-service-repair-operators-and-parts-manuals-pdf/' },
    { nombre: 'New Holland', url: 'https://truckmanualshub.com/category/new-holland/' },
  ];

  const mecanicos = [
    { nombre: 'Carlos Mario Correa', especialidad: 'Motor - Mantenimientos', tel: '+57 315 485 0226', url: 'https://wa.me/573154850226' },
    { nombre: 'Victor Acevedo', especialidad: 'Hidraulica', tel: '+57 314 769 5473', url: 'https://wa.me/573147695473' },
    { nombre: 'Jimmy Ayala', especialidad: 'Motor', tel: '+57 314 873 1060', url: 'https://wa.me/573148731060' },
    { nombre: 'Wilson Bolivar', especialidad: 'Motor - Hidraulico - Electronico', tel: '+57 316 297 3949', url: 'https://wa.me/573162973949' },
    { nombre: 'Carlos Gonzalez', especialidad: 'Motor - Hidraulica', tel: '+57 322 859 6442', url: 'https://wa.me/573228596442' },
    { nombre: 'Jairo Valencia', especialidad: 'Motor - Hidraulica', tel: '+57 314 601 3704', url: 'https://wa.me/573146013704' },
  ];

  const aliados = [
    { nombre: 'Rectificadora H&M', url: 'https://wa.me/573146820296' },
    { nombre: 'JMM Hidraulicos', url: 'https://www.jmmhidraulicos.com/' },
  ];

  /* -- Buscador inteligente --------------------------- */
  const router = useRouter();
  const [inputBuscar, setInputBuscar] = useState('');
  const [sugerenciasCats, setSugerenciasCats] = useState([]);
  const [sugerenciasProds, setSugerenciasProds] = useState([]);
  const [cargandoProds, setCargandoProds] = useState(false);
  const [sugerenciaActiva, setSugerenciaActiva] = useState(-1);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const abortRef = useRef(null);

  const totalSugerencias = sugerenciasCats.length + sugerenciasProds.length + 1;

  const actualizarSugerenciasCats = useCallback(query => {
    if (!query || query.trim().length < 1) { setSugerenciasCats([]); return; }
    setSugerenciasCats(generarSugerencias(query, MENU_CATEGORIAS, 4));
  }, []);

  const debouncedCats = useRef(crearDebounce(actualizarSugerenciasCats, 150)).current;

  const buscarProductosAPI = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setSugerenciasProds([]); setCargandoProds(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setCargandoProds(true);
    try {
      const res = await fetch(`/api/buscar?q=${encodeURIComponent(query.trim())}&limit=5`, { signal: abortRef.current.signal });
      if (!res.ok) { setSugerenciasProds([]); return; }
      const data = await res.json();
      setSugerenciasProds(data.productos || []);
    } catch (err) {
      if (err.name !== 'AbortError') setSugerenciasProds([]);
    } finally { setCargandoProds(false); }
  }, []);

  const debouncedProds = useRef(crearDebounce(buscarProductosAPI, 250)).current;

  useEffect(() => {
    return () => { debouncedCats.cancel(); debouncedProds.cancel(); if (abortRef.current) abortRef.current.abort(); };
  }, [debouncedCats, debouncedProds]);

  useEffect(() => {
    const handler = e => {
      if (searchRef.current && !searchRef.current.contains(e.target)) { setMostrarSugerencias(false); setSugerenciaActiva(-1); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setMostrarSugerencias(false); setSugerenciaActiva(-1);
    };
    window.addEventListener('scroll', handler, true);
    return () => window.removeEventListener('scroll', handler, true);
  }, []);

  const onChangeInput = e => {
    const val = e.target.value;
    setInputBuscar(val);
    setSugerenciaActiva(-1);
    debouncedCats(val);
    debouncedProds(val);
    if (val.trim().length >= 2) setMostrarSugerencias(true);
    else setMostrarSugerencias(false);
  };

  const cerrarDropdown = () => {
    setMostrarSugerencias(false); setSugerenciaActiva(-1);
    debouncedCats.cancel(); debouncedProds.cancel();
    if (abortRef.current) abortRef.current.abort();
  };

  const onSubmitBuscar = e => {
    e?.preventDefault(); cerrarDropdown();
    if (inputBuscar.trim()) {
      const ruta = resolverRutaBusquedaCatalogo(inputBuscar.trim());
      setInputBuscar(''); router.push(ruta);
    } else { router.push('/productos'); }
  };

  const onKeyDownInput = e => {
    const haySugerencias = mostrarSugerencias && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0 || cargandoProds);
    if (!haySugerencias) return;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setSugerenciaActiva(prev => (prev + 1) % totalSugerencias); break;
      case 'ArrowUp': e.preventDefault(); setSugerenciaActiva(prev => (prev - 1 + totalSugerencias) % totalSugerencias); break;
      case 'Escape': cerrarDropdown(); break;
      case 'Enter': {
        e.preventDefault(); const idx = sugerenciaActiva;
        if (idx >= 0 && idx < sugerenciasCats.length) { cerrarDropdown(); setInputBuscar(''); router.push(sugerenciasCats[idx].href); return; }
        const prodIdx = idx - sugerenciasCats.length;
        if (prodIdx >= 0 && prodIdx < sugerenciasProds.length) { cerrarDropdown(); setInputBuscar(''); router.push(`/productos/${sugerenciasProds[prodIdx].id}`); return; }
        cerrarDropdown(); onSubmitBuscar(e); break;
      }
    }
  };

  /* -- Busqueda de marcas ------------------------------ */
  const [busqueda, setBusqueda] = useState('');
  const marcasFiltradas = useMemo(() => {
    if (!busqueda.trim()) return marcas;
    const q = busqueda.toLowerCase();
    return marcas.filter(m => m.nombre.toLowerCase().includes(q));
  }, [busqueda]);

  /* -- Render ------------------------------------------ */
  return (
    <>
      <style>{`
        :root {
          --font-display: ${spaceGrotesk.style.fontFamily}, sans-serif;
          --font-body: ${dmSans.style.fontFamily}, sans-serif;
        }
        html { scroll-behavior: smooth; }
        body { font-family: var(--font-body); }

        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .animate-tab-in { animation: tabIn 280ms cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes tabIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-tab-in > * {
          opacity: 0;
          animation: itemIn 300ms cubic-bezier(.22,1,.36,1) forwards;
        }
        @keyframes itemIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .hero-card-pattern {
          background-image:
            radial-gradient(circle at 20% 80%, rgba(234,88,12,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(234,88,12,0.08) 0%, transparent 50%),
            repeating-linear-gradient(135deg, transparent, transparent 20px, rgba(255,255,255,0.015) 20px, rgba(255,255,255,0.015) 21px);
        }

        .brand-card { position: relative; overflow: hidden; }
        .brand-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.3s;
          background: radial-gradient(circle at 50% 50%, rgba(234,88,12,0.06), transparent 70%);
          pointer-events: none;
        }
        .brand-card:hover::after { opacity: 1; }

        /* Banner: sombra interior sutil para dar profundidad sin recortar */
        .banner-wrap {
          box-shadow: 0 4px 24px -4px rgba(15,23,42,0.10), 0 1px 4px rgba(15,23,42,0.06);
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          html { scroll-behavior: auto; }
        }
      `}</style>

      <div className={`${spaceGrotesk.variable} ${dmSans.variable}`}>

        {/* Barra de progreso de scroll */}
        <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent" aria-hidden="true">
          <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-[width] duration-100 ease-out" style={{ width: `${scrollProgress * 100}%` }} />
        </div>

        <main className="min-h-screen bg-slate-50 text-slate-900">

          {/* -- Banner --------------------------------- */}
          <section className="bg-white border-b border-slate-200">
            <div className="px-4 py-4 sm:px-6 sm:py-5">
              <div className="banner-wrap rounded-2xl overflow-hidden">
                <Image
                  src="/banners/ChatGPT%20Image%204%20jun%202026,%2010_33_29%20p.m..png"
                  alt="Banner principal"
                  width={1600}
                  height={420}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </section>

          {/* -- Buscador inteligente -------------------- */}
          <section className="relative z-10 bg-slate-50 border-b border-slate-200">
            <div className="max-w-2xl mx-auto px-6 py-10">
              <Reveal>
                <div className="text-center mb-5">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Que producto estas buscando?</h2>
                  <p className="text-slate-500 mt-2">Escribe el nombre, marca, referencia o modelo y encuentra el repuesto.</p>
                </div>
                <form onSubmit={onSubmitBuscar} className="relative" ref={searchRef}>
                  <div className="relative">
                    <IconSearch c="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Ej: motor komatsu 6BG1, bomba inyeccion, filtro hidraulico..."
                      value={inputBuscar}
                      onChange={onChangeInput}
                      onKeyDown={onKeyDownInput}
                      onFocus={() => { if (inputBuscar.trim().length >= 2 && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0)) setMostrarSugerencias(true); }}
                      className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white text-slate-900 border border-slate-200 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 text-base shadow-sm shadow-slate-200/50 transition-all"
                      autoComplete="off"
                    />
                  </div>
                  {mostrarSugerencias && (sugerenciasCats.length > 0 || sugerenciasProds.length > 0 || cargandoProds) && (
                    <div
                      ref={dropdownRef}
                      className="absolute left-0 top-full z-[100] mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 overflow-hidden"
                      onScroll={e => e.stopPropagation()}
                    >
                      <ul className="py-1 max-h-[55vh] overflow-y-auto">
                        {sugerenciasCats.length > 0 && (
                          <li><p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">Categorias</p></li>
                        )}
                        {sugerenciasCats.map((sug, i) => {
                          const isActive = sugerenciaActiva === i;
                          return (
                            <li key={`cat-${sug.href}`}>
                              <button type="button"
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-orange-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                                onMouseDown={e => { e.preventDefault(); cerrarDropdown(); setInputBuscar(''); router.push(sug.href); }}
                                onMouseEnter={() => setSugerenciaActiva(i)}>
                                <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-400 shrink-0">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{sug.texto}</p>
                                  {sug.textoCompleto !== sug.texto && <p className="text-[11px] text-slate-400 truncate">{sug.textoCompleto}</p>}
                                </div>
                                <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${sug.nivel === 0 ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-600'}`}>{sug.tipo}</span>
                              </button>
                            </li>
                          );
                        })}
                        {sugerenciasCats.length > 0 && (sugerenciasProds.length > 0 || cargandoProds) && <li className="border-t border-slate-100" />}
                        {sugerenciasProds.length > 0 || cargandoProds ? (
                          <li><p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 bg-slate-50/80">Productos</p></li>
                        ) : null}
                        {cargandoProds && sugerenciasProds.length === 0 && (
                          <li><div className="px-4 py-5 text-center text-sm text-slate-400">Buscando productos...</div></li>
                        )}
                        {sugerenciasProds.map((prod, i) => {
                          const thisIndex = sugerenciasCats.length + i;
                          const isActive = sugerenciaActiva === thisIndex;
                          return (
                            <li key={`prod-${prod.id}`}>
                              <button type="button"
                                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? 'bg-orange-50 text-slate-900' : 'text-slate-700 hover:bg-slate-50'}`}
                                onMouseDown={e => { e.preventDefault(); cerrarDropdown(); setInputBuscar(''); router.push(`/productos/${prod.id}`); }}
                                onMouseEnter={() => setSugerenciaActiva(thisIndex)}>
                                {prod.imagen ? (
                                  <img src={prod.imagen} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0" />
                                ) : (
                                  <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 text-lg shrink-0">&#9881;</span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{prod.nombre}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {prod.sku && <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>}
                                    {prod.marcas && <span className="text-[10px] text-orange-500 font-medium">{prod.marcas}</span>}
                                  </div>
                                </div>
                                <span className="text-orange-400 text-xs shrink-0">&#8594;</span>
                              </button>
                            </li>
                          );
                        })}
                        <li className="border-t border-slate-100">
                          <button type="button"
                            className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm transition-colors ${sugerenciaActiva === totalSugerencias - 1 ? 'bg-orange-50 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
                            onMouseDown={e => { e.preventDefault(); onSubmitBuscar(e); }}
                            onMouseEnter={() => setSugerenciaActiva(totalSugerencias - 1)}>
                            <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-400 shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            </span>
                            <span>Buscar &quot;{inputBuscar.trim()}&quot; en todos los productos</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </form>
              </Reveal>
            </div>
          </section>

          {/* -- Hero + Sidebar ------------------------- */}
          <section className="bg-white border-b border-slate-200">
            <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-12">
              <div className="flex gap-6 items-start">

                {/* Sidebar desktop */}
                <aside className="hidden lg:flex flex-col w-[300px] shrink-0 sticky top-24 h-[calc(100vh-7rem)] rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-300/30 overflow-hidden">
                  <div className="px-5 pt-5 pb-4 border-b border-slate-100">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-orange-500 font-bold mb-1">Red de soporte</p>
                    <h3 className="text-lg font-bold text-slate-900">Aliados y mecanicos</h3>
                    <p className="text-xs text-slate-500 mt-1">Acceso rapido a contactos, talleres y manuales.</p>
                  </div>
                  <SidebarTabs manualesPorMarca={manualesPorMarca} mecanicos={mecanicos} aliados={aliados} />
                </aside>

                {/* Contenido principal */}
                <div className="flex-1 min-w-0 flex flex-col gap-10">

                  {/* Texto hero + tarjeta de stats */}
                  <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
                    <Reveal>
                      <div className="flex flex-col gap-6">
                        <p className="text-xs uppercase tracking-[0.4em] text-orange-500 font-semibold">ParteMaquinas</p>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-[1.1]" style={{ fontFamily: 'var(--font-display)' }}>
                          Somos una solucion:{' '}
                          <span className="text-orange-500">Ayudamos</span> y vendemos
                        </h1>
                        <p className="text-slate-600 text-lg leading-relaxed">
                          Catalogo especializado con asesoria rapida para excavadoras, cargadores y equipos industriales.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 pt-1">
                          <Link href="/productos"
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-orange-500">
                            Ver catalogo
                          </Link>
                          <Link href="/contacto"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-6 py-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-orange-500">
                            <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={30} height={30} />
                            Hablar con un asesor
                          </Link>
                        </div>
                      </div>
                    </Reveal>

                    <Reveal delay={120}>
                      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-slate-300/40  relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">Cobertura nacional</p>
                          <h2 className="text-2xl font-semibold mt-3">Cotiza en minutos</h2>
                          <p className="text-slate-200 mt-3 leading-relaxed">
                            Gestionamos repuestos originales y alternativos con trazabilidad clara y envio seguro.
                          </p>
                          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                            <div ref={ref1} className="rounded-2xl bg-white/10 p-4">
                              <p className="text-yellow-400 font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>+{stat1}</p>
                              <p className="text-slate-200 text-xs mt-1">Referencias activas</p>
                            </div>
                            <div ref={ref2} className="rounded-2xl bg-white/10 p-4">
                              <p className="text-yellow-400 font-bold text-2xl" style={{ fontFamily: 'var(--font-display)' }}>{stat2}/7</p>
                              <p className="text-slate-200 text-xs mt-1">Atencion WhatsApp</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  </div>

                  {/* Sellos */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {sellos.map((sello, i) => (
                      <Reveal key={sello.titulo} delay={i * 80}>
                        <div className="group bg-slate-50 rounded-2xl border border-slate-200 p-5 hover:border-orange-300 hover:shadow-md hover:shadow-slate-200/50 transition-all duration-300 flex flex-col gap-2 h-full">
                          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 text-orange-500 flex items-center justify-center group-hover:bg-orange-100 group-hover:scale-105 transition-all duration-300">
                            {sello.icono}
                          </div>
                          <p className="text-sm font-bold text-slate-900">{sello.titulo}</p>
                          <p className="text-xs text-slate-500 leading-relaxed">{sello.descripcion}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* -- Marcas ---------------------------------- */}
          <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200">
            <Reveal>
              <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Marcas principales</h2>
                  <p className="text-slate-600 mt-1">Selecciona tu marca y encuentra el repuesto ideal.</p>
                </div>
                <Link href="/productos" className="text-orange-500 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all duration-200">
                  Ir al catalogo <IconArrow c="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {marcasFiltradas.map((marca, i) => (
                <Reveal key={marca.nombre} delay={Math.min(i * 40, 400)}>
                  <Link href={`/productos?buscar=${encodeURIComponent(marca.buscar)}`}
                    className="brand-card group rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300 block focus-visible:outline-2 focus-visible:outline-orange-500">
                    <div className="h-16 rounded-xl bg-slate-100 group-hover:bg-yellow-50/60 flex items-center justify-center transition-colors duration-300">
                      <Image src={`/marcas/${marca.archivo}`} alt={marca.nombre} width={120} height={64} className="max-h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{marca.nombre}</p>
                  </Link>
                </Reveal>
              ))}
            </div>

            {marcasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400 text-sm">No se encontraron marcas para &ldquo;{busqueda}&rdquo;</p>
                <button onClick={() => setBusqueda('')} className="mt-2 text-orange-500 text-sm font-semibold hover:underline">Limpiar busqueda</button>
              </div>
            )}
          </section>

          {/* -- CTA ------------------------------------- */}
          <Reveal>
            <section className="bg-white border-t border-slate-200">
              <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Listo para cotizar?</h3>
                  <p className="text-slate-600">Recibe respuesta rapida con un asesor experto.</p>
                </div>
                <Link href="/contacto"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-orange-500">
                  Contactar ahora
                </Link>
              </div>
            </section>
          </Reveal>

        </main>

        {/* Drawer móvil */}
        <MobileDrawer manualesPorMarca={manualesPorMarca} mecanicos={mecanicos} aliados={aliados} />

      </div>
    </>
  );
}