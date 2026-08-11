import { motionTokens } from "@/lib/motion/spring";

export const GENIE_SLICE_COUNT = 28;
export const GENIE_MOBILE_SLICE_COUNT = 20;
export const GENIE_DURATION_MS = Math.round(motionTokens.duration.minimize * 1000);

export interface GenieRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Ease-in curve from the UIKit reference: sin(t * π/2). */
export function genieEaseIn(progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return Math.sin((t * Math.PI) / 2);
}

/**
 * Per-slice progress — bottom bands lead (magic-lamp suck toward dock).
 * @param band 0 at top slice, 1 at bottom slice
 */
export function genieSliceProgress(
  globalProgress: number,
  band: number,
  stagger = 0.38,
): number {
  const delay = (1 - band) * stagger;
  const local = (globalProgress - delay) / (1 - delay);
  if (local <= 0) return 0;
  return genieEaseIn(Math.min(1, local));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolateRect(from: GenieRect, to: GenieRect, t: number): GenieRect {
  return {
    x: lerp(from.x, to.x, t),
    y: lerp(from.y, to.y, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t),
  };
}

export function sliceStartRects(source: GenieRect, count: number): GenieRect[] {
  const sliceH = source.height / count;
  return Array.from({ length: count }, (_, i) => ({
    x: source.x,
    y: source.y + i * sliceH,
    width: source.width,
    height: sliceH,
  }));
}

/** Each horizontal band collapses into the destination rect (dock / home indicator). */
export function sliceEndRects(source: GenieRect, target: GenieRect, count: number): GenieRect[] {
  const targetCx = target.x + target.width / 2;
  const targetCy = target.y + target.height / 2;

  return Array.from({ length: count }, (_, i) => {
    const band = count <= 1 ? 1 : i / (count - 1);
    const w = Math.max(2, target.width * (0.12 + 0.55 * band));
    const h = Math.max(1, (target.height * 0.85) / count);
    return {
      x: targetCx - w / 2,
      y: lerp(source.y, targetCy - target.height * 0.35, band) + (i / count) * target.height * 0.25,
      width: w,
      height: h,
    };
  });
}

interface GenieSliceNode {
  shell: HTMLDivElement;
  inner: HTMLDivElement;
  start: GenieRect;
  end: GenieRect;
  index: number;
  sourceHeight: number;
}

function buildSliceOverlay(
  sourceEl: HTMLElement,
  source: GenieRect,
  target: GenieRect,
  sliceCount: number,
): { overlay: HTMLDivElement; slices: GenieSliceNode[] } {
  const overlay = document.createElement("div");
  overlay.className = "genie-overlay";
  overlay.setAttribute("aria-hidden", "true");

  const clone = sourceEl.cloneNode(true) as HTMLElement;
  clone.setAttribute("aria-hidden", "true");
  clone.style.pointerEvents = "none";
  clone.style.margin = "0";
  clone.style.position = "relative";

  const starts = sliceStartRects(source, sliceCount);
  const ends = sliceEndRects(source, target, sliceCount);
  const sliceH = source.height / sliceCount;

  const slices: GenieSliceNode[] = starts.map((start, index) => {
    const shell = document.createElement("div");
    shell.className = "genie-slice";
    shell.style.left = `${start.x}px`;
    shell.style.top = `${start.y}px`;
    shell.style.width = `${start.width}px`;
    shell.style.height = `${start.height}px`;

    const inner = document.createElement("div");
    inner.className = "genie-slice-inner";
    inner.style.width = `${source.width}px`;
    inner.style.height = `${source.height}px`;
    inner.style.marginTop = `${-index * sliceH}px`;

    if (index === 0) {
      inner.appendChild(clone);
    } else {
      inner.appendChild(clone.cloneNode(true));
    }

    shell.appendChild(inner);
    overlay.appendChild(shell);

    return {
      shell,
      inner,
      start,
      end: ends[index]!,
      index,
      sourceHeight: sliceH,
    };
  });

  return { overlay, slices };
}

function applySliceFrame(
  slice: GenieSliceNode,
  rect: GenieRect,
  sourceWidth: number,
): void {
  slice.shell.style.left = `${rect.x}px`;
  slice.shell.style.top = `${rect.y}px`;
  slice.shell.style.width = `${rect.width}px`;
  slice.shell.style.height = `${rect.height}px`;

  const scaleX = rect.width / sourceWidth;
  const scaleY = rect.height / slice.sourceHeight;
  slice.inner.style.transform = `scale(${scaleX}, ${scaleY})`;
  slice.inner.style.transformOrigin = "top left";
}

/**
 * Magic-lamp / Genie minimize — horizontal mesh slices warped toward a target rect.
 */
export async function runGenieSliceAnimation(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  options?: { sliceCount?: number; durationMs?: number },
): Promise<void> {
  const sliceCount = options?.sliceCount ?? GENIE_SLICE_COUNT;
  const durationMs = options?.durationMs ?? GENIE_DURATION_MS;

  const source = rectFromEl(sourceEl);
  const target = rectFromEl(targetEl);
  if (source.width <= 0 || source.height <= 0) return;

  const prevVisibility = sourceEl.style.visibility;
  const prevPointer = sourceEl.style.pointerEvents;
  sourceEl.style.visibility = "hidden";
  sourceEl.style.pointerEvents = "none";

  const { overlay, slices } = buildSliceOverlay(sourceEl, source, target, sliceCount);
  document.body.appendChild(overlay);

  try {
    await new Promise<void>((resolve) => {
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / durationMs);

        slices.forEach((slice, i) => {
          const band = slices.length <= 1 ? 1 : i / (slices.length - 1);
          const t = genieSliceProgress(progress, band);
          const rect = interpolateRect(slice.start, slice.end, t);
          applySliceFrame(slice, rect, source.width);
        });

        if (progress >= 1) {
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    });
  } finally {
    overlay.remove();
    sourceEl.style.visibility = prevVisibility;
    sourceEl.style.pointerEvents = prevPointer;
  }
}

function rectFromEl(el: HTMLElement): GenieRect {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, width: r.width, height: r.height };
}
