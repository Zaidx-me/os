import { describe, expect, it } from "vitest";

import {
  genieEaseIn,
  genieSliceProgress,
  interpolateRect,
  sliceEndRects,
  sliceStartRects,
} from "./genie-slices";

describe("genieEaseIn", () => {
  it("starts at 0 and ends at 1", () => {
    expect(genieEaseIn(0)).toBe(0);
    expect(genieEaseIn(1)).toBeCloseTo(1, 5);
  });

  it("accelerates toward the end (sin curve)", () => {
    expect(genieEaseIn(0.25)).toBeCloseTo(Math.sin(Math.PI / 8), 5);
    expect(genieEaseIn(0.5)).toBeGreaterThan(0.5);
  });
});

describe("genieSliceProgress", () => {
  it("bottom band leads the top band", () => {
    const top = genieSliceProgress(0.4, 0);
    const bottom = genieSliceProgress(0.4, 1);
    expect(bottom).toBeGreaterThan(top);
  });
});

describe("slice rects", () => {
  const source = { x: 100, y: 80, width: 400, height: 300 };
  const target = { x: 500, y: 900, width: 52, height: 52 };

  it("builds horizontal start bands", () => {
    const starts = sliceStartRects(source, 3);
    expect(starts).toHaveLength(3);
    expect(starts[0]?.y).toBe(80);
    expect(starts[2]?.y).toBeCloseTo(80 + 200, 5);
    expect(starts.every((r) => r.width === 400)).toBe(true);
  });

  it("collapses end bands toward the target", () => {
    const ends = sliceEndRects(source, target, 3);
    expect(ends[2]!.width).toBeGreaterThan(ends[0]!.width);
    expect(ends.every((r) => r.width <= target.width)).toBe(true);
  });

  it("interpolates rects", () => {
    const a = { x: 0, y: 0, width: 100, height: 50 };
    const b = { x: 10, y: 20, width: 20, height: 10 };
    expect(interpolateRect(a, b, 0.5)).toEqual({
      x: 5,
      y: 10,
      width: 60,
      height: 30,
    });
  });
});
