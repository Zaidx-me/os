import { resolveWallpaper } from "../zaidos/lib/assets.js";

/**
 * Depth Wallpaper Presets keyed by optimized WebP basename (without extension).
 */
export const depthPresetsBySlug = {
  "big-sur-mountains-night-dark-macos-big-sur-stock-california-6016x6016-1493": {
    name: "Big Sur Mountains Night",
    subjectTop: 26,
    suitable: true,
  },
  "macos-big-sur-stock-night-lone-tree-sedimentary-rocks-6016x6016-3776": {
    name: "Big Sur Lone Tree",
    subjectTop: 30,
    suitable: true,
  },
  "11-0-Big-Sur-Day-6k": {
    name: "Big Sur Day",
    subjectTop: 28,
    suitable: true,
  },
  GoldenGate_6k: {
    name: "Golden Gate",
    subjectTop: 34,
    suitable: true,
  },
  Golden_Dark_6k: {
    name: "Golden Gate Dark",
    subjectTop: 34,
    suitable: true,
  },
  "golden-gate-bridge-san-francicso-lg": {
    name: "Golden Gate Bridge",
    subjectTop: 36,
    suitable: true,
  },
  "13-Ventura-Light": {
    name: "Ventura Light",
    subjectTop: 30,
    suitable: true,
  },
  "macOS-Catalina-Dark-Mode": {
    name: "Catalina Dark",
    subjectTop: 32,
    suitable: true,
  },
  "26-Tahoe-Beach-Dawn-thumb": {
    name: "Tahoe Beach Dawn",
    subjectTop: 35,
    suitable: true,
  },
  "26-Tahoe-Light-6K-thumb": {
    name: "Tahoe Light",
    subjectTop: 32,
    suitable: true,
  },
  "chris-brignola-n7n-nkadHRM-unsplash": {
    name: "Mountain Landscape",
    subjectTop: 28,
    suitable: true,
  },
  "formula-1-formula-cars-ferrari-ferrari-f1-ferrari-formula-1-hd-wallpaper-79f662068bca0f4ad0cb02dae8b765b3": {
    name: "Formula 1",
    subjectTop: 40,
    suitable: true,
  },
  "macOS-Sonoma-light": {
    name: "Sonoma Light",
    subjectTop: 30,
    suitable: true,
  },
  "macOS-Sonomaa-dark": {
    name: "Sonoma Dark",
    subjectTop: 30,
    suitable: true,
  },
  "depth-mountain-peak": {
    name: "Depth Mountain Peak",
    subjectTop: 25,
    suitable: true,
    recommended: true,
  },
};

function wallpaperSlug(path) {
  const resolved = resolveWallpaper(path);
  const file = resolved.split("/").pop() ?? "";
  return file.replace(/\.webp$/i, "");
}

export const getDepthPreset = (wallpaperPath) => {
  const slug = wallpaperSlug(wallpaperPath);
  return (
    depthPresetsBySlug[slug] || {
      name: "Custom",
      subjectTop: 30,
      suitable: true,
    }
  );
};

export const hasDepthPreset = (wallpaperPath) => {
  return wallpaperSlug(wallpaperPath) in depthPresetsBySlug;
};

/** @deprecated use depthPresetsBySlug */
export const depthPresets = depthPresetsBySlug;
