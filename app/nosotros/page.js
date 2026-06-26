import Link from 'next/link';

const fortalezas = [
  {
    titulo: 'Atencion comercial cercana',
    descripcion: 'Respondemos con contexto tecnico y comercial para que cada cotizacion parta de una necesidad real y no de una aproximacion.',
  },
  {
    titulo: 'Inventario orientado al sector',
    descripcion: 'Nos enfocamos en piezas que realmente tienen rotacion en excavadoras, cargadores, motores diesel y equipos industriales.',
  },
  {
    titulo: 'Soporte para compra correcta',
    descripcion: 'Acompanamos la validacion de referencias, marcas y compatibilidades para reducir errores y tiempos muertos en taller.',
  },
  {
    titulo: 'Cobertura operativa',
    descripcion: 'Atendemos clientes en Medellin y gestionamos despachos a nivel nacional con seguimiento comercial constante.',
  },
];

const historia = [
  {
    titulo: 'Como empezamos',
    descripcion: 'ParteMaquinas surge desde la experiencia directa en el mercado de repuestos para maquinaria pesada, entendiendo que una maquina detenida exige respuestas rapidas, claras y confiables.',
  },
  {
    titulo: 'Como trabajamos hoy',
    descripcion: 'Combinamos importacion, comercializacion y asesoria para ofrecer repuestos originales y alternativos con enfoque practico en disponibilidad, compatibilidad y tiempos de entrega.',
  },
  {
    titulo: 'Lo que buscamos',
    descripcion: 'Queremos que cada cliente encuentre una solucion util para su operacion: menos incertidumbre, mejor orientacion y una compra respaldada por experiencia real.',
  },
];

const marcas = [
  'Mitsubishi',
  'Cummins',
  'Komatsu',
  'Kubota',
  'SANY',
  'Kobelco',
  'Hitachi',
  'Case',
  'LiuGong',
  'Doosan',
  'Volvo',
  'Caterpillar',
  'Isuzu',
  'Hino',
];

const beneficios = [
  'Repuestos originales y alternativos',
  'Disponibilidad inmediata en referencias clave',
  'Envios coordinados con seguimiento',
  'Asesoria tecnica especializada',
  'Atencion comercial por WhatsApp',
  'Soporte para excavadoras, cargadores y motores diesel',
];

const pilares = [
  {
    titulo: 'Confianza',
    descripcion: 'Comunicacion directa, informacion clara y una orientacion comercial enfocada en resolver.',
  },
  {
    titulo: 'Rapidez',
    descripcion: 'Entendemos la urgencia operativa de nuestros clientes y priorizamos respuestas oportunas.',
  },
  {
    titulo: 'Conocimiento',
    descripcion: 'Aportamos criterio tecnico y experiencia de mercado al proceso de cotizacion.',
  },
];

export default function Nosotros() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-white border-b border-slate-200 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:py-20 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="flex flex-col gap-6 reveal-up">
            <p className="text-xs uppercase tracking-[0.4em] text-orange-500 font-semibold">Nosotros</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              Una empresa construida para ayudar a que la maquinaria siga operando.
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
              ParteMaquinas es una empresa especializada en importacion y comercializacion de repuestos para maquinaria pesada en Medellin. Nuestro trabajo consiste en unir inventario util, asesoria tecnica y atencion rapida para que talleres, operadores y empresas puedan tomar decisiones con mayor seguridad.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="reveal-up stagger-1 border-l-2 border-orange-400 pl-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400 font-semibold">Especialidad</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Repuestos</p>
              </div>
              <div className="reveal-up stagger-2 border-l-2 border-orange-400 pl-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400 font-semibold">Base</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Medellin</p>
              </div>
              <div className="reveal-up stagger-3 border-l-2 border-orange-400 pl-4">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400 font-semibold">Enfoque</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Asesoria real</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/productos"
                className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
              >
                Ver catalogo
              </Link>
              <Link
                href="/contacto"
                className="btn-anim inline-flex items-center justify-center rounded-xl border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 font-semibold px-6 py-3 transition-colors"
              >
                Hablar con un asesor
              </Link>
            </div>
          </div>

          <div className="reveal-up stagger-1 flex flex-col gap-5 pt-1">
            <div className="border-b border-slate-200 pb-5">
              <p className="text-sm uppercase tracking-[0.22em] text-orange-500 font-semibold">ParteMaquinas</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Más que vender, orientamos cada compra</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Sabemos que el valor de un proveedor no esta solo en tener una pieza disponible, sino en ayudar a confirmar que esa pieza realmente resuelve la necesidad del cliente.
              </p>
            </div>
            <ul className="space-y-4 text-slate-700">
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Experiencia comercial aplicada al sector de maquinaria pesada.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Catalogo pensado para necesidades frecuentes y urgencias operativas.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span>Acompanamiento tecnico y comercial durante el proceso de compra.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {fortalezas.map((fortaleza, index) => (
          <article
            key={fortaleza.titulo}
            className={`reveal-up stagger-${index + 1} rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-orange-300 transition-all`}
          >
            <p className="text-sm uppercase tracking-[0.22em] text-orange-500 font-semibold">Fortaleza</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">{fortaleza.titulo}</h2>
            <p className="mt-3 text-slate-600 leading-relaxed">{fortaleza.descripcion}</p>
          </article>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] items-start">
          <div className="reveal-up">
            <p className="text-xs uppercase tracking-[0.35em] text-orange-500 font-semibold">Quienes somos</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 accent-underline">Conocimiento de producto, experiencia comercial y compromiso con la operacion</h2>
            <p className="mt-6 text-slate-600 leading-relaxed text-lg">
              Nuestra empresa esta enfocada en repuestos para maquinaria pesada porque entendemos lo que significa una detencion operativa. Cada consulta representa una urgencia distinta y por eso damos prioridad a la claridad tecnica, la velocidad de respuesta y la seriedad comercial.
            </p>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Trabajamos con referencias originales y alternativas seleccionadas, construyendo un catalogo pensado para resolver necesidades frecuentes del mercado colombiano sin perder el enfoque en calidad, compatibilidad y respaldo.
            </p>
          </div>

          <div className="reveal-up stagger-2 brand-grid p-6 border border-slate-200 bg-white shadow-sm">
            <p className="brand-pill">Marcas atendidas</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {marcas.map(marca => (
                <span
                  key={marca}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  {marca}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200">
        <div className="grid gap-6 md:grid-cols-3">
          {historia.map((bloque, index) => (
            <article
              key={bloque.titulo}
              className={`reveal-up stagger-${index + 1} rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-orange-300 hover:shadow-md transition-all`}
            >
              <p className="text-sm uppercase tracking-[0.24em] text-orange-500 font-semibold">Empresa</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{bloque.titulo}</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">{bloque.descripcion}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14 border-t border-slate-200">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-start">
          <div className="reveal-up">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-500 font-semibold">Que ofrecemos</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Lo que un cliente puede esperar de nosotros</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Queremos que el proceso comercial sea claro desde el inicio: entender la necesidad, revisar compatibilidades, proponer opciones viables y acompanar la compra hasta el despacho.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {beneficios.map((beneficio, index) => (
              <div
                key={beneficio}
                className={`reveal-up stagger-${(index % 4) + 1} benefit-card shadow-sm hover:shadow-md hover:border-orange-300 transition-all`}
              >
                <p className="text-sm font-semibold text-slate-900">{beneficio}</p>
                <p className="text-sm text-slate-600">Atencion clara, tiempos rapidos y enfoque comercial sobre lo que realmente necesitas.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="reveal-up max-w-2xl">
            <p className="text-xs uppercase tracking-[0.32em] text-orange-500 font-semibold">Nuestros pilares</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">La forma en que trabajamos todos los dias</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {pilares.map((pilar, index) => (
              <div
                key={pilar.titulo}
                className={`reveal-up stagger-${index + 1} rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm`}
              >
                <h3 className="text-xl font-bold text-slate-900">{pilar.titulo}</h3>
                <p className="mt-3 text-slate-600 leading-relaxed">{pilar.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 reveal-up">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Quieres cotizar con nuestro equipo?</h3>
            <p className="text-slate-600 mt-2">Te ayudamos a ubicar la referencia correcta y validar compatibilidades antes de comprar.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/productos"
              className="btn-anim inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 transition-colors"
            >
              Explorar productos
            </Link>
            <Link
              href="/contacto"
              className="btn-anim inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 transition-colors"
            >
              Contactar ahora
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}