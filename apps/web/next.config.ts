import type { NextConfig } from "next";

const API_HOST = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.queztlearn.com"
).host;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@academyx/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: API_HOST },
      { protocol: "https", hostname: "cdn.queztlearn.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"],
  },
};

export default nextConfig;
