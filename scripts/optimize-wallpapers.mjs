#!/usr/bin/env node
/** Generate 1920px WebP wallpapers — run after adding new Wallpaper/* sources. */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";

const root = new URL("../public/Wallpaper", import.meta.url).pathname;
const out = join(root, "optimized");
mkdirSync(out, { recursive: true });

const sources = readdirSync(root).filter((f) =>
  /\.(png|jpe?g|webp)$/i.test(f) && !f.startsWith("optimized"),
);

for (const file of sources) {
  const base = basename(file, extname(file));
  const dest = join(out, `${base}.webp`);
  if (existsSync(dest)) continue;
  try {
    execSync(
      `magick "${join(root, file)}" -resize 1920x1080^ -gravity center -extent 1920x1080 -strip -quality 80 "${dest}"`,
      { stdio: "inherit" },
    );
  } catch {
    console.warn("skip", file);
  }
}

console.log("Done — use /Wallpaper/optimized/*.webp in the app.");
