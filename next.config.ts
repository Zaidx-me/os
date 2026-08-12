import type { NextConfig } from "next";

/** NTFS/exFAT mounts often reject atomic renames in `.next/dev` — dev-only via NEXT_DIST_DIR. */
const distDir =
  process.env.NODE_ENV === "development" && process.env.NEXT_DIST_DIR
    ? process.env.NEXT_DIST_DIR
    : ".next";

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
