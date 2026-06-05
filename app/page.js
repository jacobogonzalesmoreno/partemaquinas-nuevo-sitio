'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
export default function Home() {
  const [menuLateralAbierto, setMenuLateralAbierto] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const asideRef = useRef(null);

  useEffect(() => {
    if (!menuLateralAbierto) return;
    const handleClickOutside = (e) => {
      if (asideRef.current && !asideRef.current.contains(e.target)) {
        setMenuLateralAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuLateralAbierto]);

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
    {
      imagen: '/sellos/garantias.png',
      icono: '🛡️',
      titulo: 'Garantía 30 días',
      descripcion: 'Cobertura por falla de fabrica en nuestros equipos.',
    },
    {
      icono: '🔧',
      titulo: 'Garantía 60 días',
      descripcion: 'Si tu excavadora presenta fallas, asumimos los costos y te brindamos los repuestos necesarios.',
    },
    {
      icono: '🚚',
      titulo: 'Envíos Colombia, Ecuador y Venezuela',
      descripcion: 'Enviamos a todo Colombia y en casos especiales a Ecuador y Venezuela.',
    },
    {
      icono: '💬',
      titulo: 'Somos una solución',
      descripcion: 'Ayudamos y vendemos. Asesoría técnica especializada por WhatsApp.',
    },
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
    { nombre: 'Rectificadora H&M', url: 'https://wa.me/573146820296', externo: true },
    { nombre: 'JMM Hidraulicos', url: 'https://www.jmmhidraulicos.com/', externo: true },
  ];

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-white border-b border-slate-200">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <Image
            src="/banners/ChatGPT%20Image%204%20jun%202026,%2010_33_29%20p.m..png"
            alt="Banner principal"
            width={1600}
            height={420}
            className="w-full h-auto rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-300/30"
            priority
          />
        </div>
      </section>

      {/* HERO */}
      <section className="relative bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-12">
          <aside ref={asideRef} className="fixed left-0 top-40 z-30 flex flex-col gap-4 items-start w-[min(280px,calc(100vw-1rem))] max-h-[calc(100vh-3rem)] overflow-y-auto self-start">
            <div className="relative"
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
            >
              <button
                type="button"
                onClick={() => setMenuLateralAbierto(valor => !valor)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 border-yellow-400 bg-white shadow-md hover:bg-yellow-50 transition-all"
                aria-label="Manuales, aliados y técnicos"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              {tooltipVisible && (
                <div className="absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none" style={{animation: 'fadeIn 150ms ease-out'}}>
                  Manuales, aliados y técnicos
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>

            {menuLateralAbierto && (
              <div className="w-full flex flex-col gap-4" style={{animation: "slideDown 200ms ease-out"}}>
                <div className="rounded-3xl border-2 border-yellow-400 bg-white shadow-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-yellow-200 bg-yellow-50">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-900 font-semibold">Manuales por marca</p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {manualesPorMarca.map(item => (
                      <Link
                        key={item.nombre}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:border-yellow-400 hover:bg-yellow-50 transition-all"
                      >
                        <span>{item.nombre}</span>
                        <span className="text-yellow-500 group-hover:translate-x-0.5 transition-transform">›</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border-2 border-yellow-400 bg-white shadow-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-yellow-200 bg-yellow-50">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-900 font-semibold">Mecánicos</p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {mecanicos.map(item => (
                      <a
                        key={item.nombre}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 hover:border-yellow-400 hover:bg-yellow-50 transition-all"
                      >
                        <span className="flex flex-col">
                          <span className="font-semibold">{item.nombre}</span>
                          <span className="text-xs text-slate-500">{item.especialidad}</span>
                        </span>
                        <span className="text-xs text-green-600 font-medium group-hover:translate-x-0.5 transition-transform">{item.tel}</span>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border-2 border-yellow-400 bg-white shadow-lg overflow-hidden">
                  <div className="px-5 py-4 border-b border-yellow-200 bg-yellow-50">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-900 font-semibold">Aliados</p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {aliados.map(item => (
                      <Link
                        key={item.nombre}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 hover:border-yellow-400 hover:bg-yellow-50 transition-all"
                      >
                        <span>{item.nombre}</span>
                        <span className="text-yellow-500 group-hover:translate-x-0.5 transition-transform">›</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="flex flex-col gap-6">
              <p className="text-xs uppercase tracking-[0.4em] text-orange-500 font-semibold">ParteMaquinas</p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
                Somos una solución: Ayudamos y vendemos
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed">
                Catalogo especializado con asesoria rapida para excavadoras, cargadores y equipos industriales.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/productos"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
                >
                  Ver catalogo
                </Link>
                <Link
                  href="/contacto"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-6 py-3 transition-colors"
                >
                  <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={30} height={30} />
                  Hablar con un asesor
                </Link>
              </div>
            </div>
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl shadow-slate-300/40">
              <p className="text-sm uppercase tracking-[0.2em] text-orange-300">Cobertura nacional</p>
              <h2 className="text-2xl font-semibold mt-3">Cotiza en minutos</h2>
              <p className="text-slate-200 mt-3 leading-relaxed">
                Gestionamos repuestos originales y alternativos con trazabilidad clara y envio seguro.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-orange-300 font-semibold">+390</p>
                  <p className="text-slate-200">Referencias activas</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-orange-300 font-semibold">24/7</p>
                  <p className="text-slate-200">Atencion WhatsApp</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SELLOS */}
      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col gap-2 mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Nuestro respaldo</h2>
          <p className="text-slate-600">Garantía real, envíos seguros y soporte experto en cada compra.</p>
        </div>
        <div className="w-full mb-8">
          <Image
            src="/sellos/ChatGPT%20Image%202%20jun%202026,%2006_49_53%20p.m..png"
            alt="Sellos de garantia"
            width={1600}
            height={420}
            className="w-full h-auto rounded-2xl border border-slate-200"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sellos.map(sello => (
            <div
              key={sello.titulo}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col gap-3"
            >
              <p className="text-sm font-bold text-slate-900 sr-only">{sello.titulo}</p>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{sello.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MARCAS */}
      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Marcas principales</h2>
            <p className="text-slate-600">Selecciona tu marca y encuentra el repuesto ideal.</p>
          </div>
          <Link href="/productos" className="text-orange-500 font-semibold">Ir al catalogo →</Link>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {marcas.map(marca => (
            <Link
              key={marca.nombre}
              href={`/productos?buscar=${encodeURIComponent(marca.buscar)}`}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-semibold text-slate-700 shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
            >
              <div className="h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                <Image
                  src={`/marcas/${marca.archivo}`}
                  alt={marca.nombre}
                  width={120}
                  height={64}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
              <p className="mt-3">{marca.nombre}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Listo para cotizar?</h3>
            <p className="text-slate-600">Recibe respuesta rapida con un asesor experto.</p>
          </div>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 transition-colors"
          >
            Contactar ahora
          </Link>
        </div>
      </section>
    </main>
    </>
  );
}