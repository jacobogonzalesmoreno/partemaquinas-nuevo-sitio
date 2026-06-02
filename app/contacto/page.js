import Image from 'next/image';

export default function Contacto() {
  const asesores = [
    { nombre: 'Asesor 1', telefono: '573163293151' },
    { nombre: 'Asesor 2', telefono: '573108948217' },
    { nombre: 'Asesor 3', telefono: '573104526096' },
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* HERO */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 px-6 text-center border-b border-gray-700">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Contáctanos</h1>
        <p className="text-gray-300 max-w-xl mx-auto text-lg">
          Estamos listos para ayudarte a encontrar el repuesto que necesitas.
        </p>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* WHATSAPP */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Habla con un asesor</h2>
          <div className="flex flex-col gap-4">
            {asesores.map(asesor => {
              const url = 'https://api.whatsapp.com/send?phone=' + asesor.telefono + '&text=' + encodeURIComponent('Hola, necesito información sobre repuestos');
              return (
                <a key={asesor.telefono} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-4 bg-gray-800 border border-gray-700 hover:border-green-500 px-6 py-4 rounded-xl transition-all">
                  <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={40} height={40} />
                  <div>
                    <p className="text-white font-semibold">{asesor.nombre}</p>
                    <p className="text-gray-400 text-sm">+{asesor.telefono}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* INFO */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Información</h2>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-white font-semibold">Ubicación</p>
                <p className="text-gray-400">Medellín, Antioquia, Colombia</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🕐</span>
              <div>
                <p className="text-white font-semibold">Horario de atención</p>
                <p className="text-gray-400">Lunes a Viernes: 8am - 6pm</p>
                <p className="text-gray-400">Sábados: 8am - 1pm</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-2xl">🚚</span>
              <div>
                <p className="text-white font-semibold">Envíos</p>
                <p className="text-gray-400">A todo Colombia</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}