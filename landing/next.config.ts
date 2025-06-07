import type { NextConfig } from "next";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

const nextConfig: () => Promise<NextConfig> = async () => {
  if (process.env.NODE_ENV === "development") {
    const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
    await setupDevPlatform();
  }

  return {
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
};


export default nextConfig;
