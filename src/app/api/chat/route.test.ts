import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildChatSystemPrompt } from "@/lib/chat/system-prompt";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

/**
 * /api/chat route unit tests (todo 32): no key → 501 KB mode; mocked fetch →
 * 200 LLM content; fetch throws → 502 KB fallback; long messages truncated;
 * response never contains the raw system prompt.
 */
describe("POST /api/chat", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function request(body: unknown): Request {
    return new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function freshModule() {
    vi.resetModules();
    return import("./route");
  }

  it("answers 501 kb mode when LLM_API_KEY is unset", async () => {
    const { POST } = await freshModule();
    const res = await POST(
      request({ messages: [{ role: "user", content: "hi" }] }),
    );
    expect(res.status).toBe(501);
    expect((res.body as { mode?: string }).mode).toBe("kb");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns 200 llm content when fetch succeeds", async () => {
    vi.stubEnv("LLM_API_KEY", "sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "AI says hi from Zaid." } }],
      }),
    });

    const { POST } = await freshModule();
    const res = await POST(
      request({ messages: [{ role: "user", content: "hello" }] }),
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mode: "llm", content: "AI says hi from Zaid." });
    expect(mockFetch).toHaveBeenCalledOnce();

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      model: string;
      messages: { role: string; content: string }[];
    };
    expect(payload.model).toBe("gpt-4o-mini");
    expect(payload.messages[0]?.role).toBe("system");
    expect(payload.messages[1]?.content).toBe("hello");
  });

  it("returns 502 kb fallback when fetch throws", async () => {
    vi.stubEnv("LLM_API_KEY", "sk-test");
    mockFetch.mockRejectedValue(new Error("network down"));

    const { POST } = await freshModule();
    const res = await POST(
      request({ messages: [{ role: "user", content: "hello" }] }),
    );
    expect(res.status).toBe(502);
    expect((res.body as { mode?: string }).mode).toBe("kb");
  });

  it("truncates user messages longer than 500 chars before sending", async () => {
    vi.stubEnv("LLM_API_KEY", "sk-test");
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "ok" } }],
      }),
    });

    const long = "a".repeat(600);
    const { POST } = await freshModule();
    await POST(request({ messages: [{ role: "user", content: long }] }));

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const payload = JSON.parse(init.body as string) as {
      messages: { content: string }[];
    };
    expect(payload.messages[1]?.content.length).toBe(500);
  });

  it("never echoes the raw system prompt back to the client", async () => {
    vi.stubEnv("LLM_API_KEY", "sk-test");
    const systemPrompt = buildChatSystemPrompt();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: systemPrompt } }],
      }),
    });

    const { POST } = await freshModule();
    const res = await POST(
      request({ messages: [{ role: "user", content: "hi" }] }),
    );
    expect(res.status).toBe(502);
    expect((res.body as { mode?: string }).mode).toBe("kb");
    expect(JSON.stringify(res.body)).not.toContain(systemPrompt.slice(0, 80));
  });

  it("rejects invalid message payloads with 400", async () => {
    vi.stubEnv("LLM_API_KEY", "sk-test");
    const { POST } = await freshModule();
    const res = await POST(request({ messages: [] }));
    expect(res.status).toBe(400);
  });
});
