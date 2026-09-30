import Link from 'next/link';
import { notFound } from 'next/navigation';
import { POLITICAS_LEGALES } from '@/lib/politicas-legales';

export function generateStaticParams() {
  return Object.keys(POLITICAS_LEGALES).map(legal => ({ legal }));
}

export async function generateMetadata({ params }) {
  const { legal } = await params;
  const politica = POLITICAS_LEGALES[legal];
  return politica ? { title: `${politica.titulo} | ParteMaquinas`, description: politica.introduccion } : {};
}

export default async function PaginaLegal({ params }) {
  const { legal } = await params;
  const politica = POLITICAS_LEGALES[legal];
  if (!politica) notFound();

  return (
    <main className="legal-page">
      <article className="legal-document">
        <Link className="legal-back" href="/">← Volver al inicio</Link>
        <p className="legal-eyebrow">ParteMaquinas · Colombia</p>
        <h1>{politica.titulo}</h1>
        <p className="legal-updated">Última actualización: {politica.actualizado}</p>
        <p className="legal-intro">{politica.introduccion}</p>
        {politica.secciones.map(seccion => (
          <section key={seccion.titulo}>
            <h2>{seccion.titulo}</h2>
            {seccion.parrafos.map((parrafo, index) => <p key={index}>{parrafo}</p>)}
          </section>
        ))}
        <div className="legal-document__contact"><strong>Contacto:</strong> <a href="https://wa.me/573163293151">WhatsApp +57 316 329 3151</a> · Carrera 65 #28-27, barrio Trinidad, Medellín, Antioquia.</div>
      </article>
    </main>
  );
}
