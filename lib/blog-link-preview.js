export function getBlogLinkPreview(href) {
  const destination = String(href || '').trim();
  const url = new URL(destination, 'https://www.partemaquinas.com');
  const host = url.hostname.replace(/^www\./, '');
  const isPartemaquinas = /(^|\.)partemaquinas\.com$/i.test(url.hostname);
  return {
    host,
    title: isPartemaquinas ? 'ParteMáquinas | Repuestos para maquinaria pesada' : host,
    description: isPartemaquinas
      ? 'Repuestos para maquinaria pesada, excavadoras y motores diésel en Medellín, Colombia.'
      : `Consulta el contenido publicado en ${host}.`,
    favicon: isPartemaquinas ? '/favicon.ico' : `https://${url.hostname}/favicon.ico`,
    path: `${url.pathname}${url.search}${url.hash}` || '/',
    external: /^https?:\/\//i.test(destination) && !isPartemaquinas,
  };
}
