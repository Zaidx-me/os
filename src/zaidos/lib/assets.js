/** Lightweight asset paths — never load 6K originals by default. */

export const DEFAULT_DESKTOP_WALLPAPER = "/Wallpaper/optimized/GoldenGate_6k.webp";
export const DEFAULT_LOCK_WALLPAPER = "/images/lockscreen-opt.webp";

/** Gallery picks — optimized WebP only (≤ ~200KB each). */
export const OPTIMIZED_WALLPAPERS = [
  { id: "golden-gate", label: "Golden Gate", path: "/Wallpaper/optimized/GoldenGate_6k.webp" },
  { id: "golden-dark", label: "Golden Gate Dark", path: "/Wallpaper/optimized/Golden_Dark_6k.webp" },
  { id: "sonoma-light", label: "Sonoma Light", path: "/Wallpaper/optimized/macOS-Sonoma-light.webp" },
  { id: "air", label: "MacBook Air", path: "/Wallpaper/optimized/15-inch-MacBook-Air-wallpaper-1.webp" },
];

/** Map legacy 6K paths saved in localStorage → optimized equivalent. */
export const WALLPAPER_ALIASES = {
  "/Wallpaper/GoldenGate_6k.png": DEFAULT_DESKTOP_WALLPAPER,
  "/Wallpaper/Golden_Dark_6k.png": "/Wallpaper/optimized/Golden_Dark_6k.webp",
  "/Wallpaper/macOS-Sonoma-light.jpg": "/Wallpaper/optimized/macOS-Sonoma-light.webp",
  "/Wallpaper/15-inch-MacBook-Air-wallpaper-1.webp": "/Wallpaper/optimized/15-inch-MacBook-Air-wallpaper-1.webp",
  "/images/lockscreen.jpg": DEFAULT_LOCK_WALLPAPER,
};

/** Prefer lightweight WebP — never load multi-MB PNG/JPEG on mobile. */
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
  return WALLPAPER_ALIASES[stored] ?? stored;
}

/** Local WhiteSur SVG — no remote CDN fetches. */
export const APP_ICON = (id) => `/icons/whitesur/${id}.svg`;

export const DOCK_ICONS = {
  finder: APP_ICON("files"),
  launchpad: APP_ICON("settings"),
  trash: "/icons/trash.png",
  trashFull: "/icons/trash.png",
  github: APP_ICON("projects"),
  linkedin: APP_ICON("contact"),
};
