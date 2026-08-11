/** macOS Dock magnification — Gaussian falloff (not linear). */
export const DOCK_BASE_ICON_PX = 52;
export const DOCK_SLOT_PADDING_PX = 6;
export const DOCK_SLOT_BASE_PX =
  DOCK_BASE_ICON_PX + DOCK_SLOT_PADDING_PX * 2;
export const DOCK_PEAK_SCALE = 1.9;
export const DOCK_FALLOFF_RADIUS_PX = 110;

export function dockSlotWidthPx(scale: number): number {
  return DOCK_SLOT_PADDING_PX * 2 + DOCK_BASE_ICON_PX * scale;
}

export function dockLiftPx(scale: number): number {
  if (scale <= 1) return 0;
  return -((scale - 1) * DOCK_BASE_ICON_PX * 0.45);
}

export function dockGaussianScale(distancePx: number): number {
  const d2 = distancePx * distancePx;
  const sigma2 = 2 * DOCK_FALLOFF_RADIUS_PX * DOCK_FALLOFF_RADIUS_PX;
  return (DOCK_PEAK_SCALE - 1) * Math.exp(-d2 / sigma2) + 1;
}
