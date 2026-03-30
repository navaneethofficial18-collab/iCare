import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  turbopack: {},
  transpilePackages: ['@caresync/db'],
};

const isDevelopment = process.env.NODE_ENV === "development";

export default isDevelopment
  ? nextConfig
  : require("@ducanh2912/next-pwa").default({
      dest: "public",
      disable: false,
      register: true,
      skipWaiting: true,
    })(nextConfig);


