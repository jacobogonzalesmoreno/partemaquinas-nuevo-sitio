'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBlogLinkPreview } from '@/lib/blog-link-preview';

const emptyDoc = () => ({ type: 'doc', content: [{ type: 'paragraph', content: [] }] });
const blankArticle = () => ({ titulo: '', resumen: '', imagen_portada: '', contenido: emptyDoc(), estado: 'borrador' });
function normalizeDraftTypography(node) {
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'text') {
    const marks = (node.marks || []).filter(mark => !['fontFamily', 'fontSize'].includes(mark.type));
    return { ...node, ...(marks.length ? { marks } : { marks: undefined }) };
  }
  return { ...node, ...(Array.isArray(node.content) ? { content: node.content.map(normalizeDraftTypography) } : {}) };
}
const escapeHtml = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const cleanPdfLabel = value => String(value || '').replace(/^(?:📄\s*)+/, '').replace(/(?:\s*↗)+$/, '').trim() || 'Abrir documento PDF';
const linkCardHtml = href => {
  try {
    const preview = getBlogLinkPreview(href);
    return `<span class="blog-link-editor-card" data-blog-link-card="true" contenteditable="false"><span class="blog-link-editor-head"><img src="${escapeHtml(preview.favicon)}" alt=""><span><strong>${escapeHtml(preview.title)}</strong><small>${escapeHtml(preview.host)}</small></span><span class="blog-link-editor-actions" aria-hidden="true">▢　↗</span></span><span class="blog-link-editor-description">${escapeHtml(preview.description)}</span></span>`;
  } catch { return ''; }
};
const safeUrl = value => /^(https:\/\/|mailto:|tel:|\/|#)/i.test(String(value || '').trim());
const isPdfUrl = value => { try { return /\.pdf$/i.test(new URL(value).pathname); } catch { return false; } };
const normalizeColor = value => {
  const color = String(value || '').trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(color)) return color;
  const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  return rgb ? `#${rgb.slice(1).map(channel => Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, '0')).join('')}` : color;
};
function matchesInlineFormat(element, tag, attributes = {}) {
  const currentTag = element.tagName?.toLowerCase();
  const aliases = { strong: ['strong', 'b'], em: ['em', 'i'], s: ['s', 'strike', 'del'] };
  if (attributes.color) return normalizeColor(element.style?.color) === normalizeColor(attributes.color);
  if (attributes.backgroundColor) return normalizeColor(element.style?.backgroundColor) === normalizeColor(attributes.backgroundColor);
  if (attributes.dataset) return currentTag === tag && Object.entries(attributes.dataset).every(([name, value]) => element.dataset?.[name] === String(value));
  if (tag === 'a' && attributes.href) return currentTag === 'a' && element.getAttribute('href') === attributes.href;
  return (aliases[tag] || [tag]).includes(currentTag);
}
const normalizeVideoUrl = value => {
  try {
    const url = new URL(value);
    if (url.hostname === 'youtu.be') return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.endsWith('youtube.com') && url.pathname === '/watch' && url.searchParams.get('v')) return `https://www.youtube.com/embed/${url.searchParams.get('v')}`;
    if (url.hostname.endsWith('youtube.com') && url.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${url.pathname.split('/')[2]}`;
    if (url.hostname === 'youtube.com' && url.pathname.startsWith('/embed/')) return `https://www.youtube.com${url.pathname}`;
    if (url.hostname === 'www.youtube.com' && url.pathname.startsWith('/embed/')) return url.href;
    if (url.hostname === 'vimeo.com' && url.pathname.split('/').filter(Boolean).length) return `https://player.vimeo.com/video/${url.pathname.split('/').filter(Boolean).pop()}`;
    if (url.hostname === 'player.vimeo.com' && url.pathname.startsWith('/video/')) return url.href;
    if (url.hostname === 'res.cloudinary.com' && url.pathname.includes('/video/upload/')) return url.href;
  } catch { return ''; }
  return '';
};

function legacyToDoc(value) {
  if (!Array.isArray(value)) return value?.type === 'doc' ? value : emptyDoc();
  const content = value.flatMap(block => {
    if (block.type === 'paragraph') return [{ type: 'paragraph', content: [{ type: 'text', text: block.text || '' }] }];
    if (block.type === 'heading') return [{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: block.text || '' }] }];
    if (block.type === 'list') return [{ type: 'bulletList', content: String(block.text || '').split('\n').filter(Boolean).map(text => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] })) }];
    if (block.type === 'image') return [{ type: 'image', attrs: { src: block.url, alt: block.text || block.caption || '', title: block.text || block.caption || '', width: 100, align: 'center' } }];
    if (block.type === 'video') return [{ type: 'video', attrs: { src: normalizeVideoUrl(block.url) || block.url, title: block.text || '', width: 100, align: 'center' } }];
    if (block.type === 'pdf') return [{ type: 'pdf', attrs: { src: block.url, href: block.url, label: block.text || 'Abrir PDF', title: block.text || '', width: 100, align: 'center' } }];
    if (block.type === 'button') return [{ type: 'button', attrs: { href: block.url, label: block.text || 'Más información' } }];
    if (block.type === 'link') return [{ type: 'paragraph', content: [{ type: 'text', text: block.text || block.url, marks: [{ type: 'link', attrs: { href: block.url } }] }] }];
    return [];
  });
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] };
}

function nodeToHtml(node) {
  if (!node) return '';
  if (node.type === 'text') {
    let output = escapeHtml(node.text);
    for (const mark of node.marks || []) {
      if (mark.type === 'bold') output = `<strong>${output}</strong>`;
      if (mark.type === 'italic') output = `<em>${output}</em>`;
      if (mark.type === 'underline') output = `<u>${output}</u>`;
      if (mark.type === 'strike') output = `<s>${output}</s>`;
      if (mark.type === 'link') output = `<a href="${escapeHtml(mark.attrs.href)}" data-blog-link-preview="true">${output}${linkCardHtml(mark.attrs.href)}</a>`;
      if (mark.type === 'color') output = `<span style="color:${escapeHtml(mark.attrs.color)}">${output}</span>`;
      if (mark.type === 'highlight') output = `<mark style="background-color:${escapeHtml(mark.attrs.color)}">${output}</mark>`;
      if (mark.type === 'fontSize') { const size = ({ small: '10pt', normal: '12pt', large: '16pt', huge: '20pt' })[mark.attrs.size] || '12pt'; output = `<span data-size="${escapeHtml(mark.attrs.size)}" style="font-size:${size}">${output}</span>`; }
      if (mark.type === 'fontFamily') output = `<span data-font="${escapeHtml(mark.attrs.family)}" style="font-family:${escapeHtml(mark.attrs.family)}">${output}</span>`;
    }
    return output;
  }
  const children = (node.content || []).map(nodeToHtml).join('');
  if (node.type === 'doc') return children;
  if (node.type === 'paragraph') return `<p${node.attrs?.align ? ` style="text-align:${node.attrs.align}"` : ''}>${children || '<br>'}</p>`;
  if (node.type === 'heading') return `<h${node.attrs?.level || 2}${node.attrs?.align ? ` style="text-align:${node.attrs.align}"` : ''}>${children}</h${node.attrs?.level || 2}>`;
  if (node.type === 'bulletList') return `<ul>${children}</ul>`;
  if (node.type === 'orderedList') return `<ol>${children}</ol>`;
  if (node.type === 'listItem') return `<li>${children}</li>`;
  if (node.type === 'blockquote') return `<blockquote>${children}</blockquote>`;
  if (node.type === 'hardBreak') return '<br>';
  if (node.type === 'horizontalRule') return '<hr>';
  if (node.type === 'pageBreak') return '<div data-blog-pagebreak="true" contenteditable="false">SALTO DE PÁGINA</div>';
  if (node.type === 'image') { const width = Number(node.attrs?.width) || 100; const align = node.attrs?.align || 'center'; return `<p><img src="${escapeHtml(node.attrs?.src)}" alt="${escapeHtml(node.attrs?.alt)}" title="${escapeHtml(node.attrs?.title)}" style="width:${width}%;margin-left:${align === 'left' ? '0' : 'auto'};margin-right:${align === 'right' ? '0' : 'auto'}" data-blog-width="${width}" data-blog-align="${align}"></p>`; }
  if (node.type === 'video' && isPdfUrl(node.attrs?.src)) return `<p><a class="blog-file" data-blog-pdf="true" href="${escapeHtml(node.attrs.src)}" style="display:block;width:${Number(node.attrs?.width) || 100}%;margin-left:${node.attrs?.align === 'left' ? '0' : 'auto'};margin-right:${node.attrs?.align === 'right' ? '0' : 'auto'}" data-blog-width="${Number(node.attrs?.width) || 100}" data-blog-align="${node.attrs?.align || 'center'}">📄 ${escapeHtml(cleanPdfLabel(node.attrs?.title))} ↗</a></p>`;
  if (node.type === 'video') { const width = Number(node.attrs?.width) || 100; const align = node.attrs?.align || 'center'; return `<p>${node.attrs?.src?.includes('/video/upload/') ? `<video src="${escapeHtml(node.attrs.src)}" title="${escapeHtml(node.attrs?.title)}" style="width:${width}%;margin-left:${align === 'left' ? '0' : 'auto'};margin-right:${align === 'right' ? '0' : 'auto'}" data-blog-width="${width}" data-blog-align="${align}" controls></video>` : `<iframe src="${escapeHtml(node.attrs?.src)}" title="${escapeHtml(node.attrs?.title)}" style="width:${width}%;margin-left:${align === 'left' ? '0' : 'auto'};margin-right:${align === 'right' ? '0' : 'auto'}" data-blog-width="${width}" data-blog-align="${align}"></iframe>`}</p>`; }
  if (node.type === 'pdf') { const width = Number(node.attrs?.width) || 100; const align = node.attrs?.align || 'center'; const href = node.attrs?.src || node.attrs?.href; return `<p><a class="blog-file" data-blog-pdf="true" href="${escapeHtml(href)}" style="display:block;width:${width}%;margin-left:${align === 'left' ? '0' : 'auto'};margin-right:${align === 'right' ? '0' : 'auto'}" data-blog-width="${width}" data-blog-align="${align}">📄 ${escapeHtml(cleanPdfLabel(node.attrs?.label || node.attrs?.title))} ↗</a></p>`; }
  if (node.type === 'button') return `<p><a data-blog-button="true" href="${escapeHtml(node.attrs?.href)}">${escapeHtml(node.attrs?.label || 'Más información')}</a></p>`;
  return children;
}

function getMarks(element, marks) {
  const next = [...marks];
  const tag = element.tagName?.toLowerCase();
  if (element.dataset?.blogBold === 'false') {
    for (let index = next.length - 1; index >= 0; index -= 1) if (next[index].type === 'bold') next.splice(index, 1);
  } else if (element.dataset?.blogBold === 'true' || ['b', 'strong'].includes(tag)) {
    for (let index = next.length - 1; index >= 0; index -= 1) if (next[index].type === 'bold') next.splice(index, 1);
    next.push({ type: 'bold' });
  }
  if (['i', 'em'].includes(tag)) next.push({ type: 'italic' });
  if (tag === 'u') next.push({ type: 'underline' });
  if (['s', 'strike', 'del'].includes(tag)) next.push({ type: 'strike' });
  const href = tag === 'a' ? element.getAttribute('href') : '';
  if (href && !element.hasAttribute('data-blog-pdf') && !element.hasAttribute('data-blog-button')) next.push({ type: 'link', attrs: { href } });
  const style = element.getAttribute('style') || '';
  const toHex = value => {
    if (/^#[0-9a-f]{6}$/i.test(value || '')) return value;
    const rgb = String(value || '').match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    return rgb ? `#${rgb.slice(1).map(channel => Math.max(0, Math.min(255, Number(channel))).toString(16).padStart(2, '0')).join('')}` : '';
  };
  const color = toHex(style.match(/(?:^|;)\s*color:\s*([^;]+)/i)?.[1] || element.getAttribute('color'));
  const highlight = toHex(style.match(/(?:^|;)\s*background-color:\s*([^;]+)/i)?.[1]);
  if (color) next.push({ type: 'color', attrs: { color } });
  if (highlight) next.push({ type: 'highlight', attrs: { color: highlight } });
  const size = element.getAttribute('data-size');
  if (['small', 'normal', 'large', 'huge'].includes(size)) next.push({ type: 'fontSize', attrs: { size } });
  const family = element.getAttribute('data-font');
  if (['Arial', 'Georgia', 'Verdana', 'Times New Roman'].includes(family)) next.push({ type: 'fontFamily', attrs: { family } });
  const fontFace = element.getAttribute('face');
  if (['Arial', 'Georgia', 'Verdana', 'Times New Roman'].includes(fontFace)) next.push({ type: 'fontFamily', attrs: { family: fontFace } });
  const fontSize = element.getAttribute('size');
  if (fontSize) next.push({ type: 'fontSize', attrs: { size: ({ '2': 'small', '3': 'normal', '4': 'large', '5': 'huge' })[fontSize] || 'normal' } });
  return next;
}

function domToNodes(node, marks = []) {
  if (node.nodeType === Node.TEXT_NODE) return node.nodeValue ? [{ type: 'text', text: node.nodeValue, ...(marks.length ? { marks } : {}) }] : [];
  if (node.nodeType !== Node.ELEMENT_NODE) return [];
  const tag = node.tagName.toLowerCase();
  if (node.hasAttribute('data-blog-link-card')) return [];
  if (node.hasAttribute('data-blog-pagebreak')) return [{ type: 'pageBreak' }];
  const mediaAttrs = { width: Math.max(20, Math.min(100, Number(node.dataset?.blogWidth || parseInt(node.style?.width, 10) || 100))), align: ['left', 'center', 'right'].includes(node.dataset?.blogAlign) ? node.dataset.blogAlign : 'center' };
  if (tag === 'img') return [{ type: 'image', attrs: { src: node.getAttribute('src'), alt: node.getAttribute('alt') || '', title: node.getAttribute('title') || '', ...mediaAttrs } }];
  if (tag === 'video') return [{ type: 'video', attrs: { src: node.getAttribute('src'), title: node.getAttribute('title') || '', ...mediaAttrs } }];
  if (tag === 'iframe' && node.hasAttribute('data-blog-pdf')) return [{ type: 'pdf', attrs: { src: node.getAttribute('src'), title: node.getAttribute('title') || 'Documento PDF', ...mediaAttrs } }];
  if (tag === 'iframe') return [{ type: 'video', attrs: { src: node.getAttribute('src'), title: node.getAttribute('title') || '', ...mediaAttrs } }];
  if (tag === 'hr') return [{ type: 'horizontalRule' }];
  if (tag === 'br') return [{ type: 'hardBreak' }];
  if (tag === 'a' && node.hasAttribute('data-blog-pdf')) return [{ type: 'pdf', attrs: { href: node.getAttribute('href'), src: node.getAttribute('href'), label: cleanPdfLabel(node.textContent), ...mediaAttrs } }];
  if (tag === 'a' && node.hasAttribute('data-blog-button')) return [{ type: 'button', attrs: { href: node.getAttribute('href'), label: node.textContent } }];
  const nextMarks = getMarks(node, marks);
  const children = Array.from(node.childNodes).flatMap(child => domToNodes(child, nextMarks));
  if (tag === 'ul') return [{ type: 'bulletList', content: children }];
  if (tag === 'ol') return [{ type: 'orderedList', content: children }];
  if (tag === 'li') return [{ type: 'listItem', content: children.length && children[0].type === 'paragraph' ? children : [{ type: 'paragraph', content: children }] }];
  if (tag === 'blockquote') return [{ type: 'blockquote', content: children.length && children[0].type === 'paragraph' ? children : [{ type: 'paragraph', content: children }] }];
  const alignment = ['left', 'center', 'right', 'justify'].includes(node.style?.textAlign) ? node.style.textAlign : undefined;
  if (['h1', 'h2', 'h3'].includes(tag)) return [{ type: 'heading', attrs: { level: Number(tag.slice(1)), ...(alignment ? { align: alignment } : {}) }, content: children }];
  if (['p', 'div', 'section', 'article'].includes(tag)) {
    const blockTypes = new Set(['image', 'video', 'pdf', 'button', 'pageBreak', 'horizontalRule', 'bulletList', 'orderedList', 'blockquote', 'heading']);
    if (children.some(child => blockTypes.has(child.type))) {
      const result = []; let inline = [];
      const flushInline = () => { if (inline.length) { result.push({ type: 'paragraph', ...(alignment ? { attrs: { align: alignment } } : {}), content: inline }); inline = []; } };
      children.forEach(child => { if (blockTypes.has(child.type)) { flushInline(); result.push(child); } else inline.push(child); });
      flushInline();
      return result;
    }
    return [{ type: 'paragraph', ...(alignment ? { attrs: { align: alignment } } : {}), content: children }];
  }
  if (['strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'a', 'span', 'font', 'mark'].includes(tag)) return children;
  return children;
}

function readEditor(editor) {
  if (!editor) return emptyDoc();
  const content = Array.from(editor.childNodes).flatMap(node => domToNodes(node));
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph', content: [] }] };
}

function Icon({ name }) {
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    bold: <><path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/></>,
    italic: <><path d="M19 4h-9"/><path d="M14 20H5"/><path d="m15 4-6 16"/></>,
    underline: <><path d="M6 4v6a6 6 0 0 0 12 0V4"/><path d="M4 21h16"/></>,
    strike: <><path d="M5 12h14"/><path d="M17 6c-.7-1.3-2.2-2-5-2-3.4 0-5 1.1-5 3 0 2 2 3 5 4"/><path d="M7 18c.9 1.3 2.4 2 5 2 3.3 0 5-1 5-3 0-1.8-1.3-2.7-4-3.6"/></>,
    page: <><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 10h8M8 13h8M5 16h14"/></>,
    fullscreen: <><path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/></>,
    exitFullscreen: <><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3m13-5h-3a2 2 0 0 0-2 2v3"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
    pdf: <><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M8 14h8M8 17h6"/></>,
    button: <><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 12h8m-3-3 3 3-3 3"/></>,
    align: <><path d="M4 6h16M4 10h10M4 14h16M4 18h10"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

export default function BlogAdminPanel() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(blankArticle);
  const [editId, setEditId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editStep, setEditStep] = useState('details');
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('inicio');
  const [openMenu, setOpenMenu] = useState('');
  const [dialog, setDialog] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBusy, setPreviewBusy] = useState(null);
  const [saveConfirmation, setSaveConfirmation] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLabel, setPdfLabel] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [pageCount, setPageCount] = useState(1);
  const editorRef = useRef(null);
  const titleRef = useRef(null);
  const coverInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const selectionRef = useRef(null);
  const linkInputRef = useRef(null);
  const previewInputRef = useRef(null);

  const load = useCallback(async () => {
    const response = await fetch('/api/blog?admin=1');
    if (!response.ok) throw new Error('No se pudieron cargar los artículos.');
    setArticles(await response.json());
  }, []);
  useEffect(() => { load().catch(error => setNotice(error.message)); }, [load]);
  useEffect(() => {
    if (editing && editStep === 'content' && editorRef.current) { editorRef.current.innerHTML = nodeToHtml(normalizeDraftTypography(legacyToDoc(form.contenido))); setPageCount(editorRef.current.querySelectorAll('[data-blog-pagebreak]').length + 1); setSelectedMedia(null); }
  }, [editing, editStep, editId]);
  useEffect(() => {
    if (!editing) setEditorFullscreen(false);
  }, [editing]);
  useEffect(() => {
    if (!editorFullscreen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = event => { if (event.key === 'Escape') setEditorFullscreen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [editorFullscreen]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection?.rangeCount && editorRef.current?.contains(selection.anchorNode) && editorRef.current?.contains(selection.focusNode)) selectionRef.current = selection.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const selection = window.getSelection();
    if (selection && selectionRef.current) { selection.removeAllRanges(); selection.addRange(selectionRef.current); }
  };
  const exec = (command, value) => {
    restoreSelection();
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    saveSelection();
  };
  const toggleBold = () => {
    const editor = editorRef.current;
    const range = selectionRef.current;
    if (!editor || !range || range.collapsed) { setNotice('Selecciona primero el texto que quieres poner en negrita.'); return; }
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const segments = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!range.intersectsNode(node)) continue;
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
      if (end <= start) continue;
      const ancestors = [];
      let current = node.parentElement;
      while (current && current !== editor) { ancestors.push(current); current = current.parentElement; }
      let active = false;
      for (const ancestor of ancestors) {
        if (ancestor.dataset?.blogBold === 'true') { active = true; break; }
        if (ancestor.dataset?.blogBold === 'false') { active = false; break; }
        if (['b', 'strong'].includes(ancestor.tagName?.toLowerCase())) { active = true; break; }
      }
      segments.push({ node, start, end, active });
    }
    if (!segments.length) return;
    const makeBold = !segments.every(segment => segment.active);
    const wrappers = [];
    segments.reverse().forEach(({ node, start, end }) => {
      const part = document.createRange();
      part.setStart(node, start); part.setEnd(node, end);
      const wrapper = document.createElement('span');
      wrapper.dataset.blogBold = makeBold ? 'true' : 'false';
      wrapper.append(part.extractContents());
      part.insertNode(wrapper);
      wrappers.push(wrapper);
    });
    wrappers.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
    const nextRange = document.createRange();
    nextRange.setStartBefore(wrappers[0]); nextRange.setEndAfter(wrappers[wrappers.length - 1]);
    const selection = window.getSelection();
    selection.removeAllRanges(); selection.addRange(nextRange);
    selectionRef.current = nextRange.cloneRange(); editor.focus(); setNotice('');
  };
  const applyInline = (tag, attributes = {}) => {
    const editor = editorRef.current;
    const range = selectionRef.current;
    if (!editor || !range || range.collapsed) { setNotice('Selecciona primero el texto que quieres formatear.'); return; }
    if (tag === 'strong' || tag === 'b') { toggleBold(); return; }
    const nativeCommands = { em: 'italic', u: 'underline', s: 'strikeThrough' };
    if (nativeCommands[tag]) {
      restoreSelection();
      document.execCommand(nativeCommands[tag], false);
      editor.focus();
      saveSelection();
      setNotice('');
      return;
    }
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) if (range.intersectsNode(walker.currentNode)) textNodes.push(walker.currentNode);
    const selectedSegments = textNodes.map(node => {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.nodeValue.length;
      if (end <= start) return null;
      const ancestors = [];
      let ancestor = node.parentElement;
      while (ancestor && ancestor !== editor) { ancestors.push(ancestor); ancestor = ancestor.parentElement; }
      return { node, start, end, ancestors, active: ancestors.some(element => matchesInlineFormat(element, tag, attributes)) };
    }).filter(Boolean);
    if (!selectedSegments.length) return;
    // If every selected character already has this format, remove it. A mixed
    // selection applies the format to the whole selection, like a word processor.
    const removeFormat = selectedSegments.every(segment => segment.active);
    const affectedNodes = [];
    selectedSegments.reverse().forEach(({ node, start, end, ancestors }) => {
      const part = document.createRange(); part.setStart(node, start); part.setEnd(node, end);
      let root = part.extractContents();
      if (removeFormat) {
        for (const ancestor of ancestors) {
          if (matchesInlineFormat(ancestor, tag, attributes)) continue;
          const clone = ancestor.cloneNode(false);
          clone.append(root);
          root = clone;
        }
      } else {
    const wrapper = document.createElement(tag);
        if (tag === 'a') wrapper.dataset.blogLinkPreview = 'true';
        Object.entries(attributes).forEach(([name, value]) => {
          if (name === 'dataset') Object.entries(value).forEach(([dataName, dataValue]) => {
            wrapper.dataset[dataName] = dataValue;
            if (dataName === 'size') wrapper.style.fontSize = ({ small: '10pt', normal: '12pt', large: '16pt', huge: '20pt' })[dataValue] || '';
            if (dataName === 'font') wrapper.style.fontFamily = dataValue;
          });
          else if (['color', 'backgroundColor', 'fontSize', 'fontFamily'].includes(name)) wrapper.style[name] = value;
          else wrapper.setAttribute(name, value);
        });
        wrapper.append(root);
        if (tag === 'a') wrapper.insertAdjacentHTML('beforeend', linkCardHtml(attributes.href));
        root = wrapper;
      }
      const insertedRoot = root.nodeType === Node.DOCUMENT_FRAGMENT_NODE ? root.firstChild : root;
      part.insertNode(root);
      if (insertedRoot) affectedNodes.push(insertedRoot);
    });
    if (!affectedNodes.length) return;
    affectedNodes.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
    const nextRange = document.createRange(); nextRange.setStartBefore(affectedNodes[0]); nextRange.setEndAfter(affectedNodes[affectedNodes.length - 1]);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(nextRange);
    selectionRef.current = nextRange.cloneRange(); editor.focus(); setNotice('');
  };
  const applyLink = href => {
    const start = selectionRef.current?.startContainer;
    const element = start?.nodeType === Node.TEXT_NODE ? start.parentElement : start;
    const existing = element?.closest?.('a');
    if (existing && editorRef.current?.contains(existing)) { existing.setAttribute('href', href); existing.dataset.blogLinkPreview = 'true'; existing.querySelector('[data-blog-link-card]')?.remove(); existing.insertAdjacentHTML('beforeend', linkCardHtml(href)); saveSelection(); return; }
    applyInline('a', { href });
  };
  const updatePageCount = () => { if (editorRef.current) setPageCount(editorRef.current.querySelectorAll('[data-blog-pagebreak]').length + 1); };
  const selectMedia = event => {
    selectedMedia?.classList?.remove('blog-media-selected');
    const media = event.target.closest?.('img,video,iframe,a[data-blog-pdf]');
    if (media?.matches('a[data-blog-pdf]')) event.preventDefault();
    if (!media || !editorRef.current?.contains(media)) { setSelectedMedia(null); return; }
    media.classList.add('blog-media-selected');
    setSelectedMedia(media);
  };
  const applyMediaWidth = width => {
    if (!selectedMedia?.isConnected) return;
    selectedMedia.style.width = `${width}%`; selectedMedia.dataset.blogWidth = String(width); selectedMedia.style.display = 'block';
    if (selectedMedia.tagName === 'IMG' || selectedMedia.tagName === 'A') selectedMedia.style.height = 'auto';
    else selectedMedia.style.height = selectedMedia.hasAttribute('data-blog-pdf') ? '620px' : `${Math.round(width * 4.5)}px`;
    updatePageCount();
  };
  const applyMediaAlign = align => {
    if (!selectedMedia?.isConnected) return;
    selectedMedia.dataset.blogAlign = align;
    selectedMedia.style.display = 'block'; selectedMedia.style.marginLeft = align === 'left' ? '0' : 'auto'; selectedMedia.style.marginRight = align === 'right' ? '0' : 'auto';
    updatePageCount();
  };
  const removeSelectedMedia = () => { selectedMedia?.remove(); setSelectedMedia(null); updatePageCount(); };
  const applyBlock = tag => exec('formatBlock', `<${tag}>`);
  const insertHtml = html => { restoreSelection(); document.execCommand('insertHTML', false, html); editorRef.current?.focus(); saveSelection(); };

  const upload = async (file, target) => {
    if (!file) return;
    setUploading(target); setNotice('Subiendo archivo…');
    try {
      const signatureResponse = await fetch('/api/admin/blog/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: file.type, size: file.size }) });
      const signed = await signatureResponse.json();
      if (!signatureResponse.ok) throw new Error(signed.error || 'No se pudo preparar la subida.');
      const data = new FormData();
      data.append('file', file); data.append('api_key', signed.apiKey); data.append('timestamp', String(signed.timestamp)); data.append('signature', signed.signature); data.append('folder', signed.folder);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signed.cloudName}/${signed.resourceType}/upload`, { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) throw new Error('El almacenamiento no pudo guardar el archivo.');
      const url = result.secure_url;
      if (target === 'cover') { setCoverUrl(url); setForm(current => ({ ...current, imagen_portada: url })); }
      else {
        restoreSelection();
        if (file.type.startsWith('image/')) insertHtml(`<img src="${escapeHtml(url)}" alt="${escapeHtml(file.name)}" title="${escapeHtml(file.name)}">`);
        else if (file.type.startsWith('video/')) insertHtml(`<video src="${escapeHtml(url)}" title="${escapeHtml(file.name)}" controls></video>`);
        else insertHtml(`<iframe data-blog-pdf="true" src="${escapeHtml(url)}" title="${escapeHtml(file.name)}" data-blog-width="100"></iframe>`);
        updatePageCount();
      }
      setNotice('Archivo listo.');
    } catch (error) { setNotice(error.message); }
    finally { setUploading(''); }
  };

  const openLinkDialog = () => {
    saveSelection();
    const selected = window.getSelection()?.toString() || '';
    setLinkText(selected);
    setLinkUrl('');
    setDialog('link');
    setTimeout(() => linkInputRef.current?.focus(), 30);
  };
  const insertLink = event => {
    event.preventDefault();
    if (!safeUrl(linkUrl)) { setNotice('Ingresa un enlace https://, un enlace interno o un correo/teléfono válido.'); return; }
    restoreSelection();
    const selected = window.getSelection()?.toString();
    if (selected) applyLink(linkUrl.trim());
    else insertHtml(`<a href="${escapeHtml(linkUrl)}">${escapeHtml(linkText || linkUrl)}</a>`);
    setDialog(null); editorRef.current?.focus(); saveSelection();
  };
  const openActionDialog = () => { setActionLabel(''); setActionUrl(''); setDialog('button'); };
  const insertAction = event => {
    event.preventDefault();
    if (!safeUrl(actionUrl)) { setNotice('Ingresa una dirección https:// o una ruta interna.'); return; }
    insertHtml(`<a data-blog-button="true" href="${escapeHtml(actionUrl)}">${escapeHtml(actionLabel || 'Más información')}</a>`);
    setDialog(null);
  };
  const openVideoDialog = () => { setVideoUrl(''); setDialog('video'); };
  const insertVideo = event => {
    event.preventDefault();
    const url = normalizeVideoUrl(videoUrl);
    if (!url) { setNotice('Pega un enlace válido de YouTube, Vimeo o Cloudinary.'); return; }
    insertHtml(url.includes('/video/upload/') ? `<video src="${escapeHtml(url)}" controls></video>` : `<iframe src="${escapeHtml(url)}" title="Video del artículo"></iframe>`);
    updatePageCount();
    setDialog(null);
  };
  const openPdfDialog = () => {
    saveSelection();
    setPdfUrl('');
    setPdfLabel('Descargar lista de inspección del tren de rodaje');
    setDialog('pdf');
  };
  const insertPdf = event => {
    event.preventDefault();
    const url = pdfUrl.trim();
    if (!safeUrl(url) || !isPdfUrl(url)) { setNotice('Pega un enlace HTTPS que termine en .pdf.'); return; }
    insertHtml(`<a class="blog-file" data-blog-pdf="true" href="${escapeHtml(url)}" data-blog-width="100" data-blog-align="center">${escapeHtml(cleanPdfLabel(pdfLabel))}</a>`);
    setDialog(null);
    updatePageCount();
  };

  const startNew = () => { setEditId(null); setForm(blankArticle()); setCoverUrl(''); setEditing(true); setEditStep('details'); setEditorFullscreen(false); setTab('inicio'); setNotice(''); };
  const startEdit = article => { setEditId(article.id); setForm({ titulo: article.titulo || '', resumen: article.resumen || '', imagen_portada: article.imagen_portada || '', contenido: legacyToDoc(article.contenido), estado: article.estado || 'borrador' }); setCoverUrl(article.imagen_portada || ''); setEditing(true); setEditStep('details'); setEditorFullscreen(false); setTab('inicio'); setNotice(''); };
  const switchEditStep = step => {
    if (step === 'details' && editStep === 'content' && editorRef.current) {
      const content = readEditor(editorRef.current);
      setForm(current => ({ ...current, contenido: content }));
    }
    setEditStep(step);
    setEditorFullscreen(step === 'content');
    setOpenMenu('');
    if (step === 'content') setTab('inicio');
  };
  const save = async event => {
    event.preventDefault(); setBusy(true); setNotice('Guardando artículo…');
    const payload = { ...form, contenido: editorRef.current ? readEditor(editorRef.current) : form.contenido };
    try {
      const response = await fetch(editId ? `/api/admin/blog/${editId}` : '/api/admin/blog', { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar el artículo.');
      await load();
      if (!editId && result.id) setEditId(result.id);
      setForm({ ...payload, contenido: payload.contenido });
      setNotice('');
      setSaveConfirmation(payload.estado === 'publicado' ? 'published' : 'saved');
      window.setTimeout(() => setSaveConfirmation(''), 2800);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  };
  const addPageBreak = () => { saveSelection(); insertHtml('<div data-blog-pagebreak="true" contenteditable="false">SALTO DE PÁGINA</div><p><br></p>'); updatePageCount(); setTab('inicio'); };
  const remove = async () => {
    if (!deleteTarget) return;
    const response = await fetch(`/api/admin/blog/${deleteTarget.id}`, { method: 'DELETE' });
    if (!response.ok) { setNotice('No se pudo eliminar el artículo.'); setDeleteTarget(null); return; }
    await load(); setNotice('Artículo eliminado.'); setDeleteTarget(null);
  };
  const createPreview = async article => {
    setPreviewBusy(article.id);
    try {
      const response = await fetch(`/api/admin/blog/${article.id}/preview`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo crear la vista previa.');
      const url = `${window.location.origin}/blog/vista-previa/${result.token}`;
      setPreviewUrl(url);
      setNotice('Vista previa lista. Copia el enlace de la ventana para compartirlo.');
    } catch (error) { setNotice(error.message); }
    finally { setPreviewBusy(null); }
  };
  const copyPreview = async () => {
    try { await navigator.clipboard.writeText(previewUrl); setNotice('Enlace de revisión copiado.'); }
    catch {
      previewInputRef.current?.select();
      const copied = document.execCommand('copy');
      setNotice(copied ? 'Enlace de revisión copiado.' : 'El enlace quedó seleccionado. Presiona Ctrl+C para copiarlo.');
    }
  };

  const toolbarButton = (label, icon, onClick, extra = '') => <button type="button" className={`word-tool ${extra}`} title={label} aria-label={label} onMouseDown={event => { saveSelection(); event.preventDefault(); }} onClick={onClick}><Icon name={icon} /><span>{label}</span></button>;
  const customMenu = (name, label, children) => <div className="word-menu-wrap"><button type="button" className={`word-select ${openMenu === name ? 'is-open' : ''}`} onMouseDown={event => event.preventDefault()} onClick={() => setOpenMenu(openMenu === name ? '' : name)}>{label}<span>⌄</span></button>{openMenu === name && <div className="word-menu">{children}</div>}</div>;
  const runAndClose = (fn) => { fn(); setOpenMenu(''); };

  return <section className="blog-admin">
    <div className="blog-admin-heading"><div><span>CONTENIDO EDITORIAL</span><h2>Blog</h2><p>Crea, edita y publica artículos para el sitio.</p></div>{!editing && <button type="button" className="blog-admin-primary" onClick={startNew}>＋ Nuevo artículo</button>}</div>
    {notice && <p className="blog-admin-notice" role="status">{notice}</p>}
    {editing ? <form className={`blog-editor blog-word-editor${editorFullscreen ? ' blog-word-editor--fullscreen' : ''}`} onSubmit={save}>
      <div className="blog-editor-top"><div><span>{editId ? 'EDITANDO ARTÍCULO' : 'NUEVA PUBLICACIÓN'}</span><h3>{form.titulo || 'Artículo sin título'}</h3></div><button type="button" className="blog-admin-secondary" onClick={() => setEditing(false)}>Cerrar</button></div>
      <div className="blog-edit-mode-switch" role="tablist" aria-label="Modo de edición"><button type="button" role="tab" aria-selected={editStep === 'details'} className={editStep === 'details' ? 'is-active' : ''} onClick={() => switchEditStep('details')}><strong>1</strong><span><b>Título, resumen y portada</b><small>Edita la información principal</small></span></button><button type="button" role="tab" aria-selected={editStep === 'content'} className={editStep === 'content' ? 'is-active' : ''} onClick={() => switchEditStep('content')}><strong>2</strong><span><b>Edición completa</b><small>Abre el editor a pantalla completa</small></span></button></div>
      {editStep === 'details' && <div className="blog-word-meta">
        <label className="blog-admin-field">Título del artículo<input required maxLength={220} value={form.titulo} onChange={event => setForm({ ...form, titulo: event.target.value })} placeholder="Escribe el título del artículo" /></label>
        <label className="blog-admin-field">Resumen<textarea required maxLength={500} rows={2} value={form.resumen} onChange={event => setForm({ ...form, resumen: event.target.value })} placeholder="Breve descripción para la página del blog" /></label>
        <div className="blog-word-cover"><div><strong>Portada del artículo</strong><span>Opcional · JPG, PNG, WEBP o GIF</span></div><input value={coverUrl} onChange={event => { setCoverUrl(event.target.value); setForm({ ...form, imagen_portada: event.target.value }); }} placeholder="Pega una URL de imagen" /><input ref={coverInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => upload(event.target.files?.[0], 'cover')} /><button type="button" className="blog-admin-secondary" onClick={() => coverInputRef.current?.click()} disabled={uploading === 'cover'}>{uploading === 'cover' ? 'Subiendo…' : 'Subir imagen'}</button>{coverUrl && <img src={coverUrl} alt="Vista previa de portada" />}</div>
      </div>}

      {editStep === 'content' && <>
      <div className="word-ribbon">
        <div className="word-ribbon-tabs"><button type="button" className={tab === 'inicio' ? 'active' : ''} onClick={() => { setTab('inicio'); setOpenMenu(''); }}>Inicio</button><button type="button" className={tab === 'insertar' ? 'active' : ''} onMouseDown={saveSelection} onClick={() => { setTab('insertar'); setOpenMenu(''); }}>Insertar</button><button type="button" className="word-ribbon-fullscreen" aria-pressed={editorFullscreen} onMouseDown={event => { saveSelection(); event.preventDefault(); }} onClick={() => setEditorFullscreen(value => !value)}><Icon name={editorFullscreen ? 'exitFullscreen' : 'fullscreen'} /><span>{editorFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}</span></button><span>Editor de artículos</span></div>
        {tab === 'inicio' ? <div className="word-ribbon-tools">
          <div className="word-tool-group"><div className="word-font-row">{customMenu('font','Arial',<>{['Arial','Georgia','Verdana','Times New Roman'].map(font => <button type="button" key={font} onMouseDown={event => event.preventDefault()} onClick={() => runAndClose(() => applyInline('span',{ dataset: { font } }))}>{font}</button>)}</>)}{customMenu('size','12',<>{[['10','small'],['12','normal'],['16','large'],['20','huge']].map(([label,size]) => <button type="button" key={size} onClick={() => runAndClose(() => applyInline('span',{ dataset: { size } }))}>{label} pt</button>)}</>)}</div><div className="word-format-row">{toolbarButton('Negrita','bold',() => applyInline('strong'),'is-strong')}{toolbarButton('Cursiva','italic',() => applyInline('em'))}{toolbarButton('Subrayado','underline',() => applyInline('u'))}{toolbarButton('Tachado','strike',() => applyInline('s'))}{customMenu('color','A ▾',<div className="word-swatches">{['#171719','#bd2020','#2056b8','#16804c','#856000'].map(color => <button type="button" key={color} style={{ backgroundColor: color }} aria-label={`Color ${color}`} onClick={() => runAndClose(() => applyInline('span',{ color }))} />)}</div>)}{customMenu('highlight','▰ ▾',<div className="word-swatches">{['#fff2a8','#d8f3dc','#dbeafe','#fce7f3','#ffffff'].map(color => <button type="button" key={color} style={{ backgroundColor: color }} aria-label={`Resaltado ${color}`} onClick={() => runAndClose(() => applyInline('mark',{ backgroundColor: color }))} />)}</div>)}</div><span>Fuente</span></div>
          <div className="word-tool-group"><div className="word-format-row">{toolbarButton('Viñetas','list',() => exec('insertUnorderedList'))}{toolbarButton('Numeración','list',() => exec('insertOrderedList'))}{customMenu('style','Normal ▾',<>{[['Normal','p'],['Título 1','h1'],['Título 2','h2'],['Título 3','h3'],['Cita','blockquote']].map(([label,tag]) => <button type="button" key={tag} onClick={() => runAndClose(() => applyBlock(tag))}>{label}</button>)}</>)}{customMenu('align','Alinear ▾',<>{[['Izquierda','justifyLeft'],['Centrar','justifyCenter'],['Derecha','justifyRight']].map(([label,command]) => <button type="button" key={command} onClick={() => runAndClose(() => exec(command))}>{label}</button>)}</>)}</div><span>Párrafo y estilos</span></div>
          <div className="word-tool-group word-tool-group--last"><div className="word-format-row">{toolbarButton('Hipervínculo','link',openLinkDialog)}{toolbarButton('Deshacer','align',() => exec('undo'))}{toolbarButton('Rehacer','align',() => exec('redo'))}</div><span>Edición</span></div>
        </div> : <div className="word-ribbon-tools word-ribbon-tools--insert">
          <div className="word-tool-group">{toolbarButton('Imagen','image',() => { saveSelection(); imageInputRef.current?.click(); })}<span>Ilustraciones</span></div>
          <div className="word-tool-group">{toolbarButton('Video','video',openVideoDialog)}<span>Multimedia</span></div>
          <div className="word-tool-group">{toolbarButton('PDF','pdf',openPdfDialog)}{toolbarButton('Salto de página','page',addPageBreak)}<span>Archivos y páginas</span></div>
          <div className="word-tool-group">{toolbarButton('Hipervínculo','link',openLinkDialog)}{toolbarButton('Botón','button',openActionDialog)}<span>Vínculos</span></div>
        </div>}
      </div>
      <input ref={imageInputRef} hidden type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event => upload(event.target.files?.[0], 'image')} />
      <input ref={videoInputRef} hidden type="file" accept="video/mp4,video/webm" onChange={event => upload(event.target.files?.[0], 'video')} />
      <input ref={pdfInputRef} hidden type="file" accept="application/pdf" onChange={event => upload(event.target.files?.[0], 'pdf')} />
      {selectedMedia?.isConnected && <div className="word-media-toolbar"><strong>{selectedMedia.hasAttribute('data-blog-pdf') ? 'PDF seleccionado' : selectedMedia.tagName === 'IMG' ? 'Imagen seleccionada' : 'Video seleccionado'}</strong><span>Tamaño</span>{[[35,'Pequeño'],[55,'Mediano'],[75,'Grande'],[100,'Ancho completo']].map(([width,label]) => <button type="button" key={width} onClick={() => applyMediaWidth(width)}>{label}</button>)}<span>Posición</span>{[['left','Izquierda'],['center','Centro'],['right','Derecha']].map(([align,label]) => <button type="button" key={align} onClick={() => applyMediaAlign(align)}>{label}</button>)}<button type="button" className="word-media-remove" onClick={removeSelectedMedia}>Quitar</button></div>}
      <div className="word-editor-canvas" onClick={() => setOpenMenu('')}><div className="word-page"><div ref={editorRef} className="word-editable" contentEditable suppressContentEditableWarning role="textbox" aria-label="Contenido del artículo" aria-multiline="true" spellCheck onClick={selectMedia} onInput={() => { setNotice(''); saveSelection(); updatePageCount(); }} onKeyUp={saveSelection} onMouseUp={saveSelection} onPointerUp={saveSelection} onSelect={saveSelection} data-placeholder="Empieza a escribir tu artículo aquí…" /></div></div>
      </>}
      <div className="blog-editor-actions">
        <span className="word-page-counter">{editStep === 'content' ? `Páginas: ${pageCount}` : 'Información del artículo'}</span>
        {editStep === 'content' && <div className="blog-status-dropdown"><span>Estado del artículo</span>{customMenu('status', form.estado === 'publicado' ? 'Publicado' : 'Borrador', <>{[['borrador','Borrador'],['publicado','Publicado']].map(([value,label]) => <button type="button" key={value} className={form.estado === value ? 'selected' : ''} onClick={() => { setForm({ ...form, estado: value }); setOpenMenu(''); }}>{label}</button>)}</>)}</div>}
        <button type="button" className="blog-admin-secondary" onClick={() => setEditing(false)}>Cancelar</button>
        <button type="submit" className="blog-admin-primary" disabled={busy || Boolean(uploading)}>{busy ? 'Guardando…' : form.estado === 'publicado' ? 'Publicar artículo' : 'Guardar borrador'}</button>
      </div>
    </form> : <div className="blog-admin-list">{articles.length ? articles.map(article => <div className="blog-admin-row" key={article.id}><div>{article.imagen_portada && <img src={article.imagen_portada} alt="" />}<div><strong>{article.titulo}</strong><p>{article.resumen}</p><span className={article.estado === 'publicado' ? 'is-published' : ''}>{article.estado === 'publicado' ? 'Publicado' : 'Borrador'}{article.estado === 'publicado' && article.publicado_en ? ` · ${new Date(article.publicado_en).toLocaleDateString('es-CO', { timeZone: 'UTC' })}` : ''}</span></div></div><div><button type="button" className="blog-admin-secondary" onClick={() => startEdit(article)}>Editar</button><button type="button" className="blog-admin-secondary" disabled={previewBusy === article.id} onClick={() => createPreview(article)}>{previewBusy === article.id ? 'Creando enlace…' : 'Compartir vista previa'}</button>{article.estado === 'publicado' && <a className="blog-admin-secondary" href={`/blog/${article.slug}`} target="_blank" rel="noreferrer">Ver</a>}<button type="button" className="blog-admin-danger" onClick={() => setDeleteTarget(article)}>Eliminar</button></div></div>) : <div className="blog-block-empty">Todavía no hay artículos. Crea uno para empezar el blog.</div>}</div>}

    {saveConfirmation && createPortal(<div className="blog-save-confirmation-backdrop" role="presentation" onClick={() => setSaveConfirmation('')}><section className="blog-save-confirmation" role="status" aria-live="polite"><span className="blog-save-confirmation-check">✓</span><span className="blog-save-confirmation-kicker">{saveConfirmation === 'published' ? 'PUBLICACIÓN LISTA' : 'CAMBIOS GUARDADOS'}</span><h3>{saveConfirmation === 'published' ? 'Artículo publicado' : 'Borrador guardado'}</h3><p>{saveConfirmation === 'published' ? 'Tu artículo ya está publicado. Puedes continuar editándolo.' : 'Tu borrador está a salvo. Puedes continuar editándolo.'}</p><button type="button" onClick={() => setSaveConfirmation('')}>Continuar editando</button></section></div>, document.body)}
    {deleteTarget && <div className="blog-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><section className="blog-dialog" role="alertdialog" aria-modal="true" aria-labelledby="blog-delete-title"><span className="blog-dialog-icon">!</span><h3 id="blog-delete-title">¿Eliminar este artículo?</h3><p>Se eliminará “{deleteTarget.titulo}” del blog y del panel.</p><div><button type="button" className="blog-admin-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button><button type="button" className="blog-admin-danger blog-dialog-delete" onClick={remove}>Eliminar artículo</button></div></section></div>}

    {previewUrl && <div className="blog-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setPreviewUrl(''); }}><section className="blog-dialog blog-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="blog-preview-title"><button type="button" className="blog-dialog-close" onClick={() => setPreviewUrl('')} aria-label="Cerrar">×</button><span className="blog-dialog-kicker">REVISIÓN DEL ARTÍCULO</span><h3 id="blog-preview-title">Vista previa lista para compartir</h3><p>Las personas podrán revisar el borrador con este enlace, sin iniciar sesión ni entrar al panel.</p><label>Enlace de revisión<input ref={previewInputRef} readOnly value={previewUrl} onFocus={event => event.target.select()} /></label><div className="blog-dialog-actions"><button type="button" className="blog-admin-secondary" onClick={() => setPreviewUrl('')}>Cerrar</button><a className="blog-admin-secondary" href={previewUrl} target="_blank" rel="noreferrer">Abrir vista previa</a><button type="button" className="blog-admin-primary" onClick={copyPreview}>Copiar enlace</button></div></section></div>}

    {dialog && <div className="blog-dialog-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}><section className="blog-dialog" role="dialog" aria-modal="true" aria-labelledby="blog-dialog-title"><button type="button" className="blog-dialog-close" onClick={() => setDialog(null)} aria-label="Cerrar">×</button><span className="blog-dialog-kicker">INSERTAR EN EL ARTÍCULO</span><h3 id="blog-dialog-title">{dialog === 'link' ? 'Agregar hipervínculo' : dialog === 'button' ? 'Insertar botón' : dialog === 'pdf' ? 'Adjuntar documento PDF' : 'Insertar video'}</h3><form onSubmit={dialog === 'link' ? insertLink : dialog === 'button' ? insertAction : dialog === 'pdf' ? insertPdf : insertVideo}>
      {dialog === 'link' && <><label>Texto del enlace<input ref={linkInputRef} value={linkText} onChange={event => setLinkText(event.target.value)} placeholder="Selecciona texto en la hoja o escribe el texto" /></label><label>Dirección web<input type="text" value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://ejemplo.com" /></label><p className="blog-dialog-hint">Si seleccionaste texto en la hoja, el vínculo se aplicará solo a esa selección.</p></>}
      {dialog === 'button' && <><label>Texto del botón<input value={actionLabel} onChange={event => setActionLabel(event.target.value)} placeholder="Consultar disponibilidad" /></label><label>Dirección del botón<input type="text" value={actionUrl} onChange={event => setActionUrl(event.target.value)} placeholder="https:// o ruta interna" /></label></>}
      {dialog === 'video' && <><label>Enlace de YouTube o Vimeo<input value={videoUrl} onChange={event => setVideoUrl(event.target.value)} placeholder="Pega el enlace del video" /></label><p className="blog-dialog-hint">También puedes subir un MP4 o WEBM desde la pestaña Insertar.</p></>}
      {dialog === 'pdf' && <><label>Texto del enlace<input value={pdfLabel} onChange={event => setPdfLabel(event.target.value)} placeholder="Abrir ficha de inspección" /></label><label>Enlace seguro del PDF<input type="url" value={pdfUrl} onChange={event => setPdfUrl(event.target.value)} placeholder="https://www.partemaquinas.com/archivo.pdf" /></label><p className="blog-dialog-hint">Pega un enlace HTTPS terminado en .pdf. También puedes subir un archivo desde la pestaña Insertar.</p><button type="button" className="blog-admin-secondary" onClick={() => pdfInputRef.current?.click()} disabled={uploading === 'pdf'}>{uploading === 'pdf' ? 'Subiendo PDF…' : 'Elegir archivo PDF'}</button></>}
      <div className="blog-dialog-actions"><button type="button" className="blog-admin-secondary" onClick={() => setDialog(null)}>Cancelar</button><button className="blog-admin-primary">{dialog === 'link' ? 'Insertar vínculo' : dialog === 'button' ? 'Insertar botón' : dialog === 'pdf' ? 'Adjuntar PDF' : 'Insertar video'}</button></div>
    </form></section></div>}
  </section>;
}
