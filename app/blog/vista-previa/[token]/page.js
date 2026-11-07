import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPreviewByToken } from '@/lib/blog';
import BlogContent from '@/components/BlogContent';
import BlogImageZoom from '@/components/BlogImageZoom';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Vista previa de artículo | Blog ParteMáquinas',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function BlogPreviewPage({ params }) {
  const { token } = await params;
  let article;
  try { article = await getBlogPreviewByToken(token); } catch { notFound(); }
  if (!article) notFound();
  return <main className="blog-article-page blog-preview-page blog-preview-page--arial12">
    <div className="blog-article-shell">
      <div className="blog-preview-banner"><span>VISTA PREVIA PARA REVISIÓN</span><p>Este artículo todavía no está publicado. Comparte este enlace solo con las personas que deben revisarlo.</p></div>
      <Link href="/blog" className="blog-back">← Ir al blog</Link>
      <article>
        <header className="blog-article-header"><time>Borrador · Vista previa</time><h1>{article.titulo}</h1></header>
        <section className="blog-article-intro"><div className="blog-article-summary"><span>RESUMEN DEL ARTÍCULO</span><p>{article.resumen || 'Este borrador todavía no tiene un resumen.'}</p></div>{article.imagen_portada && <BlogImageZoom className="blog-cover" src={article.imagen_portada} alt={article.slug.includes('tren-de-rodaje') ? 'Excavadora completa con detalle ampliado del tren de rodaje' : 'Excavadora con indicador de la placa donde se encuentra el número de serie o PIN'} />}</section>
        <BlogContent blocks={article.contenido} />
      </article>
    </div>
  </main>;
}
