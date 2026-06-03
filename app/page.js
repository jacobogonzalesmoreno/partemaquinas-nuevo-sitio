'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-white border-b border-slate-200">
        <div className="py-6">
          <div className="w-full">
            <Image
              src="/banners/ChatGPT%20Image%203%20jun%202026,%2001_09_04%20a.m..png"
              alt="Banner principal"
              width={2172}
              height={419}
              sizes="100vw"
              className="w-full h-auto border-y border-slate-200"
              priority
            />
          </div>
        </div>
      </section>

      {/* HERO */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
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
  );
}