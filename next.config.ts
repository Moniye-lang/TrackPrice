import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'www.jumia.com.ng' },
      { protocol: 'https', hostname: 'ng.jumia.is' },
      { protocol: 'https', hostname: 'konga.com' },
      { protocol: 'https', hostname: 'static.konga.com' },
      // Open Food Facts CDN
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: 'static.openfoodfacts.org' },
      { protocol: 'https', hostname: 'world.openfoodfacts.org' },
      // Wikipedia / Wikimedia
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '*.wikipedia.org' },
      // Supermart.ng / Nigerian stores
      { protocol: 'https', hostname: 'supermart.ng' },
      { protocol: 'https', hostname: 'cdn.supermart.ng' },
      // General wildcard for other product image sources
      { protocol: 'https', hostname: '**.com' },
      { protocol: 'https', hostname: '**.ng' },
      { protocol: 'https', hostname: '**.net' },
      { protocol: 'https', hostname: '**.org' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
};

export default nextConfig;
