import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statique (GitHub Pages). En dev, basePath reste vide.
  output: "export",
  basePath: process.env.PAGES_BASE_PATH ?? "",
  trailingSlash: true,
};

export default nextConfig;
