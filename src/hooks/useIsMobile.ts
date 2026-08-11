"use client";

import { useSyncExternalStore } from "react";

/** lg breakpoint — mobile shell below this width. */
export const MOBILE_MAX_WIDTH = 1024;

const POINTER_COARSE = "(pointer: coarse)";
const WIDTH_QUERY = `(max-width: ${MOBILE_MAX_WIDTH - 1}px)`;

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const coarse = window.matchMedia(POINTER_COARSE);
  const narrow = window.matchMedia(WIDTH_QUERY);
  coarse.addEventListener("change", callback);
  narrow.addEventListener("change", callback);
  window.addEventListener("resize", callback);
  return () => {
    coarse.removeEventListener("change", callback);
    narrow.removeEventListener("change", callback);
    window.removeEventListener("resize", callback);
  };
}

/** True when pointer is coarse OR viewport width is below 1024px. */
function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia(POINTER_COARSE).matches ||
    window.matchMedia(WIDTH_QUERY).matches
  );
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
