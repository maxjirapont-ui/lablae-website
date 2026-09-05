import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sqlite3", "sharp"],
};

export default nextConfig;
