export default function robots() {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }], sitemap: 'https://partemaquinas.com/sitemap.xml', host: 'https://partemaquinas.com' };
}
