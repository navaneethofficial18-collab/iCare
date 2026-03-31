import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  turbopack: {},
  transpilePackages: ['@caresync/db'],
};

export default nextConfig;


