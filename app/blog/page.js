import Link from 'next/link';
import db from '@/lib/db';
import { ensureBlogTable } from '@/lib/blog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog de maquinaria pesada | ParteMáquinas', description: 'Artículos, guías y consejos técnicos sobre maquinaria pesada, excavadoras, motores diésel y sus repuestos.', alternates: { canonical: '/blog' } };

export default async function BlogPage() {
  let articles = [];
  try {
    await ensureBlogTable();
    const [rows] = await db.query("SELECT titulo, slug, resumen, imagen_portada, publicado_en FROM articulos_blog WHERE estado = 'publicado' AND publicado_en <= NOW() ORDER BY publicado_en DESC");
    articles = rows;
  } catch (error) {
    console.error('Blog page error:', error?.name || 'unknown');
  }
  return <main className="blog-page">
    <section className="blog-hero"><span>CONOCIMIENTO QUE MANTIENE TU EQUIPO EN MARCHA</span><h1>Blog de maquinaria pesada</h1><p>Guías prácticas, información técnica y novedades para quienes trabajan con maquinaria pesada. Nuevos artículos cada semana.</p></section>
    <section className="blog-grid-wrap"><div className="blog-grid-heading"><h2>Artículos</h2><p>{articles.length} {articles.length === 1 ? 'publicación' : 'publicaciones'}</p></div>
      {articles.length ? <div className="blog-grid">{articles.map(article => <Link href={`/blog/${article.slug}`} className="blog-card" key={article.slug}>
        {article.imagen_portada ? <img src={article.imagen_portada} alt="" loading="lazy" /> : <div className="blog-card-placeholder">ParteMáquinas</div>}
        <div className="blog-card-body"><time>{new Date(article.publicado_en).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</time><h3>{article.titulo}</h3><p>{article.resumen}</p><span>Leer artículo <b>→</b></span></div>
      </Link>)}</div> : <div className="blog-empty"><h2>Próximamente</h2><p>Estamos preparando guías y artículos técnicos para este espacio.</p></div>}
    </section>
  </main>;
}
