/** Lightweight asset paths — never load multi-MB originals by default. */

export const DEFAULT_DESKTOP_WALLPAPER = "/Wallpaper/optimized/GoldenGate_6k.webp";
export const DEFAULT_LOCK_WALLPAPER = "/images/lockscreen-opt.webp";

/** Gallery picks — optimized WebP only. */
export const OPTIMIZED_WALLPAPERS = [
  { id: "golden-gate", label: "Golden Gate", path: "/Wallpaper/optimized/GoldenGate_6k.webp" },
  { id: "golden-dark", label: "Golden Gate Dark", path: "/Wallpaper/optimized/Golden_Dark_6k.webp" },
  { id: "sonoma-light", label: "Sonoma Light", path: "/Wallpaper/optimized/macOS-Sonoma-light.webp" },
  { id: "air", label: "MacBook Air", path: "/Wallpaper/optimized/15-inch-MacBook-Air-wallpaper-1.webp" },
];

/** Map legacy paths saved in localStorage → optimized equivalent. */
export const WALLPAPER_ALIASES = {
  "/Wallpaper/GoldenGate_6k.png": DEFAULT_DESKTOP_WALLPAPER,
  "/Wallpaper/Golden_Dark_6k.png": "/Wallpaper/optimized/Golden_Dark_6k.webp",
  "/Wallpaper/macOS-Sonoma-light.jpg": "/Wallpaper/optimized/macOS-Sonoma-light.webp",
  "/Wallpaper/15-inch-MacBook-Air-wallpaper-1.webp": "/Wallpaper/optimized/15-inch-MacBook-Air-wallpaper-1.webp",
  "/images/lockscreen.jpg": DEFAULT_LOCK_WALLPAPER,
};

export function resolveWallpaper(stored) {
  if (!stored) return DEFAULT_DESKTOP_WALLPAPER;
  if (WALLPAPER_ALIASES[stored]) return WALLPAPER_ALIASES[stored];
  if (stored.startsWith("data:")) return stored;
  if (stored.includes("/Wallpaper/optimized/")) return stored;

  const wpMatch = stored.match(/^\/Wallpaper\/(.+)\.(png|jpe?g|webp)$/i);
  if (wpMatch) {
    return `/Wallpaper/optimized/${wpMatch[1]}.webp`;
  }

  return stored;
}

export function resolveLockWallpaper(stored) {
  if (!stored) return DEFAULT_LOCK_WALLPAPER;
  return WALLPAPER_ALIASES[stored] ?? resolvePublicImage(stored);
}

export function resolvePicture(stored) {
  if (!stored) return stored;
  if (stored.includes("/pictures/optimized/")) return stored;
  const m = stored.match(/^\/pictures\/(.+)\.(jpg|jpeg|png)$/i);
  if (m) return `/pictures/optimized/${m[1].replace(/\s+/g, "-")}.webp`;
  return stored;
}

export function resolvePublicImage(stored) {
  if (!stored) return stored;
  if (stored.includes("/images/optimized/") || stored.endsWith(".webp")) return stored;
  const m = stored.match(/^\/images\/(.+)\.(jpg|jpeg|png)$/i);
  if (m) return `/images/optimized/${m[1].replace(/\s+/g, "-")}.webp`;
  return stored;
}

/** Resolve any local public asset path to its optimized WebP equivalent. */
export function resolveAsset(stored) {
  if (!stored || stored.startsWith("data:") || stored.startsWith("http")) return stored;
  if (stored.startsWith("/Wallpaper/")) return resolveWallpaper(stored);
  if (stored.startsWith("/pictures/")) return resolvePicture(stored);
  if (stored.startsWith("/images/")) return resolvePublicImage(stored);
  return stored;
}

import { OPTIMIZED_WALLPAPER_PATHS } from "../../generated/wallpaper-manifest.js";

export { OPTIMIZED_WALLPAPER_PATHS };

export function listOptimizedWallpaperPaths() {
  return [...OPTIMIZED_WALLPAPER_PATHS];
}

export const APP_ICON = (id) => `/icons/whitesur/${id}.svg`;

export const DOCK_ICONS = {
  finder: "/icons/system/finder.png",
  launchpad: "/icons/system/launchpad.png",
  trash: "/icons/system/trash.png",
  trashFull: "/icons/system/trash.png",
  github: "/icons/system/github.png",
  linkedin: "/icons/system/linkedin.png",
};
