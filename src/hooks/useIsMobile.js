import { useSyncExternalStore } from "react";

export const MOBILE_MAX_WIDTH = 1024;
const WIDTH_QUERY = `(max-width: ${MOBILE_MAX_WIDTH - 1}px)`;
const POINTER_COARSE = "(pointer: coarse)";

function subscribe(cb) {
  if (typeof window === "undefined") return () => {};
  const narrow = window.matchMedia(WIDTH_QUERY);
  const coarse = window.matchMedia(POINTER_COARSE);
  narrow.addEventListener("change", cb);
  coarse.addEventListener("change", cb);
  window.addEventListener("orientationchange", cb);
  return () => {
    narrow.removeEventListener("change", cb);
    coarse.removeEventListener("change", cb);
    window.removeEventListener("orientationchange", cb);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(WIDTH_QUERY).matches || window.matchMedia(POINTER_COARSE).matches;
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
