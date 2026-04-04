import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'www.jumia.com.ng' },
      { protocol: 'https', hostname: 'ng.jumia.is' },
      { protocol: 'https', hostname: 'konga.com' },
      { protocol: 'https', hostname: 'static.konga.com' }
    ],
  },
};

export default nextConfig;
