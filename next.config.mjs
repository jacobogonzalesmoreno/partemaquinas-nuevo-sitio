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
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      ],
    }];
  },
};
export default nextConfig;
