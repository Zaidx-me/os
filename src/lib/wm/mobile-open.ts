import { motionTokens } from "@/lib/motion/spring";

export interface LocalRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Icon bounds relative to a container element. */
export function localRectFromElement(el: HTMLElement, container: HTMLElement): LocalRect {
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  return {
    x: er.left - cr.left,
    y: er.top - cr.top,
    width: er.width,
    height: er.height,
  };
}

export function squircleRadiusPx(size: number): number {
  return size * 0.2237;
}

export const MOBILE_OPEN_MS = Math.round(motionTokens.duration.hero * 1000);
