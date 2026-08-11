import { describe, expect, it } from "vitest";

import { isWhitelistedUrl, resolveEmbedUrl } from "./embed-whitelist";

describe("embed whitelist", () => {
  it("trusts portfolio hosts", () => {
    expect(isWhitelistedUrl("https://applicator.netlify.app")).toBe(true);
    expect(isWhitelistedUrl("https://zaidx.me")).toBe(true);
  });

  it("rejects unknown hosts", () => {
    expect(isWhitelistedUrl("https://github.com")).toBe(false);
  });

  it("rewrites YouTube watch URLs to embed", () => {
    expect(resolveEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });
});
