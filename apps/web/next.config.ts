import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.ngrok-free.app', '*.ngrok.app', '*.ngrok.dev']
    }
  }
};

export default nextConfig;
