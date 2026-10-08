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
        source: '/pro',
        destination: '/pricing',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
