import { describe, expect, it } from "vitest";
import {
  fakeMemoryPct,
  neofetch,
  NEOFETCH_LOGO,
  readNeofetchEnv,
} from "./neofetch";

describe("neofetch (todo 26)", () => {
  const env = {
    width: 1440,
    height: 900,
    cores: 8,
    uptimeSec: 125,
    memoryPct: 42,
  };

  it("output contains Hyprland.web and zaid@zaidos", () => {
    const out = neofetch(env).join("\n");
    expect(out).toContain("Hyprland.web");
    expect(out).toContain("zaid@zaidos");
  });

  it("includes all required info lines", () => {
    const out = neofetch(env).join("\n");
    expect(out).toContain("ZaidOS x86_64 (browser edition)");
    expect(out).toContain("your browser (probably)");
    expect(out).toContain("6.12.1-zen (joke)");
    expect(out).toContain("Shell: zsh 5.9");
    expect(out).toContain("ZaidOS Terminal");
    expect(out).toContain("8 cores (browser tab)");
    expect(out).toContain("Memory: 42% (fake)");
    expect(out).toContain("Resolution: 1440x900");
    expect(out).toContain("Colors:");
  });

  it("renders the original ASCII logo on the left", () => {
    const out = neofetch(env);
    expect(out[0]).toContain(NEOFETCH_LOGO[0]!.trim());
  });

  it("QA failure: resolution line uses numeric dims (not NaN)", () => {
    const out = neofetch({ ...env, width: 390, height: 844 });
    const line = out.join("\n").match(/Resolution: (\d+)x(\d+)/);
    expect(line).not.toBeNull();
    expect(Number.parseFloat(line![1]!)).toBe(390);
    expect(Number.parseFloat(line![2]!)).toBe(844);
    expect(Number.isNaN(Number.parseFloat(line![1]!))).toBe(false);
  });

  it("fakeMemoryPct stays in a plausible range", () => {
    expect(fakeMemoryPct(0)).toBeGreaterThanOrEqual(18);
    expect(fakeMemoryPct(999)).toBeLessThanOrEqual(54);
  });

  it("readNeofetchEnv accepts overrides for tests", () => {
    const read = readNeofetchEnv({ width: 800, height: 600, cores: 4, uptimeSec: 10 });
    expect(read.width).toBe(800);
    expect(read.height).toBe(600);
    expect(read.cores).toBe(4);
    expect(read.uptimeSec).toBe(10);
  });
});
