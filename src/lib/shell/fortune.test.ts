import { describe, expect, it } from "vitest";
import { cowsay } from "./cowsay";
import { FORTUNES, randomFortune } from "./fortune";

describe("fortune (todo 27)", () => {
  it("has at least 20 original lines", () => {
    expect(FORTUNES.length).toBeGreaterThanOrEqual(20);
  });

  it("randomFortune returns a non-empty string from the pool", () => {
    const line = randomFortune();
    expect(line.length).toBeGreaterThan(0);
    expect(FORTUNES).toContain(line);
  });
});

describe("cowsay (todo 27)", () => {
  it("prints cow art and a message", () => {
    const out = cowsay("hello world");
    expect(out.join("\n")).toContain("^__^");
    expect(out.join("\n")).toContain("hello world");
  });

  it("wraps long fortune lines", () => {
    const out = cowsay("word ".repeat(20).trim());
    expect(out.length).toBeGreaterThan(5);
  });
});
