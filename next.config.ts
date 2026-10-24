import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel uses the default output mode. "standalone" is for Docker/self-hosting.
  // On Vercel, the custom build script with `cp` commands would fail because
  // Vercel handles the build output automatically.
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
