import { createElement } from "react";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WALLPAPER_STORAGE_KEY } from "@/store/wallpaper";

describe("wallpaper store (zustand persist)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("defaults to the teal wallpaper", async () => {
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("teal");
  });

  it("persists the chosen wallpaper under the zaidos key", async () => {
    const { useWallpaperStore } = await import("@/store/wallpaper");
    useWallpaperStore.getState().setWallpaper("slate");
    const raw = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      state: { type: "slate" },
      version: 0,
    });
  });

  it("rehydrates a persisted wallpaper on a returning visit", async () => {
    localStorage.setItem(
      WALLPAPER_STORAGE_KEY,
      JSON.stringify({ state: { type: "sky" }, version: 0 }),
    );
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("sky");
  });

  it("migrates legacy matrix to slate", async () => {
    localStorage.setItem(
      WALLPAPER_STORAGE_KEY,
      JSON.stringify({ state: { type: "matrix" }, version: 0 }),
    );
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("slate");
  });

  it("falls back to teal when the persisted value is invalid", async () => {
    localStorage.setItem(
      WALLPAPER_STORAGE_KEY,
      JSON.stringify({ state: { type: "neon" }, version: 0 }),
    );
    const { useWallpaperStore } = await import("@/store/wallpaper");
    expect(useWallpaperStore.getState().type).toBe("teal");
  });
});

describe("Wallpaper wrapper", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders data-theme and flips it on setWallpaper", async () => {
    const { default: Wallpaper } = await import("@/components/wm/Wallpaper");
    const { useWallpaperStore } = await import("@/store/wallpaper");

    render(createElement(Wallpaper));

    const wallpaper = screen.getByTestId("wallpaper");
    expect(wallpaper).toHaveAttribute("data-theme", "teal");
    expect(screen.getByTestId("teal-wallpaper")).toBeInTheDocument();

    act(() => {
      useWallpaperStore.getState().setWallpaper("sand");
    });
    expect(wallpaper).toHaveAttribute("data-theme", "sand");
    expect(screen.getByTestId("sand-wallpaper")).toBeInTheDocument();
  });
});
