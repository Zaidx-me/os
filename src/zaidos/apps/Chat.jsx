import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronLeft, Mail } from "lucide-react";
import { site } from "../content/index.ts";
import { matchChat } from "../lib/kb.js";
import { fetchChatStatus, statusHint } from "../lib/apiStatus.js";
import { parseChatResponse } from "../lib/formatChat.js";

const QUICK = ["Who are you?", "Show projects", "Your skills", "How to hire you?"];
const STORAGE_KEY = "zaidos-chat-history";

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw).slice(-100) : [];
  } catch {
    return [];
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="flex justify-start" data-testid="chat-typing">
      <div className="chat-bubble chat-bubble--bot flex items-center gap-1 px-4 py-3">
        <span className="chat-typing-dot" />
        <span className="chat-typing-dot chat-typing-dot--2" />
        <span className="chat-typing-dot chat-typing-dot--3" />
      </div>
    </div>
  );
}

function ThinkingBlock({ thinking }) {
  const [open, setOpen] = useState(false);
  if (!thinking?.trim()) return null;

  return (
    <div className="chat-thinking mb-2 border-b border-white/10 pb-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-left text-[12px] font-medium text-gray-400 active:text-gray-300"
        aria-expanded={open}
      >
        <span className="text-[10px] opacity-70">{open ? "▾" : "▸"}</span>
        Thinking
      </button>
      {open && (
        <p className="chat-thinking-body mt-1.5 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-gray-500">
          {thinking}
        </p>
      )}
    </div>
  );
}

async function fetchLlm(messages) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 50_000);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      }),
      signal: controller.signal,
    });
    const data = await res.json();
    if (res.ok && data.mode === "llm" && data.content?.trim()) {
      return {
        content: data.content.trim(),
        thinking: data.thinking ?? "",
        source: "llm",
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function revealText(text, onChunk) {
  const words = text.split(/(\s+)/);
  let built = "";
  for (const part of words) {
    built += part;
    onChunk(built);
    await new Promise((r) => window.setTimeout(r, part.trim() ? 28 : 8));
  }
}

export default function ChatApp({ onBack }) {
  const [messages, setMessages] = useState(() => loadHistory());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [status, setStatus] = useState({ llm: false, resend: false, offline: true, api: false });
  const [emailOpen, setEmailOpen] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState("");
  const [emailState, setEmailState] = useState(null);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-100)));
  }, [messages]);

  useEffect(() => {
    fetchChatStatus().then(setStatus);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, streamingId]);

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || typing) return;

      const userMsg = {
        id: `${Date.now()}-u`,
        role: "user",
        content: trimmed,
        ts: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setTyping(true);

      const history = [...messages, userMsg];
      let reply = null;
      let thinking = "";
      let source = "kb";

      if (status.llm) {
        const llm = await fetchLlm(history);
        if (llm?.content) {
          reply = llm.content;
          thinking = llm.thinking ?? "";
          source = llm.source;
        }
      }

      if (!reply) {
        const kb = parseChatResponse(matchChat(trimmed).response);
        reply = kb.content;
        thinking = kb.thinking;
      }

      setTyping(false);

      const botId = `${Date.now()}-b`;
      setStreamingId(botId);
      setMessages((prev) => [
        ...prev,
        { id: botId, role: "bot", content: "", thinking, source, ts: Date.now() },
      ]);

      await revealText(reply, (partial) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === botId ? { ...m, content: partial } : m)),
        );
      });

      setStreamingId(null);
      inputRef.current?.focus();
    },
    [messages, status.llm, typing],
  );

  async function emailTranscript(e) {
    e.preventDefault();
    setEmailState("sending");
    try {
      const res = await fetch("/api/chat/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: visitorEmail,
          messages: messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setEmailState("sent");
      window.setTimeout(() => {
        setEmailOpen(false);
        setEmailState(null);
        setVisitorEmail("");
      }, 1500);
    } catch (err) {
      setEmailState(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div
      data-testid="app-content-chat"
      className="chat-app relative flex h-full min-h-0 flex-col bg-[#000000]"
    >
      <div className="chat-app-header flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#1c1c1e]/95 px-2 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] backdrop-blur-xl">
        {onBack && (
          <button
            type="button"
            data-testid="mobile-app-back"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-blue-400 active:bg-white/10"
            aria-label="Back to home"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-sm font-bold text-white">
            Z
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-white">ZaidGPT</p>
            <p className="text-[11px] text-gray-400">
              {status.llm ? (
                <span className="text-green-400">● Live AI · {status.model ?? "gpt-4o-mini"}</span>
              ) : status.offline ? (
                <span className="text-amber-400">API offline</span>
              ) : (
                <span>Offline answers</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {status.resend && messages.length > 0 && (
            <button
              type="button"
              onClick={() => setEmailOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white active:bg-white/10"
              aria-label="Email conversation"
            >
              <Mail size={18} />
            </button>
          )}
        </div>
      </div>

      {!status.llm && statusHint("llm", status) && messages.length === 0 && (
        <p className="shrink-0 border-b border-white/10 bg-amber-500/10 px-4 py-2 text-center text-[11px] text-amber-200">
          {statusHint("llm", status)}
        </p>
      )}

      <div
        ref={listRef}
        data-testid="chat-message-list"
        className="chat-message-list min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <p className="text-sm text-gray-400">Message {site.owner.split(" ")[0]}’s AI assistant</p>
            <p className="text-xs text-gray-500">Ask about projects, skills, or hiring.</p>
          </div>
        )}

        {messages.map((m, i) => {
          const isUser = m.role === "user";
          const botParts = isUser ? null : parseChatResponse(m.content, m.thinking);
          const showTime =
            i === 0 ||
            (messages[i - 1] && m.ts - messages[i - 1].ts > 5 * 60 * 1000);
          return (
            <div key={m.id} className="mb-1">
              {showTime && m.ts && (
                <p className="my-3 text-center text-[11px] font-medium text-gray-500">
                  {formatTime(m.ts)}
                </p>
              )}
              <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`chat-bubble max-w-[82%] px-3.5 py-2 text-[15px] leading-snug ${
                    isUser ? "chat-bubble--user" : "chat-bubble--bot"
                  } ${m.id === streamingId && !m.content ? "min-h-[2.25rem]" : ""}`}
                >
                  {!isUser && botParts?.thinking && (
                    <ThinkingBlock thinking={botParts.thinking} />
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {(isUser ? m.content : botParts?.content) ||
                      (m.id === streamingId ? "…" : "")}
                  </p>
                  {!isUser && m.content && m.source && (
                    <p className="mt-1 text-[10px] opacity-50">
                      {m.source === "llm" ? "AI" : "Offline"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {typing && <TypingIndicator />}
      </div>

      <div className="chat-composer shrink-0 border-t border-white/10 bg-[#1c1c1e]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <div className="mb-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              data-testid={`chat-chip-${q.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => send(q)}
              disabled={typing}
              className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200 active:bg-white/15 disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          className="flex items-end gap-2 px-1"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="iMessage"
            disabled={typing}
            className="min-h-[36px] flex-1 rounded-full border border-white/10 bg-[#2c2c2e] px-4 py-2 text-[15px] text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500 text-white disabled:bg-gray-600 disabled:opacity-50 active:scale-95"
            aria-label="Send"
          >
            <ArrowUp size={18} strokeWidth={2.5} />
          </button>
        </form>
      </div>

      {emailOpen && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/50 p-4 sm:items-center sm:justify-center">
          <form
            onSubmit={emailTranscript}
            className="w-full max-w-sm rounded-2xl bg-[#2c2c2e] p-4 text-white shadow-xl"
          >
            <h3 className="text-base font-semibold">Email this chat to Zaid</h3>
            <p className="mt-1 text-xs text-gray-400">Your transcript will be sent via Resend.</p>
            <input
              type="email"
              required
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              placeholder="your@email.com"
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#1c1c1e] px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setEmailOpen(false)}
                className="flex-1 rounded-lg bg-white/10 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={emailState === "sending"}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium disabled:opacity-50"
              >
                {emailState === "sending" ? "Sending…" : emailState === "sent" ? "Sent!" : "Send"}
              </button>
            </div>
            {emailState && emailState !== "sending" && emailState !== "sent" && (
              <p className="mt-2 text-xs text-red-400">{emailState}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
