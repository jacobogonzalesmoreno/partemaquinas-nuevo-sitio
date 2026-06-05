import Image from 'next/image';
import Link from 'next/link';

export default function Contacto() {
  const asesores = [
    { nombre: 'Asesor comercial 1', telefono: '573163293151', area: 'Cotizaciones y referencias' },
    { nombre: 'Asesor comercial 2', telefono: '573108948217', area: 'Seguimiento de pedidos' },
    { nombre: 'Asesor comercial 3', telefono: '573104526096', area: 'Atencion general y soporte' },
  ];

  const direccion = 'Colombia, Antioquia, Medellin, Carrera 65 #28-27, Barrio trinidad';
  const consultaMapa = 'ParteMaquinas Medellin';
  const mapa = `https://www.google.com/maps?q=${encodeURIComponent(consultaMapa)}&z=17&output=embed`;
  const rutaGoogleMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consultaMapa)}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="flex flex-col gap-6 reveal-up">
            <p className="text-xs uppercase tracking-[0.4em] text-orange-500 font-semibold">Contacto</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Contacta a ParteMaquinas y recibe asesoria para ubicar tu repuesto.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
              Atendemos consultas comerciales, validacion de referencias, seguimiento de pedidos y soporte general desde Medellin para clientes de toda Colombia.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="reveal-up stagger-1 border-l-2 border-orange-400 pl-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400 font-semibold">Ciudad base</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Medellin</p>
              </div>
              <div className="reveal-up stagger-2 border-l-2 border-orange-400 pl-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400 font-semibold">Canal principal</p>
                <p className="mt-2 text-lg font-bold text-slate-900">WhatsApp</p>
              </div>
              <div className="reveal-up stagger-3 border-l-2 border-orange-400 pl-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400 font-semibold">Cobertura</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Toda Colombia</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/productos"
                className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
              >
                Ver catalogo
              </Link>
              <a
                href={rutaGoogleMaps}
                target="_blank"
                rel="noreferrer"
                className="btn-anim inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-6 py-3 transition-colors"
              >
                Abrir en Google Maps
              </a>
            </div>
          </div>

          <div className="reveal-up stagger-1 flex flex-col gap-5 pt-1">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-500 font-semibold">Atencion directa</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Estamos disponibles para ayudarte a cotizar mejor</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Si ya tienes referencia, foto o descripcion de la pieza, nuestro equipo puede ayudarte a revisar opciones y disponibilidad con mayor rapidez.
              </p>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Asesoria para validar referencias y compatibilidades antes de comprar.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Seguimiento comercial sobre disponibilidad, tiempos y despacho.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Atencion enfocada en maquinaria pesada y repuestos de alta rotacion.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="reveal-up">
          <p className="text-xs uppercase tracking-[0.32em] text-orange-500 font-semibold">Habla con un asesor</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Canales de atencion</h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Elige el canal que mejor se adapte a tu necesidad. Podemos ayudarte con cotizaciones, revision de referencias y seguimiento comercial.
          </p>
          <div className="mt-8 flex flex-col gap-4">
            {asesores.map((asesor, index) => {
              const url = 'https://api.whatsapp.com/send?phone=' + asesor.telefono + '&text=' + encodeURIComponent('Hola, necesito informacion sobre repuestos para maquinaria pesada');
              return (
                <a
                  key={asesor.telefono}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={`reveal-up stagger-${index + 1} flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-400 px-6 py-5 shadow-sm hover:shadow-md transition-all`}
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={34} height={34} />
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-900 font-semibold">{asesor.nombre}</p>
                    <p className="text-slate-500 text-sm mt-1">{asesor.area}</p>
                    <p className="text-emerald-600 text-sm font-semibold mt-1">+{asesor.telefono}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">WhatsApp</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="reveal-up stagger-1 border-t border-slate-200 pt-8">
            <p className="text-xs uppercase tracking-[0.32em] text-orange-500 font-semibold">Informacion</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Ubicacion y horario</h2>
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400 font-semibold">Direccion</p>
                <p className="mt-2 text-slate-700 leading-relaxed">{direccion}</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400 font-semibold">Horario de atencion</p>
                <p className="mt-2 text-slate-700">Lunes a viernes: 8:30 a.m. - 5:30 p.m.</p>
                <p className="text-slate-700">Sabados: 9:00 a.m. - 1:00 p.m.</p>
                <p className="text-slate-700">Domingos: cerrado.</p>
                <p className="text-slate-700">Festivos: cerrado.</p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400 font-semibold">Cobertura</p>
                <p className="mt-2 text-slate-700">Atencion en Medellin y envios a todo Colombia.</p>
              </div>
            </div>
          </div>

          <div className="reveal-up stagger-2 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm overflow-hidden">
            <iframe
              title="Mapa ParteMaquinas"
              src={mapa}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[360px] w-full rounded-2xl border-0"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 reveal-up">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Prefieres iniciar por catalogo?</h3>
            <p className="text-slate-600 mt-2">Explora referencias activas y luego contactanos con la pieza que necesitas.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/productos"
              className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
            >
              Ir a productos
            </Link>
            <a
              href={rutaGoogleMaps}
              target="_blank"
              rel="noreferrer"
              className="btn-anim inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 transition-colors"
            >
              Ver ubicacion
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}