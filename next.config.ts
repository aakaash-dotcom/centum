import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/papers',
        destination: '/materials',
        permanent: true,
      },
      {
        source: '/pro-materials',
        destination: '/pro',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
