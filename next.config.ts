import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    rules: {
      // Article markdown bodies (todo 23) load as raw text via
      // import.meta.glob(..., { query: "?raw" }) in src/content/article-bodies.ts.
      // Vite (vitest) resolves "?raw" natively; Turbopack requires a registered
      // loader for the .md extension — raw-loader is the documented tested one.
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
