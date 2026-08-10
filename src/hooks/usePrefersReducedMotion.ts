"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `(prefers-reduced-motion: reduce)` via useSyncExternalStore — the canonical
 * external-store subscription, so no setState-in-effect. jsdom has no
 * matchMedia, so both accessors guard on it and report false (full motion);
 * unit tests can stub matchMedia to exercise the reduced path.
 */
function subscribe(callback: () => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => {};
  }
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
