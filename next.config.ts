import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/dashboard": ["./data/airdrops/**/*"],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
