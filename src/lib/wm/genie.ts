import {
  GENIE_DURATION_MS,
  GENIE_MOBILE_SLICE_COUNT,
  GENIE_SLICE_COUNT,
  runGenieSliceAnimation,
} from "@/lib/wm/genie-slices";

export type { GenieRect as GenieTarget } from "@/lib/wm/genie-slices";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * macOS Genie / Magic Lamp minimize — sliced mesh warp into the dock icon.
 */
export async function playGenieMinimize(
  windowEl: HTMLElement,
  targetEl: HTMLElement,
): Promise<void> {
  if (prefersReducedMotion()) return;

  await runGenieSliceAnimation(windowEl, targetEl, {
    sliceCount: GENIE_SLICE_COUNT,
    durationMs: GENIE_DURATION_MS,
  });
}

/** Mobile full-screen dismiss toward dock icon or home indicator. */
export async function playMobileGenieDismiss(
  screenEl: HTMLElement,
  targetEl: HTMLElement,
): Promise<void> {
  if (prefersReducedMotion()) return;

  await runGenieSliceAnimation(screenEl, targetEl, {
    sliceCount: GENIE_MOBILE_SLICE_COUNT,
    durationMs: GENIE_DURATION_MS,
  });
}

export { GENIE_DURATION_MS as GENIE_MS };
