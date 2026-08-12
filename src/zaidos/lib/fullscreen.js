/** Request browser fullscreen — best-effort (needs a user gesture on some mobile browsers). */
export function enterFullscreen() {
  const elem = document.documentElement;
  try {
    if (elem.requestFullscreen) {
      return elem.requestFullscreen().catch(() => {});
    }
    if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
      return;
    }
    if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } catch {
    /* ignore — unlock tap will retry on mobile */
  }
}

/** Nudge mobile browsers to collapse the URL bar when fullscreen API is unavailable. */
export function hideMobileBrowserChrome() {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    window.scrollTo(0, 1);
    window.requestAnimationFrame(() => window.scrollTo(0, 0));
  });
}
