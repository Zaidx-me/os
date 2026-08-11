import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useSettingsStore } from "@/store/settings";

function stubMatchMedia(reduced: boolean) {
  window.matchMedia = (query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? reduced : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}

describe("useReducedMotion", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({
      animationsEnabled: true,
      blurEnabled: true,
      aiChatEnabled: false,
      accent: "classic",
    });
    stubMatchMedia(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when animations enabled and system allows motion", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when system prefers reduced motion", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("returns true when Settings animations toggle is off", () => {
    useSettingsStore.setState({ animationsEnabled: false });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });
});
