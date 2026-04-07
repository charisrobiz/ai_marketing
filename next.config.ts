import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Turbopack has a bug with Korean character byte boundaries in error messages
    // Use tsc directly for type checking instead
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
