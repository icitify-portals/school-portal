/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['mysql2'],
  allowedDevOrigins: [
    '127.0.0.1:3000', 
    'localhost:3000', 
    'ajatschools.local:3000', 
    'citadeluniversity.local:3000'
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
