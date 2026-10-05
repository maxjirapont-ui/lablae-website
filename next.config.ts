import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sqlite3", "sharp", "pdfjs-dist"],
};

export default nextConfig;
