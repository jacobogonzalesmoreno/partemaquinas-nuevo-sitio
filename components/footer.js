import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <Image
              src="/logo/ba818650-f622-4ea7-b90f-594d83a9ff20.png"
              alt="ParteMaquinas"
              width={34}
              height={34}
            />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">ParteMaquinas</h3>
            <p className="text-slate-400 text-sm">Repuestos para maquinaria pesada · Medellin, Colombia</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold">
          <a href="https://api.whatsapp.com/send?phone=573163293151" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-emerald-300 transition-colors">
            <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={28} height={28} />
            Asesor 1
          </a>
          <a href="https://api.whatsapp.com/send?phone=573108948217" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-emerald-300 transition-colors">
            <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={28} height={28} />
            Asesor 2
          </a>
          <a href="https://api.whatsapp.com/send?phone=573104526096" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-slate-300 hover:text-emerald-300 transition-colors">
            <Image src="/logo/Logo-WhatsApp.png" alt="WhatsApp" width={28} height={28} />
            Asesor 3
          </a>
        </div>
        <p className="text-slate-500 text-xs">© 2026 ParteMaquinas. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}