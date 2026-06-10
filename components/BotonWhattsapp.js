import Image from 'next/image';

export default function BotonWhatsapp() {
  const mensaje = encodeURIComponent('Hola, necesito información sobre repuestos');
  const url = 'https://api.whatsapp.com/send?phone=573163293151&text=' + mensaje;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-white text-emerald-700 border border-emerald-400 hover:border-emerald-500 hover:text-emerald-800 px-4 py-3 rounded-full shadow-lg transition-all hover:scale-105">
        <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={34} height={34} />
        <span className="text-sm font-semibold">Asesor Comercial</span>
      </a>
    </div>
  );
}