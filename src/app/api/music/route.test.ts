import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { headers?: Record<string, string> }) => ({
      body,
      headers: init?.headers ?? {},
    }),
  },
}));

describe("GET /api/music", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns local fallback when no API keys are configured", async () => {
    vi.stubEnv("JAMENDO_CLIENT_ID", "");
    vi.stubEnv("FREESOUND_API_KEY", "");
    vi.resetModules();
    const mod = await import("./route");
    const res = (await mod.GET()) as unknown as {
      body: { source: string; tracks: unknown[] };
    };
    expect(res.body.source).toBe("local");
    expect(res.body.tracks.length).toBeGreaterThan(0);
  });
});
