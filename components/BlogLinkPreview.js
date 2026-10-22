import { getBlogLinkPreview } from '@/lib/blog-link-preview';

export default function BlogLinkPreview({ href, children, className = '', linkClassName = '' }) {
  const destination = String(href || '').trim();
  let preview;
  try { preview = getBlogLinkPreview(destination); }
  catch { preview = { host: 'Enlace', title: 'Vista previa del enlace', description: destination, favicon: '/favicon.ico', path: destination, external: false }; }
  return <span className={`blog-link-preview ${className}`.trim()}>
    <a className={linkClassName || undefined} href={destination} target={preview.external ? '_blank' : undefined} rel={preview.external ? 'noreferrer' : undefined}>{children}</a>
    <span className="blog-link-preview-card" role="tooltip">
      <span className="blog-link-preview-head"><img src={preview.favicon} alt="" /><span><strong>{preview.title}</strong><small>{preview.host}</small></span><span className="blog-link-preview-actions" aria-hidden="true">▢　↗</span></span>
      <span className="blog-link-preview-description">{preview.description}</span>
    </span>
  </span>;
}
