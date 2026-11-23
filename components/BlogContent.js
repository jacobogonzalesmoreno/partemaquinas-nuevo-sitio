import BlogLinkPreview from '@/components/BlogLinkPreview';
import BlogImageZoom from '@/components/BlogImageZoom';
import BlogPhotoCredit from '@/components/BlogPhotoCredit';

function isPdfUrl(value) {
  try { return /\.pdf$/i.test(new URL(value).pathname); } catch { return false; }
}

function pdfLabel(value) {
  return String(value || '').replace(/^(?:📄\s*)+/, '').replace(/(?:\s*↗)+$/, '').trim() || 'Abrir documento PDF';
}

const articleTwoIllustrations = {
  'articulo-2-zapatas.png': {
    alt: 'Esquema ilustrativo de zapatas y eslabones de oruga con un perno faltante',
    title: 'Esquema ilustrativo: identifica grietas, deformaciones o pernos faltantes en las zapatas.',
  },
  'articulo-2-rodillos.png': {
    alt: 'Diagrama de inspección de rodillos inferiores con una señal de posible fuga',
    title: 'Diagrama de referencia: busca desgaste, daños y humedad alrededor de los sellos.',
  },
  'articulo-2-sprocket.png': {
    alt: 'Esquema ilustrativo de una rueda dentada con perfil desgastado',
    title: 'Esquema ilustrativo: compara el perfil de los dientes y su contacto con la cadena.',
  },
  'articulo-2-guia-tensor.png': {
    alt: 'Esquema ilustrativo de rueda guía y tensor con residuos acumulados',
    title: 'Esquema ilustrativo: ubica residuos alrededor de la rueda guía y el tensor.',
  },
  'articulo-2-bastidor.png': {
    alt: 'Diagrama esquemático del bastidor y las protecciones de una excavadora de orugas',
    title: 'Diagrama de referencia: revisa el bastidor, las fijaciones y las protecciones.',
  },
  'articulo-2-limpieza.png': {
    alt: 'Diagrama ilustrativo de barro acumulado en rodillos y cadena',
    title: 'Diagrama ilustrativo: retira barro y piedras antes de inspeccionar el tren de rodaje.',
  },
  'articulo-2-tension-manual.png': {
    alt: 'Diagrama orientativo de medición de tensión y consulta del manual de la máquina',
    title: 'Diagrama orientativo: consulta el procedimiento y las medidas del manual de tu máquina.',
  },
  'articulo-2-rutina.png': {
    alt: 'Infografía con cinco pasos para inspeccionar el tren de rodaje por turno',
    title: 'Infografía: sigue esta rutina por turno y registra cualquier anomalía.',
  },
};

function imageDetails(src, alt, title) {
  const filename = String(src || '').split('/').pop();
  const illustration = articleTwoIllustrations[filename];
  return illustration ? { ...illustration } : { alt: alt || title || '', title };
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
  if (node.type === 'articleSection') return <section key={key} className={`blog-visual-section ${node.attrs?.layout || 'image-right'}`}><div className="blog-visual-section__copy">{children}</div><figure><BlogImageZoom src={node.attrs.src} alt={node.attrs.alt || node.attrs.title || ''} /><figcaption>{node.attrs.title}<BlogPhotoCredit src={node.attrs.src} /></figcaption></figure></section>;
  if (node.type === 'paragraph') {
    const plainText = (node.content || []).filter(child => child.type === 'text').map(child => child.text || '').join('');
    const articleTwoSourceNote = 'Las imágenes son de Unsplash. El video y los enlaces llevan a referencias externas sobre mantenimiento e inspección.';
    const correctedSourceNote = 'El artículo combina diagramas ilustrativos, fotografías con su atribución y recursos externos. Confirma siempre los procedimientos en el manual de tu máquina.';
    return <p key={key} style={node.attrs?.align ? { textAlign: node.attrs.align } : undefined}>{plainText === articleTwoSourceNote ? correctedSourceNote : children}</p>;
  }
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
  if (node.type === 'image') {
    const details = imageDetails(node.attrs.src, node.attrs.alt, node.attrs.title);
    return <figure key={key} style={mediaStyle}><BlogImageZoom src={node.attrs.src} alt={details.alt} />{details.title && <figcaption>{details.title}<BlogPhotoCredit src={node.attrs.src} /></figcaption>}</figure>;
  }
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
    if (block.type === 'image') return <figure key={key}><BlogImageZoom src={block.url} alt={block.text || block.caption || ''} />{(block.text || block.caption) && <figcaption>{block.text || block.caption}<BlogPhotoCredit src={block.url} /></figcaption>}</figure>;
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
