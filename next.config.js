/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Per produzione Fly.io
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.fly.dev',
      },
      {
        protocol: 'https',
        hostname: 'try-mellow.com',
      },
      {
        protocol: 'https',
        hostname: '*.shopifycdn.com',
      },
    ],
  },
  // Rewrites non necessari - server.js custom gestisce le API routes
}

module.exports = nextConfig

