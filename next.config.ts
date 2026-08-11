import type { NextConfig } from "next";
import path from "node:path";

/** NTFS/exFAT mounts often reject atomic renames in `.next/dev` — override via NEXT_DIST_DIR. */
const distDir =
  process.env.NEXT_DIST_DIR ??
  path.join(process.cwd(), ".next");

const nextConfig: NextConfig = {
  distDir,
  async redirects() {
    return [
      {
        source: "/projects/:slug",
        destination: "/?app=projects",
        permanent: true,
      },
      {
        source: "/contact",
        destination: "/?app=contact",
        permanent: true,
      },
      {
        source: "/uses",
        destination: "/?app=about",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      // Article markdown: `?raw` imports in src/content/article-bodies.ts
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  webpack(config) {
    // webpack dev (`npm run dev` on NTFS) — load `*.md?raw` as string assets
    config.module.rules.push({
      test: /\.md$/,
      resourceQuery: /raw/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
