import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/grouped_faces/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/memory_videos/**',
      },
      {
        protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https',
        hostname: process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^https?:\/\//, '') || 'localhost',
        port: '5000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;