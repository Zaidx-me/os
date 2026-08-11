import { describe, expect, it } from "vitest";

import { headersAllowEmbed } from "./can-embed-check";

describe("headersAllowEmbed", () => {
  it("allows when no blocking headers", () => {
    expect(headersAllowEmbed(null, null)).toBe(true);
  });

  it("blocks X-Frame-Options DENY", () => {
    expect(headersAllowEmbed("DENY", null)).toBe(false);
  });

  it("blocks X-Frame-Options SAMEORIGIN", () => {
    expect(headersAllowEmbed("SAMEORIGIN", null)).toBe(false);
  });

  it("blocks CSP frame-ancestors without wildcard", () => {
    expect(headersAllowEmbed(null, "frame-ancestors 'self'")).toBe(false);
  });

  it("allows CSP frame-ancestors *", () => {
    expect(headersAllowEmbed(null, "frame-ancestors *")).toBe(true);
  });
});
