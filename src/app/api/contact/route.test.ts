import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

const mockSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn(function () {
    return { emails: { send: mockSend } };
  }),
}));

/**
 * /api/contact route unit tests (todo 22 acceptance): with no env keys the
 * route answers 501 { message: "mailto" }; with keys it calls the Resend
 * SDK and relays the payload; the honeypot and the rate limit never reach
 * Resend. vi.resetModules() per test keeps the in-memory rate-limit map
 * isolated.
 */
describe("POST /api/contact", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "m1" }, error: null });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function request(body: unknown, ip?: string): Request {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (ip) headers["cf-connecting-ip"] = ip;
    return new Request("http://localhost/api/contact", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  async function freshModule() {
    vi.resetModules();
    return import("./route");
  }

  it("answers 501 mailto when RESEND_API_KEY / CONTACT_TO_EMAIL are unset", async () => {
    const { POST } = await freshModule();
    const res = await POST(
      request({
        name: "Zaid",
        email: "zaid@example.com",
        subject: "Hello",
        message: "Hi",
      }),
    );
    expect(res.status).toBe(501);
    expect((res.body as { message?: string }).message).toBe("mailto");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads with 400 before any relay", async () => {
    const { POST } = await freshModule();
    const res = await POST(
      request({ name: "", email: "nope", subject: "", message: "" }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 silently when the website honeypot is filled", async () => {
    const { POST } = await freshModule();
    const res = await POST(
      request({
        name: "bot",
        email: "bot@example.com",
        subject: "spam",
        message: "buy now",
        website: "http://spam.example",
      }),
    );
    expect(res.status).toBe(200);
    expect((res.body as { ok?: boolean }).ok).toBe(true);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rate limits to 5 valid submissions per minute per IP", async () => {
    const { POST } = await freshModule();
    const valid = {
      name: "Zaid",
      email: "zaid@example.com",
      subject: "Hello",
      message: "Hi",
    };
    for (let i = 0; i < 5; i++) {
      expect((await POST(request(valid))).status).toBe(501);
    }
    expect((await POST(request(valid))).status).toBe(429);
    // a different IP has its own bucket and is not limited
    expect((await POST(request(valid, "203.0.113.9"))).status).toBe(501);
  });

  it("calls Resend with the relayed payload when keys are set", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@zaidx.me");
    const { POST } = await freshModule();
    const res = await POST(
      request({
        name: "Zaid",
        email: "zaid@example.com",
        subject: "Hello",
        message: "Hi",
      }),
    );
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith({
      from: "ZaidOS Portfolio <onboarding@resend.dev>",
      to: "owner@zaidx.me",
      subject: "Portfolio contact: Hello",
      replyTo: "zaid@example.com",
      text: "Name: Zaid\nEmail: zaid@example.com\n\nHi",
    });
  });

  it("returns 500 when Resend reports an error", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@zaidx.me");
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: "rejected" },
    });
    const { POST } = await freshModule();
    const res = await POST(
      request({
        name: "Zaid",
        email: "zaid@example.com",
        subject: "Hello",
        message: "Hi",
      }),
    );
    expect(res.status).toBe(500);
  });
});
