import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { MOBILE_MAX_WIDTH, useIsMobile } from "@/hooks/useIsMobile";

function stubMatchMedia(overrides: {
  coarse?: boolean;
  narrow?: boolean;
}) {
  const coarse = overrides.coarse ?? false;
  const narrow = overrides.narrow ?? false;
  window.matchMedia = (query: string) => ({
    matches:
      query === "(pointer: coarse)"
        ? coarse
        : query === `(max-width: ${MOBILE_MAX_WIDTH - 1}px)`
          ? narrow
          : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}

describe("useIsMobile", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1440,
    });
    stubMatchMedia({ coarse: false, narrow: false });
  });

  it("returns false on wide viewport with fine pointer", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when pointer is coarse", () => {
    stubMatchMedia({ coarse: true, narrow: false });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns true when width is below 1024px", () => {
    stubMatchMedia({ coarse: false, narrow: true });
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
