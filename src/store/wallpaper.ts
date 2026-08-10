import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** localStorage key under which the active wallpaper type is persisted. */
export const WALLPAPER_STORAGE_KEY = "zaidos-wallpaper";

/** Every wallpaper variant the engine can render, in render order. */
export const WALLPAPER_TYPES = ["matrix", "gradient", "dark", "light"] as const;

export type WallpaperType = (typeof WALLPAPER_TYPES)[number];

/** Type guard for WallpaperType — also rejects any persisted junk. */
export function isWallpaperType(value: unknown): value is WallpaperType {
  return WALLPAPER_TYPES.some((type) => type === value);
}

export interface WallpaperState {
  /** Active wallpaper variant. */
  type: WallpaperType;
  /** Switches the active wallpaper; persists via the middleware. */
  setWallpaper: (type: WallpaperType) => void;
}

/**
 * Wallpaper persistence — same pattern as boot.ts.
 *
 * SSR note: `createJSONStorage(() => localStorage)` defers the localStorage
 * read into the storage factory, which zustand wraps in try/catch — on the
 * server the reference throws, storage becomes undefined, and hydration is
 * skipped, so the store keeps its initial `type: "matrix"` for SSR. With
 * sync localStorage the rehydration is synchronous, so the wallpaper is
 * already applied before the desktop shell first paints — no flicker.
 */
export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set) => ({
      type: "matrix",
      setWallpaper: (type) => set({ type }),
    }),
    {
      name: WALLPAPER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only the type is worth persisting; actions are recreated on rehydrate.
      partialize: (state) => ({ type: state.type }),
      // Guard against corrupted/out-of-range persisted values: anything that
      // is not a known variant falls back to the default instead of leaving
      // the wallpaper layer empty.
      merge: (persisted, current) => {
        const saved = persisted as { type?: unknown } | null;
        return {
          ...current,
          type: isWallpaperType(saved?.type) ? saved.type : current.type,
        };
      },
    },
  ),
);

/** Selector for the active wallpaper type (stable per state change). */
export const selectWallpaperType = (state: WallpaperState) => state.type;

/**
 * Dev-only debug handle so the e2e suite can drive wallpaper changes before
 * the real picker UI exists (todo 10 context menu "Change Wallpaper"). The
 * handle is attached only in development builds (Next inlines NODE_ENV) and
 * never on the server.
 */
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const w = window as Window & {
    __zaidosWallpaper?: { setWallpaper: (type: WallpaperType) => void };
  };
  w.__zaidosWallpaper = {
    setWallpaper: (type) => useWallpaperStore.getState().setWallpaper(type),
  };
}
