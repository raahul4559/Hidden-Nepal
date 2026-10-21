import type { NextConfig } from "next";

import { REMOTE_IMAGE_HOSTS } from "./src/lib/images";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Gallery uploads are limited to 8 MB by the upload action itself.
    serverActions: { bodySizeLimit: "10mb" },
  },
  async redirects() {
    return [{ source: "/destinations", destination: "/explore", permanent: false }];
  },
  images: {
    remotePatterns: REMOTE_IMAGE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
