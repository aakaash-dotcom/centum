import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/papers',
        destination: '/materials',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
