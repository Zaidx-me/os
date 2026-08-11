import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const WALLPAPER_STORAGE_KEY = "zaidos-wallpaper";

/** Static desktop backgrounds only — no animation. */
export const WALLPAPER_TYPES = ["slate", "teal", "sky", "sand"] as const;

export type WallpaperType = (typeof WALLPAPER_TYPES)[number];

export function isWallpaperType(value: unknown): value is WallpaperType {
  return WALLPAPER_TYPES.some((type) => type === value);
}

const LEGACY_WALLPAPER: Record<string, WallpaperType> = {
  matrix: "slate",
  gradient: "sky",
  dark: "slate",
  light: "sand",
};

function normalizeWallpaperType(value: unknown): WallpaperType {
  if (isWallpaperType(value)) return value;
  if (typeof value === "string" && LEGACY_WALLPAPER[value]) {
    return LEGACY_WALLPAPER[value];
  }
  return "teal";
}

export interface WallpaperState {
  type: WallpaperType;
  setWallpaper: (type: WallpaperType) => void;
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set) => ({
      type: "teal",
      setWallpaper: (type) => set({ type }),
    }),
    {
      name: WALLPAPER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ type: state.type }),
      merge: (persisted, current) => {
        const saved = persisted as { type?: unknown } | null;
        return {
          ...current,
          type: normalizeWallpaperType(saved?.type),
        };
      },
    },
  ),
);

export const selectWallpaperType = (state: WallpaperState) => state.type;

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const w = window as Window & {
    __zaidosWallpaper?: { setWallpaper: (type: WallpaperType) => void };
  };
  w.__zaidosWallpaper = {
    setWallpaper: (type) => useWallpaperStore.getState().setWallpaper(type),
  };
}
