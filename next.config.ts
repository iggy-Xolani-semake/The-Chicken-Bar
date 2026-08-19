import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Without this, next/image refuses to optimize images from Supabase
    // Storage at all (external domains are blocked by default) — every
    // uploaded menu/gallery/event photo would fall back to being served
    // at full original size regardless of what component renders it,
    // which is the root cause of slow image loads on first visit.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "csvaqltumrrrmhtsdtxt.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
