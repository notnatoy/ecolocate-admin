import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",  // Allow all Supabase project URLs
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",  // Allow Unsplash images
      },
    ],
  },
};

export default nextConfig;