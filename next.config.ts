import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add allowed dev origins for preview environments
  allowedDevOrigins: [
    '127.0.0.1',
  ],
};

export default nextConfig;
