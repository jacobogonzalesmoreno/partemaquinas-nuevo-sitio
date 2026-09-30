'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';

const CLAVE_CONSENTIMIENTO = 'partemaquinas-consentimiento-v1';
const CONSENTIMIENTO_VACIO = { analitica: false, herramientas: false };

function leerConsentimiento() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CONSENTIMIENTO));
    return guardado?.version === 1 ? { analitica: Boolean(guardado.analitica), herramientas: Boolean(guardado.herramientas) } : null;
  } catch { return null; }
}

export default function ServiciosConConsentimiento() {
  const [consentimiento, setConsentimiento] = useState(null);
  const [preferenciasLeidas, setPreferenciasLeidas] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [opciones, setOpciones] = useState(CONSENTIMIENTO_VACIO);

  useEffect(() => {
    const valor = leerConsentimiento();
    setConsentimiento(valor);
    setPreferenciasLeidas(true);
    if (valor) setOpciones(valor);
    const abrirAjustes = () => { setOpciones(leerConsentimiento() || CONSENTIMIENTO_VACIO); setModalAbierto(true); };
    window.addEventListener('open-cookie-settings', abrirAjustes);
    return () => window.removeEventListener('open-cookie-settings', abrirAjustes);
  }, []);

  const guardar = valor => {
    const anterior = leerConsentimiento();
    const registro = { version: 1, ...valor, fecha: new Date().toISOString() };
    localStorage.setItem(CLAVE_CONSENTIMIENTO, JSON.stringify(registro));
    setConsentimiento(valor);
    setOpciones(valor);
    setModalAbierto(false);
    if ((anterior?.analitica && !valor.analitica) || (anterior?.herramientas && !valor.herramientas)) window.location.reload();
  };

  return <>
    {consentimiento?.analitica && <Analytics />}
    {consentimiento?.herramientas && <Script src="https://code.tidio.co/ik3zg1kybelonasjdzw8q5wxqbwt9htr.js" strategy="afterInteractive" />}
    {preferenciasLeidas && consentimiento === null && !modalAbierto && (
      <aside className="cookie-banner" aria-label="Preferencias de cookies">
        <div><strong>Tu privacidad importa</strong><p>Usamos almacenamiento necesario para el sitio. Con tu permiso, activamos analítica y herramientas externas. <a href="/politica-cookies">Lee la política de cookies</a>.</p></div>
        <div className="cookie-banner__actions">
          <button type="button" className="cookie-button cookie-button--quiet" onClick={() => { setOpciones(CONSENTIMIENTO_VACIO); setModalAbierto(true); }}>Configurar</button>
          <button type="button" className="cookie-button cookie-button--quiet" onClick={() => guardar(CONSENTIMIENTO_VACIO)}>Rechazar opcionales</button>
          <button type="button" className="cookie-button cookie-button--accept" onClick={() => guardar({ analitica: true, herramientas: true })}>Aceptar todas</button>
        </div>
      </aside>
    )}
    {modalAbierto && (
      <div className="cookie-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setModalAbierto(false); }}>
        <section className="cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="cookie-dialog-title">
          <button type="button" className="cookie-dialog__close" aria-label="Cerrar preferencias" onClick={() => setModalAbierto(false)}>×</button>
          <p className="legal-eyebrow">Privacidad</p><h2 id="cookie-dialog-title">Configura tus cookies</h2>
          <p>Las cookies y tecnologías opcionales permanecen desactivadas hasta que elijas activarlas. Puedes cambiar tu elección en cualquier momento desde el pie de página.</p>
          <div className="cookie-choice"><div><strong>Necesarias</strong><p>Seguridad, preferencias, navegación del catálogo y visualización 3D en las fichas que ofrecen esa función. Siempre activas; no se usan para publicidad.</p></div><span className="cookie-choice__locked">Siempre activas</span></div>
          <label className="cookie-choice"><span><strong>Analítica</strong><p>Vercel Analytics, para medir visitas y mejorar el sitio.</p></span><input type="checkbox" checked={opciones.analitica} onChange={event => setOpciones(prev => ({ ...prev, analitica: event.target.checked }))} /></label>
          <label className="cookie-choice"><span><strong>Herramientas externas</strong><p>Chat de Tidio. Google Maps solo se carga si eliges abrir el mapa.</p></span><input type="checkbox" checked={opciones.herramientas} onChange={event => setOpciones(prev => ({ ...prev, herramientas: event.target.checked }))} /></label>
          <div className="cookie-banner__actions"><button type="button" className="cookie-button cookie-button--quiet" onClick={() => guardar(CONSENTIMIENTO_VACIO)}>Rechazar opcionales</button><button type="button" className="cookie-button cookie-button--accept" onClick={() => guardar(opciones)}>Guardar mi elección</button></div>
        </section>
      </div>
    )}
  </>;
}
