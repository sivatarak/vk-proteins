import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(), // <-- FIX
  },
  reactStrictMode: true,
};

export default nextConfig;
