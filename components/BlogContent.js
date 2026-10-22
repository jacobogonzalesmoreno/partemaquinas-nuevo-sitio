import BlogLinkPreview from '@/components/BlogLinkPreview';

function isPdfUrl(value) {
  try { return /\.pdf$/i.test(new URL(value).pathname); } catch { return false; }
}

function pdfLabel(value) {
  return String(value || '').replace(/^(?:📄\s*)+/, '').replace(/(?:\s*↗)+$/, '').trim() || 'Abrir documento PDF';
}

function PdfLink({ href, children }) {
  return <a className="blog-file" href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function renderText(node, key) {
  let value = node.text || '';
  for (const [index, mark] of (node.marks || []).entries()) {
    const markKey = `${key}-mark-${index}`;
    if (mark.type === 'bold') value = <strong key={markKey}>{value}</strong>;
    else if (mark.type === 'italic') value = <em key={markKey}>{value}</em>;
    else if (mark.type === 'underline') value = <u key={markKey}>{value}</u>;
    else if (mark.type === 'strike') value = <s key={markKey}>{value}</s>;
    else if (mark.type === 'link') value = <BlogLinkPreview key={markKey} className="blog-inline-link-preview" linkClassName="blog-inline-link" href={mark.attrs.href}>{value}</BlogLinkPreview>;
    else if (mark.type === 'color') value = <span key={markKey} style={{ color: mark.attrs.color }}>{value}</span>;
    else if (mark.type === 'highlight') value = <mark key={markKey} style={{ backgroundColor: mark.attrs.color }}>{value}</mark>;
    else if (mark.type === 'fontSize') value = <span key={markKey} style={{ fontSize: ({ small: '10pt', normal: '12pt', large: '16pt', huge: '20pt' })[mark.attrs.size] || '12pt' }}>{value}</span>;
    else if (mark.type === 'fontFamily') value = <span key={markKey} style={{ fontFamily: mark.attrs.family }}>{value}</span>;
  }
  return <span key={key}>{value}</span>;
}

function renderNode(node, key) {
  if (!node) return null;
  if (node.type === 'text') return renderText(node, key);
  const children = (node.content || []).map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.type === 'doc') return <>{children}</>;
  if (node.type === 'paragraph') return <p key={key} style={node.attrs?.align ? { textAlign: node.attrs.align } : undefined}>{children}</p>;
  if (node.type === 'heading') {
    const level = [1, 2, 3].includes(Number(node.attrs?.level)) ? Number(node.attrs.level) : 2;
    const style = node.attrs?.align ? { textAlign: node.attrs.align } : undefined;
    if (level === 1) return <h1 key={key} style={style}>{children}</h1>;
    if (level === 3) return <h3 key={key} style={style}>{children}</h3>;
    return <h2 key={key} style={style}>{children}</h2>;
  }
  if (node.type === 'bulletList') return <ul key={key}>{children}</ul>;
  if (node.type === 'orderedList') return <ol key={key}>{children}</ol>;
  if (node.type === 'listItem') return <li key={key}>{children}</li>;
  if (node.type === 'blockquote') return <blockquote key={key}>{children}</blockquote>;
  if (node.type === 'hardBreak') return <br key={key} />;
  if (node.type === 'horizontalRule') return <hr key={key} />;
  if (node.type === 'pageBreak') return <hr key={key} className="blog-page-break" />;
  const mediaStyle = { width: `${node.attrs?.width || 100}%`, marginLeft: node.attrs?.align === 'left' ? 0 : 'auto', marginRight: node.attrs?.align === 'right' ? 0 : 'auto' };
  if (node.type === 'image') return <figure key={key} style={mediaStyle}><img src={node.attrs.src} alt={node.attrs.alt || ''} loading="lazy" />{node.attrs.title && <figcaption>{node.attrs.title}</figcaption>}</figure>;
  if (node.type === 'video' && isPdfUrl(node.attrs.src)) return <figure key={key} className="blog-pdf" style={mediaStyle}><PdfLink href={node.attrs.src}>📄 {pdfLabel(node.attrs.title)} <span>↗</span></PdfLink></figure>;
  if (node.type === 'video') return <figure key={key} style={mediaStyle}><div className="blog-video">{node.attrs.src.includes('/video/upload/') ? <video src={node.attrs.src} title={node.attrs.title || 'Video del artículo'} controls preload="metadata" /> : <iframe src={node.attrs.src} title={node.attrs.title || 'Video del artículo'} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}</div>{node.attrs.title && <figcaption>{node.attrs.title}</figcaption>}</figure>;
  if (node.type === 'pdf') return <figure key={key} className="blog-pdf" style={mediaStyle}><PdfLink href={node.attrs.src || node.attrs.href}>📄 {pdfLabel(node.attrs.label || node.attrs.title)} <span>↗</span></PdfLink></figure>;
  if (node.type === 'button') return <p key={key} className="blog-cta"><BlogLinkPreview href={node.attrs.href}>{node.attrs.label || 'Más información'} <span>→</span></BlogLinkPreview></p>;
  return children;
}

function renderLegacy(blocks) {
  return blocks.map((block, index) => {
    const key = `${block.type}-${index}`;
    if (block.type === 'heading') return <h2 key={key}>{block.text}</h2>;
    if (block.type === 'list') return <ul key={key}>{String(block.text || '').split('\n').filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}</ul>;
    if (block.type === 'image') return <figure key={key}><img src={block.url} alt={block.text || block.caption || ''} loading="lazy" />{(block.text || block.caption) && <figcaption>{block.text || block.caption}</figcaption>}</figure>;
    if (block.type === 'video' && isPdfUrl(block.url)) return <PdfLink key={key} href={block.url}>📄 {pdfLabel(block.text)} <span>↗</span></PdfLink>;
    if (block.type === 'video') return <figure key={key}><div className="blog-video">{block.url.includes('/video/upload/') ? <video src={block.url} title={block.text || 'Video del artículo'} controls preload="metadata" /> : <iframe src={block.url} title={block.text || 'Video del artículo'} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />}</div>{block.text && <figcaption>{block.text}</figcaption>}</figure>;
    if (block.type === 'pdf') return <PdfLink key={key} href={block.url}>📄 {pdfLabel(block.text)} <span>↗</span></PdfLink>;
    if (block.type === 'button') return <p key={key} className="blog-cta"><BlogLinkPreview href={block.url}>{block.text || 'Más información'} <span>→</span></BlogLinkPreview></p>;
    if (block.type === 'link') return <p key={key}><BlogLinkPreview className="blog-inline-link" href={block.url}>{block.text || block.url}</BlogLinkPreview></p>;
    return <p key={key}>{block.text}</p>;
  });
}

export default function BlogContent({ blocks = [] }) {
  return <div className="blog-prose">{Array.isArray(blocks) ? renderLegacy(blocks) : renderNode(blocks, 'doc')}</div>;
}
