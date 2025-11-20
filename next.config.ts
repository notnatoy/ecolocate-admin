import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Allow all Supabase project URLs
      },
    ],
  },
};

export default nextConfig;