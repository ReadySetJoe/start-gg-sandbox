import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    START_GG_API_KEY: process.env.START_GG_API_KEY,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.start.gg',
      },
      {
        protocol: 'https',
        hostname: '*.start.gg',
      },
    ],
  },
};

export default nextConfig;