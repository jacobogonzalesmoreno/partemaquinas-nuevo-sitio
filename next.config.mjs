/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    '/api/upload': [
      './node_modules/**/*',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'partemaquinas.com' },
      { protocol: 'https', hostname: 'www.partemaquinas.com' },
      { protocol: 'https', hostname: 'img.partemaquinas.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};
export default nextConfig;