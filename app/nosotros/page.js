export default function Nosotros() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* HERO */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 px-6 text-center border-b border-gray-700">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Sobre Nosotros</h1>
        <p className="text-gray-300 max-w-2xl mx-auto text-lg">
          Somos una empresa especializada en la importación y comercialización de repuestos para maquinaria pesada en Medellín, Colombia.
        </p>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">

        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">¿Quiénes somos?</h2>
          <p className="text-gray-300 leading-relaxed">
            ParteMaquinas nació con el objetivo de ofrecer soluciones rápidas y confiables para 
            operadores y empresas que dependen de maquinaria pesada. Contamos con más de 391 
            referencias disponibles para excavadoras, cargadores y motores diésel.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">¿Qué ofrecemos?</h2>
          <ul className="text-gray-300 space-y-2">
            <li>✅ Repuestos originales y alternativos</li>
            <li>✅ Disponibilidad inmediata en múltiples referencias</li>
            <li>✅ Envíos a nivel nacional</li>
            <li>✅ Asesoría técnica especializada</li>
            <li>✅ Atención por WhatsApp inmediata</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Marcas que manejamos</h2>
          <div className="flex flex-wrap gap-2">
            {['Mitsubishi','Cummins','Komatsu','Kubota','Sany','Kobelco','Hitachi','Case','Liugong','Doosan','Volvo','Caterpillar','Isuzu','Hino'].map(marca => (
              <span key={marca} className="bg-gray-800 border border-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm">
                {marca}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">¿Por qué elegirnos?</h2>
          <p className="text-gray-300 leading-relaxed">
            Tenemos años de experiencia en el sector y conocemos las necesidades del mercado colombiano. 
            Trabajamos directamente con fabricantes e importadores para garantizar calidad y precios competitivos.
          </p>
        </div>

      </div>
    </main>
  );
}