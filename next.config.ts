import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-only modules used by API/jobs
  serverExternalPackages: ["pg"],
};

export default nextConfig;
