import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Avoid a Turbopack HMR restart loop after restarting `next dev`.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
