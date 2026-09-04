import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sqlite3", "sharp"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
