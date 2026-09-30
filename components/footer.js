import Image from 'next/image';
import Link from 'next/link';
import CookieSettingsButton from './CookieSettingsButton';

export default function Footer() {
  return (
    <footer className="site-footer bg-slate-900 text-slate-200 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-none bg-[#1b1b1d] border border-[#38383a] flex items-center justify-center overflow-hidden">
            <Image
              src="/logo/logo-partemaquinas-oficial.jpeg"
              alt="ParteMaquinas"
              width={42}
              height={42}
              className="object-contain"
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
            Asesor Comercial
          </a>
        </div>
        <p className="text-slate-500 text-xs">© 2026 ParteMaquinas. Todos los derechos reservados.</p>
      </div>
      <nav className="footer-legal-links max-w-6xl mx-auto mt-7 pt-5 border-t border-slate-700" aria-label="Políticas y condiciones">
        <Link href="/politica-datos">Tratamiento de datos</Link>
        <Link href="/terminos-y-condiciones">Términos y condiciones</Link>
        <Link href="/politica-cookies">Política de cookies</Link>
        <Link href="/derecho-retracto">Derecho de retracto</Link>
        <a href="https://www.sic.gov.co/" target="_blank" rel="noreferrer">SIC · Protección al consumidor</a>
        <CookieSettingsButton />
      </nav>
    </footer>
  );
}
