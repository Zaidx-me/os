import { describe, expect, it } from "vitest";
import {
  BROWSER_START,
  frameSrcForUrl,
  resolveBrowserUrl,
} from "./browser";

describe("browser store helpers", () => {
  it("resolveBrowserUrl handles start, search, and https URLs", () => {
    expect(resolveBrowserUrl("")).toBe(BROWSER_START);
    expect(resolveBrowserUrl("applicator.netlify.app")).toContain("applicator.netlify.app");
    expect(resolveBrowserUrl("hello world")).toContain("duckduckgo.com");
  });

  it("frameSrcForUrl returns direct URL for whitelisted sites only", () => {
    expect(frameSrcForUrl(BROWSER_START)).toBeNull();
    expect(frameSrcForUrl("https://github.com/zaidx-me")).toBe(
      "https://github.com/zaidx-me",
    );
    expect(frameSrcForUrl("https://applicator.netlify.app")).toBe(
      "https://applicator.netlify.app",
    );
  });
});
