import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the MDX remote renderer to process uploaded files
  serverExternalPackages: ["@mdx-js/mdx", "next-mdx-remote"],
};

export default nextConfig;
