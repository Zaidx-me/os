import { describe, expect, it } from "vitest";
import {
  dockGaussianScale,
  dockLiftPx,
  dockSlotWidthPx,
  DOCK_BASE_ICON_PX,
  DOCK_FALLOFF_RADIUS_PX,
  DOCK_PEAK_SCALE,
  DOCK_SLOT_BASE_PX,
} from "./dock";

describe("dockGaussianScale", () => {
  it("returns 1 at large distance", () => {
    expect(dockGaussianScale(9999)).toBeCloseTo(1, 2);
  });

  it("peaks at distance 0", () => {
    expect(dockGaussianScale(0)).toBeCloseTo(DOCK_PEAK_SCALE, 2);
  });

  it("falls off smoothly near falloff radius", () => {
    const mid = dockGaussianScale(DOCK_FALLOFF_RADIUS_PX);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(DOCK_PEAK_SCALE);
  });
});

describe("dock layout helpers", () => {
  it("expands slot width with scale", () => {
    expect(dockSlotWidthPx(1)).toBe(DOCK_SLOT_BASE_PX);
    expect(dockSlotWidthPx(DOCK_PEAK_SCALE)).toBeGreaterThan(DOCK_SLOT_BASE_PX);
  });

  it("lifts icons upward when magnified", () => {
    expect(dockLiftPx(1)).toBe(0);
    expect(dockLiftPx(DOCK_PEAK_SCALE)).toBeLessThan(0);
  });
});
