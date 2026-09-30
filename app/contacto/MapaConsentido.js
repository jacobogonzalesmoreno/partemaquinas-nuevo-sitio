'use client';

import { useState } from 'react';

export default function MapaConsentido({ src, href }) {
  const [cargado, setCargado] = useState(false);
  if (cargado) return <iframe title="Mapa ParteMaquinas" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-[360px] w-full rounded-2xl border-0" allowFullScreen />;
  return <div className="mapa-consentido"><p>El mapa se carga desde Google Maps cuando tú lo solicitas.</p><div><button type="button" onClick={() => setCargado(true)}>Cargar mapa</button><a href={href} target="_blank" rel="noreferrer">Abrir Google Maps</a></div></div>;
}
