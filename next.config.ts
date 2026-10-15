import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: `output: "standalone"` was set previously, but it's wrong for Vercel.
  // Vercel uses its own build process. Standalone is only for self-hosted (Docker).
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
