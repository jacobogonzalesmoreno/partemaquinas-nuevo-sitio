import { notFound } from 'next/navigation';
import Link from 'next/link';
import db from '@/lib/db';
import { ensureBlogTable } from '@/lib/blog';
import BlogContent from '@/components/BlogContent';

export const dynamic = 'force-dynamic';

async function getArticle(slug) {
  await ensureBlogTable();
  const [rows] = await db.execute("SELECT titulo, slug, resumen, imagen_portada, contenido, publicado_en FROM articulos_blog WHERE slug = ? AND estado = 'publicado' AND publicado_en <= NOW() LIMIT 1", [slug]);
  if (!rows.length) return null;
  return { ...rows[0], contenido: JSON.parse(rows[0].contenido || '[]') };
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const article = await getArticle(slug);
    if (!article) return { title: 'Artículo no encontrado | ParteMáquinas' };
    return { title: `${article.titulo} | Blog ParteMáquinas`, description: article.resumen, alternates: { canonical: `/blog/${article.slug}` }, openGraph: { type: 'article', title: article.titulo, description: article.resumen, images: article.imagen_portada ? [article.imagen_portada] : [] } };
  } catch { return { title: 'Blog de maquinaria pesada | ParteMáquinas' }; }
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  let article;
  try { article = await getArticle(slug); } catch { notFound(); }
  if (!article) notFound();
  return <main className="blog-article-page">
    <div className="blog-article-shell"><Link href="/blog" className="blog-back">← Volver al blog</Link>
      <article><header className="blog-article-header"><time>{new Date(article.publicado_en).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</time><h1>{article.titulo}</h1><p>{article.resumen}</p></header>
        {article.imagen_portada && <img className="blog-cover" src={article.imagen_portada} alt={article.titulo} />}
        <BlogContent blocks={article.contenido} />
      </article>
    </div>
  </main>;
}
