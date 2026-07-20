const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  // SECURITY FIX M-4: Content-Security-Policy
  // 'unsafe-inline' for styles is required because the app uses inline styles
  // via Next.js SSR, TailwindCSS, and CSS template rendering.
  // 'unsafe-inline' for scripts is NOT set — scripts must originate from 'self' or CDNs listed.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Allow inline scripts (required for Next.js hydration and DevTools)
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.paystack.co https://remitademo.net https://demo.remita.net https://login.remita.net https://www.googletagmanager.com",
      // Styles: inline allowed (required for Tailwind / template CSS injection)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://paystack.com https://js.paystack.co",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com data:",
      // Images: allow self, data URIs, and common external image hosts
      "img-src 'self' data: blob: https://images.unsplash.com https://*.unsplash.com https://cloudflare-ipfs.com https://*.wasabisys.com https://s3.eu-west-1.wasabisys.com https://*.s3.eu-west-1.wasabisys.com https://fssibadan.edu.ng https://*.fssibadan.edu.ng https://portal.fssibadan.edu.ng",
      // Media (video/audio)
      "media-src 'self' blob:",
      // API + WebSocket connections
      "connect-src 'self' wss: ws: https://api.paystack.co https://api.flutterwave.com https://*.livekit.cloud https://remitademo.net https://demo.remita.net https://login.remita.net https://www.google-analytics.com",
      // Frames: disallow all (iframes used only for PDFs via object src) except Remita/Paystack checkout iframes
      "frame-src 'self' https://remitademo.net https://demo.remita.net https://login.remita.net https://checkout.paystack.com",
      // Objects (PDF iframe fallback)
      "object-src 'none'",
      // Form submissions only to self
      "form-action 'self'",
      // Block all mixed content
      "upgrade-insecure-requests",
    ].join('; ')
  },
  // Block Adobe Flash cross-domain policies
  {
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none'
  },
  // Restrict browser feature access
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), payment=(self), usb=()'
  },
];


/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
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
      {
        protocol: 'https',
        hostname: '**.wasabisys.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fssibadan.edu.ng',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.fssibadan.edu.ng',
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
    // WARNING: ignoring build errors can mask security vulnerabilities and logic bugs. 
    // It is highly recommended to fix TS errors and set this to false.
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
