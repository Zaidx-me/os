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

/** Hosts that block iframe embedding — open in the system browser instead. */
export function prefersProxy(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host.endsWith(".netlify.app") ||
      host.endsWith(".vercel.app") ||
      host.endsWith(".pages.dev") ||
      host.endsWith(".web.app") ||
      host.endsWith(".github.io")
    );
  } catch {
    return false;
  }
}

/** Open URL in the system browser tab. */
export function openExternalUrl(url) {
  if (!url?.trim() || typeof window === "undefined") return;
  const target = url.trim();
  const link = document.createElement("a");
  link.href = target;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

let externalLinkPromptHandler = null;
const externalLinkPromptQueue = [];
let externalLinkPromptActive = false;

function drainExternalLinkPromptQueue() {
  if (externalLinkPromptActive || !externalLinkPromptQueue.length || !externalLinkPromptHandler) {
    return;
  }

  const { url, resolve } = externalLinkPromptQueue.shift();
  externalLinkPromptActive = true;

  externalLinkPromptHandler(url)
    .then(resolve)
    .finally(() => {
      externalLinkPromptActive = false;
      drainExternalLinkPromptQueue();
    });
}

export function setExternalLinkPromptHandler(handler) {
  externalLinkPromptHandler = handler;
  drainExternalLinkPromptQueue();
}

export function clearExternalLinkPromptHandler() {
  externalLinkPromptHandler = null;
  while (externalLinkPromptQueue.length) {
    externalLinkPromptQueue.shift().resolve(false);
  }
  externalLinkPromptActive = false;
}

/** Ask before opening a URL that cannot load inside ZaidOS. */
export function confirmExternalUrl(url) {
  const target = url?.trim();
  if (!target || typeof window === "undefined") return Promise.resolve(false);

  if (externalLinkPromptHandler) {
    return new Promise((resolve) => {
      externalLinkPromptQueue.push({ url: target, resolve });
      drainExternalLinkPromptQueue();
    });
  }

  return Promise.resolve(
    window.confirm(`${target} can't be opened in ZaidOS. Open it in an external browser tab?`),
  );
}

export async function openExternalUrlWithConfirm(url) {
  const confirmed = await confirmExternalUrl(url);
  if (confirmed) openExternalUrl(url);
  return confirmed;
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

/** Open a project live URL after confirming an external tab when needed. */
export function openProjectLive(url) {
  void openExternalUrlWithConfirm(url);
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
