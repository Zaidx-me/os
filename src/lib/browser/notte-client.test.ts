import { describe, expect, it } from "vitest";

import { embedViewerUrl, isPublicHttpUrl } from "./notte-client";

describe("notte-client helpers", () => {
  it("isPublicHttpUrl rejects local hosts", () => {
    expect(isPublicHttpUrl("https://example.com")).toBe(true);
    expect(isPublicHttpUrl("http://localhost/foo")).toBe(false);
    expect(isPublicHttpUrl("file:///etc/passwd")).toBe(false);
  });

  it("embedViewerUrl adds minimal interactive params", () => {
    const out = embedViewerUrl("https://console.notte.cc/static/viewer?ws=wss://x");
    expect(out).toContain("mode=embed-minimal");
    expect(out).toContain("interactive=1");
    expect(out).toContain("theme=dark");
  });
});
