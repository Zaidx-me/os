import { Router } from "express";
import { Resend } from "resend";
import {
  buildChatSystemPrompt,
  parseMessages,
  truncateHistory,
} from "../lib/chat-prompt.js";
import { isLeakedThinking, resolveLlmReply } from "../lib/format-chat-response.js";
import { getResendFrom, isResendConfigured, resendErrorMessage } from "../lib/resend-config.js";

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 45_000;
const LLM_MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS) || 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isReasoningModel(model) {
  return /nemotron|deepseek-r1|reasoner|\bo1\b|\bo3\b|-think|thinking|qwq/i.test(model ?? "");
}

function effectiveMaxTokens(model) {
  return isReasoningModel(model) ? Math.max(LLM_MAX_TOKENS, 2048) : LLM_MAX_TOKENS;
}

export const chatRouter = Router();

chatRouter.get("/status", (_req, res) => {
  const hasKey = Boolean(process.env.LLM_API_KEY?.trim());
  res.json({
    llm: hasKey,
    resend: isResendConfigured(),
    model: process.env.LLM_MODEL ?? "gpt-4o-mini",
    api: true,
  });
});

chatRouter.post("/", async (req, res) => {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    return res.status(501).json({ mode: "kb", error: "LLM not configured" });
  }

  const messages = parseMessages(req.body?.messages);
  if (!messages) {
    return res.status(400).json({ error: "messages must be a non-empty array." });
  }

  const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  const systemPrompt = buildChatSystemPrompt();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const llmRes = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, ...truncateHistory(messages)],
        max_tokens: effectiveMaxTokens(model),
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text().catch(() => "");
      console.error("chat: LLM HTTP", llmRes.status, errText.slice(0, 200));
      return res.status(502).json({ mode: "kb", error: "LLM request failed" });
    }

    const data = await llmRes.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const raw = message?.content?.trim();
    const finishReason = choice?.finish_reason;
    const apiThinking =
      message?.reasoning_content ??
      message?.reasoning ??
      choice?.message?.reasoning ??
      null;
    const { content: answer, thinking } = resolveLlmReply(raw, apiThinking);
    const rejected =
      !answer ||
      answer.includes(systemPrompt.slice(0, 40)) ||
      (isLeakedThinking(answer) && answer.length < 100) ||
      (finishReason === "length" && answer.length < 30);

    if (rejected) {
      console.warn(
        "chat: rejected LLM reply",
        finishReason ?? "unknown",
        `raw=${raw?.length ?? 0}`,
        `reasoning=${apiThinking ? String(apiThinking).length : 0}`,
        `answer=${answer.length}`,
      );
      return res.status(502).json({ mode: "kb", error: "Empty LLM response" });
    }

    return res.json({
      mode: "llm",
      content: answer,
      thinking: thinking || undefined,
      finishReason,
    });
  } catch (err) {
    console.error("chat: failure:", err instanceof Error ? err.message : "unknown");
    return res.status(502).json({ mode: "kb", error: "LLM unavailable" });
  } finally {
    clearTimeout(timeout);
  }
});

/** Email chat transcript to Zaid via Resend (visitor leaves their email). */
chatRouter.post("/email", async (req, res) => {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!apiKey || !to) {
    return res.status(501).json({ error: "Email relay not configured" });
  }

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  const messages = parseMessages(req.body?.messages);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Valid email required." });
  }
  if (!messages?.length) {
    return res.status(400).json({ error: "No messages to send." });
  }

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Visitor" : "ZaidGPT"}: ${m.content}`)
    .join("\n\n");

  try {
    const resend = new Resend(apiKey);
    const from = getResendFrom();
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: "ZaidGPT conversation from zaidx.me",
      text: `From: ${email}\n\n${transcript}`,
      html: `<p><strong>From:</strong> ${email}</p><hr/><pre style="white-space:pre-wrap;font-family:system-ui">${transcript.replace(/</g, "&lt;")}</pre>`,
    });

    if (error) {
      console.error("chat/email: resend refused:", error.message);
      return res.status(500).json({ error: resendErrorMessage(error) });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("chat/email: failure:", err instanceof Error ? err.message : "unknown");
    return res.status(500).json({ error: "Could not send email." });
  }
});
