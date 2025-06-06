import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    domains: ['assets.peatch.io'],
    // Или более новая конфигурация (Next.js 12.1+):
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.peatch.io',
        pathname: '/cdn-cgi/image/**',
      },
    ],
  },
  optimizeFonts: false,
};

export default nextConfig;
