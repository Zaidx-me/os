import { createElement } from "react";
import Safari from "../../app/Safari.jsx";
import { useAppStore } from "../../store/Appstore.js";

export const PENDING_KEY = "zaidos_pending_browser_url";

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 1023px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

/** Open Safari in-place with optional URL (mobile shell + desktop window). */
export function openBrowser(url) {
  if (typeof window === "undefined") return;

  const target = url?.trim() || null;
  if (target) sessionStorage.setItem(PENDING_KEY, target);

  window.dispatchEvent(
    new CustomEvent("zaidos:open-browser", { detail: { url: target } }),
  );

  if (isMobileViewport()) return;

  const { windows, openApp, focusApp, restoreApp } = useAppStore.getState();
  const existing = windows.find((w) => w.appId === "Safari");

  if (existing) {
    if (existing.minimized) restoreApp(existing.id);
    focusApp(existing.id);
  } else {
    openApp("Safari", createElement(Safari));
  }
}

export function peekPendingBrowserUrl() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PENDING_KEY);
}

export function consumePendingBrowserUrl(fallback = "https://zaidx.me") {
  if (typeof window === "undefined") return fallback;
  const url = sessionStorage.getItem(PENDING_KEY);
  sessionStorage.removeItem(PENDING_KEY);
  return url || fallback;
}
