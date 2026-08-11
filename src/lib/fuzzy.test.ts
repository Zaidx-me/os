import { describe, expect, it } from "vitest";
import { scoreFuzzy, sortByScore } from "./fuzzy";

describe("scoreFuzzy", () => {
  it("matches an empty query (everything qualifies, equal score)", () => {
    expect(scoreFuzzy("", "anything")).toBe(1);
    expect(scoreFuzzy("   ", "anything")).toBe(1);
  });

  it("returns -1 when there is no subsequence match", () => {
    expect(scoreFuzzy("term", "Projects")).toBe(-1);
    expect(scoreFuzzy("xyz", "term")).toBe(-1);
  });

  it("matches a full prefix (case-insensitive)", () => {
    expect(scoreFuzzy("term", "Terminal")).toBeGreaterThan(0);
  });

  it("is case-insensitive for subsequence matching", () => {
    expect(scoreFuzzy("TERM", "terminal")).toBeGreaterThan(0);
  });

  it("matches non-contiguous subsequences", () => {
    // "tr" appears in "Terminal" via t + r
    expect(scoreFuzzy("tr", "Terminal")).toBeGreaterThan(0);
  });

  it("fails when the query is longer than the text", () => {
    expect(scoreFuzzy("terminalz", "term")).toBe(-1);
  });

  it("scores consecutive runs higher than scattered matches", () => {
    const consecutive = scoreFuzzy("te", "Terminal");
    const scattered = scoreFuzzy("tl", "Terminal");
    expect(consecutive).toBeGreaterThan(scattered);
  });

  it("scores word-boundary matches higher", () => {
    // "mat" matches "Matrix Rain" at the start of a word -> bonus
    const boundary = scoreFuzzy("mat", "Matrix Rain");
    const interior = scoreFuzzy("mat", "Automaton");
    expect(boundary).toBeGreaterThan(interior);
  });

  it("orders by relevance: prefix beats later match", () => {
    const prefix = scoreFuzzy("term", "Terminal");
    const later = scoreFuzzy("term", "Home Terminator");
    expect(prefix).toBeGreaterThan(later);
  });
});

describe("sortByScore", () => {
  it("sorts best-first and stays stable for ties", () => {
    const a = { id: "a", score: 5 };
    const b = { id: "b", score: 5 };
    const c = { id: "c", score: 20 };
    const sorted = sortByScore([a, b, c], (e) => e.score);
    expect(sorted.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });

  it("leaves the input untouched", () => {
    const input = [{ id: "a", score: 1 }];
    const sorted = sortByScore(input, (e) => e.score);
    expect(sorted).not.toBe(input);
    expect(input).toEqual([{ id: "a", score: 1 }]);
  });
});
