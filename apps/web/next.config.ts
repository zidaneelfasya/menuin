import type { NextConfig } from "next";

// Domain tunnel untuk development (ngrok / cloudflared) — dibutuhkan saat menguji
// webhook DOKU dari lokal. Tanpa ini Next memblokir server action & aset dev dari domain tsb.
const DEV_TUNNEL_ORIGINS = [
  '*.ngrok-free.app',
  '*.ngrok-free.dev',
  '*.ngrok.app',
  '*.ngrok.dev',
  '*.trycloudflare.com',
];

const nextConfig: NextConfig = {
  allowedDevOrigins: DEV_TUNNEL_ORIGINS,
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        ...DEV_TUNNEL_ORIGINS,
        '*.vercel.app',
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
