/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      '/api/upload': [
        './node_modules/**/*',
      ],
    },
  },
};

export default nextConfig;