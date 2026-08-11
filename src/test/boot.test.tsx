import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BOOT_STORAGE_KEY } from "@/store/boot";

/** Saved/restored around the reduced-motion test — jsdom has no matchMedia. */
let originalMatchMedia: typeof window.matchMedia | undefined;

/**
 * Boot store + BootScreen unit tests.
 *
 * Module isolation: the store rehydrates from localStorage at module load,
 * so every test starts with `vi.resetModules()` and dynamic imports to get a
 * fresh store (and fresh BootScreen graph) per test.
 */
describe("boot store (zustand persist)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it("starts un-booted and flips to booted after completeBoot", async () => {
    const { useBootStore } = await import("@/store/boot");
    expect(useBootStore.getState().booted).toBe(false);
    useBootStore.getState().completeBoot();
    expect(useBootStore.getState().booted).toBe(true);
  });

  it("persists booted=true to localStorage under the zaidos key", async () => {
    const { useBootStore } = await import("@/store/boot");
    useBootStore.getState().completeBoot();
    const raw = localStorage.getItem(BOOT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      state: { booted: true },
      version: 0,
    });
  });

  it("rehydrates booted=true from localStorage on a returning visit", async () => {
    // Simulate a previous visit's persisted state BEFORE the store exists.
    localStorage.setItem(
      BOOT_STORAGE_KEY,
      JSON.stringify({ state: { booted: true }, version: 0 }),
    );
    const { useBootStore } = await import("@/store/boot");
    expect(useBootStore.getState().booted).toBe(true);
  });
});

describe("BootScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalMatchMedia !== undefined || typeof window.matchMedia === "function") {
      if (originalMatchMedia === undefined) {
        delete (window as { matchMedia?: unknown }).matchMedia;
      } else {
        window.matchMedia = originalMatchMedia;
      }
      originalMatchMedia = undefined;
    }
  });

  it("renders the logo and boot-screen test id", async () => {
    const { default: BootScreen } = await import(
      "@/components/wm/BootScreen"
    );
    render(<BootScreen />);
    expect(screen.getByTestId("boot-screen")).toBeInTheDocument();
    expect(screen.getByText("Zaid")).toBeInTheDocument();
    expect(screen.getByText("OS")).toBeInTheDocument();
    expect(screen.getByText("Press any key to skip")).toBeInTheDocument();
  });

  it("types the three systemd logs in order", async () => {
    const { default: BootScreen } = await import(
      "@/components/wm/BootScreen"
    );
    render(<BootScreen />);

    // Typewriter just started: no full log line yet.
    expect(screen.queryByText(/Started ZaidOS/)).not.toBeInTheDocument();

    // ~1.6s in: all three lines are fully typed (typing finishes ~1.52s).
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(
      screen.getByText(/\[ OK \] Started ZaidOS - the only OS cooler/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\[ OK \] Mounted \/dev\/zaid on \/home/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/\[ OK \] Started Hyprland\.web compositor/),
    ).toBeInTheDocument();
  });

  it("auto-advances (completeBoot) after ~5.5s without interaction", async () => {
    const { useBootStore } = await import("@/store/boot");
    const { default: BootScreen } = await import(
      "@/components/wm/BootScreen"
    );
    render(<BootScreen />);
    expect(useBootStore.getState().booted).toBe(false);

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(useBootStore.getState().booted).toBe(true);
  });

  it("skips immediately on any key press", async () => {
    const { useBootStore } = await import("@/store/boot");
    const { default: BootScreen } = await import(
      "@/components/wm/BootScreen"
    );
    render(<BootScreen />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(useBootStore.getState().booted).toBe(true);
  });

  it("skips immediately on pointer down (click anywhere)", async () => {
    const { useBootStore } = await import("@/store/boot");
    const { default: BootScreen } = await import(
      "@/components/wm/BootScreen"
    );
    render(<BootScreen />);
    fireEvent.pointerDown(screen.getByTestId("boot-screen"));
    expect(useBootStore.getState().booted).toBe(true);
  });

  it("renders instantly and advances on its own under reduced motion", async () => {
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

    const { useBootStore } = await import("@/store/boot");
    const { default: BootScreen } = await import(
      "@/components/wm/BootScreen"
    );
    render(<BootScreen />);

    // No typewriter: all logs are fully visible on first render.
    expect(
      screen.getByText(/\[ OK \] Started Hyprland\.web compositor/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Press any key to skip"),
    ).not.toBeInTheDocument();

    // Advances without any interaction after the short reduced hold.
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(useBootStore.getState().booted).toBe(true);
  });
});
