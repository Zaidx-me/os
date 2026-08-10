import { createElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WALLPAPER_STORAGE_KEY } from "@/store/wallpaper";

/** Saved/restored around reduced-motion tests — jsdom has no matchMedia. */
let originalMatchMedia: typeof window.matchMedia | undefined;

/**
 * jsdom has no Canvas 2D context (`getContext` returns null), so MatrixRain
 * mounts inside the Wallpaper wrapper as a no-op unless we stub it. This
 * Proxy answers any method call with a no-op function and accepts any
 * property assignment, letting the renderer initialize (and its effect
 * clean up) exactly like in a browser. Real pixels are covered by the e2e
 * spec.
 */
function createCtxStub(): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = {};
  return new Proxy(target, {
    get: (_t, prop) => {
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set: (t, prop, value) => {
      t[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

/**
 * Wallpaper store unit tests. Module isolation: the store rehydrates from
 * localStorage at module load, so every test starts with `vi.resetModules()`
 * and dynamic imports to get a fresh store per test.
 */
describe("wallpaper store (zustand persist)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("defaults to the matrix wallpaper", async () => {
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("matrix");
  });

  it("persists the chosen wallpaper under the zaidos key", async () => {
    const { useWallpaperStore } = await import("@/store/wallpaper");
    useWallpaperStore.getState().setWallpaper("dark");
    const raw = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      state: { type: "dark" },
      version: 0,
    });
  });

  it("rehydrates a persisted wallpaper on a returning visit", async () => {
    // Simulate a previous visit's persisted state BEFORE the store exists.
    localStorage.setItem(
      WALLPAPER_STORAGE_KEY,
      JSON.stringify({ state: { type: "gradient" }, version: 0 }),
    );
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("gradient");
  });

  it("falls back to matrix when the persisted value is invalid", async () => {
    localStorage.setItem(
      WALLPAPER_STORAGE_KEY,
      JSON.stringify({ state: { type: "neon" }, version: 0 }),
    );
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("matrix");
  });
});

describe("Wallpaper wrapper", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => createCtxStub(),
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  afterEach(() => {
    if (originalMatchMedia !== undefined || typeof window.matchMedia === "function") {
      if (originalMatchMedia === undefined) {
        delete (window as { matchMedia?: unknown }).matchMedia;
      } else {
        window.matchMedia = originalMatchMedia;
      }
      originalMatchMedia = undefined;
    }
  });

  it("renders data-theme and flips it on setWallpaper", async () => {
    const { default: Wallpaper } = await import("@/components/wm/Wallpaper");
    const { useWallpaperStore } = await import("@/store/wallpaper");

    render(createElement(Wallpaper));

    const wallpaper = screen.getByTestId("wallpaper");
    expect(wallpaper).toHaveAttribute("data-theme", "matrix");
    // Default matrix variant mounts the canvas.
    expect(screen.getByTestId("matrix-rain")).toBeInTheDocument();

    act(() => {
      useWallpaperStore.getState().setWallpaper("dark");
    });
    expect(wallpaper).toHaveAttribute("data-theme", "dark");
    expect(screen.getByTestId("dark-wallpaper")).toBeInTheDocument();
  });

  it("matrix renders exactly one static frame under reduced motion", async () => {
    originalMatchMedia = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    const { default: Wallpaper } = await import("@/components/wm/Wallpaper");

    render(createElement(Wallpaper));

    // The static-frame counter is frozen at 1 — no rAF loop ever starts.
    const canvas = screen.getByTestId("matrix-rain");
    expect(canvas).toHaveAttribute("data-frames", "1");
  });
});
