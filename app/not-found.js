import Link from 'next/link';

export const metadata = {
  title: 'Página no encontrada | ParteMáquinas',
  description: 'No encontramos esta página. Explora nuestro catálogo de repuestos para maquinaria pesada o contáctanos para recibir ayuda.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <main className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-6 py-20 text-center"><p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-600">Error 404</p><h1 className="mt-4 text-4xl font-bold text-slate-900">No encontramos esa página</h1><p className="mt-4 max-w-xl text-slate-600">Es posible que el enlace haya cambiado. Puedes volver al inicio o buscar el repuesto que necesitas.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white" href="/">Ir al inicio</Link><Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-800" href="/productos">Explorar productos</Link><Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-800" href="/contacto">Contactar</Link></div></main>;
}
