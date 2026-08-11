import { NextResponse } from "next/server";

import {
  buildChatSystemPrompt,
  truncateHistory,
  truncateUserMessage,
  type ChatMessage,
} from "@/lib/chat/system-prompt";

/**
 * POST /api/chat — env-gated OpenAI-compatible LLM relay (todo 32).
 *
 * When LLM_API_KEY is unset → 501 { mode: 'kb' } so the client uses the
 * offline knowledge base. When configured, posts to LLM_BASE_URL (default
 * OpenAI) with a system prompt built from the content layer. On error or
 * timeout → 502 { mode: 'kb' }. Never logs keys; never echoes the system
 * prompt back to the client.
 */

export const dynamic = "force-dynamic";

const LLM_TIMEOUT_MS = 15_000;

interface ChatRequestBody {
  messages?: unknown;
}

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw)) return null;
  const parsed: ChatMessage[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;
    const role = record.role;
    const content = record.content;
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.trim().length > 0
    ) {
      parsed.push({
        role,
        content: role === "user" ? truncateUserMessage(content) : content.trim(),
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}

export async function POST(request: Request) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ mode: "kb" }, { status: 501 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json(
      { error: "messages must be a non-empty array." },
      { status: 400 },
    );
  }

  const baseUrl = (
    process.env.LLM_BASE_URL ?? "https://api.openai.com/v1"
  ).replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const systemPrompt = buildChatSystemPrompt();

  const payload = {
    model,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...truncateHistory(messages),
    ],
    max_tokens: 512,
    temperature: 0.7,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("chat: LLM HTTP", res.status);
      return NextResponse.json({ mode: "kb" }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ mode: "kb" }, { status: 502 });
    }

    // Guard: never leak the raw system prompt back to the client.
    if (content.includes(systemPrompt.slice(0, 40))) {
      return NextResponse.json({ mode: "kb" }, { status: 502 });
    }

    return NextResponse.json({ mode: "llm", content });
  } catch (err) {
    console.error(
      "chat: LLM failure:",
      err instanceof Error ? err.message : "unknown",
    );
    return NextResponse.json({ mode: "kb" }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
