import { openApp } from "@/lib/wm/actions";
import { resolveBrowserUrl, useBrowserStore } from "@/store/browser";

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 1023px)").matches
  );
}

/**
 * Opens the Browser app in-place. On mobile, dispatches an event for MobileShell
 * instead of creating a desktop WM window.
 */
export function openBrowser(rawUrl?: string): string | null {
  if (rawUrl) {
    useBrowserStore.getState().navigate(resolveBrowserUrl(rawUrl));
  }

  if (isMobileViewport()) {
    window.dispatchEvent(new CustomEvent("zaidos:open-browser"));
    return null;
  }

  return openApp("browser");
}
