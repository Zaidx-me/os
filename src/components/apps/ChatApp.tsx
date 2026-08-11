"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Trash2 } from "lucide-react";

import { chatReply, matchChat } from "@/lib/chat/kb";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { selectAiChatEnabled, useSettingsStore } from "@/store/settings";

/** localStorage key for chat history (cap 100 messages). */
export const CHAT_HISTORY_KEY = "zaidos-chat-history";
const HISTORY_CAP = 100;

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  source?: "kb" | "llm";
};

const QUICK_REPLIES = [
  "Who are you?",
  "Show me projects",
  "Skills",
  "Contact",
] as const;

function nextId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed.slice(-HISTORY_CAP) : [];
  } catch {
    return [];
  }
}

function saveHistory(messages: ChatMessage[]) {
  const capped = messages.slice(-HISTORY_CAP);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(capped));
}

async function fetchLlmReply(
  messages: ChatMessage[],
): Promise<{ ok: true; content: string } | { ok: false }> {
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
    });
    const data = (await res.json()) as { mode?: string; content?: string };
    if (res.ok && data.mode === "llm" && typeof data.content === "string") {
      return { ok: true, content: data.content };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

/**
 * ZaidGPT chat window (todo 31): message bubbles, typing indicator,
 * quick-reply chips, localStorage history (cap 100), header badge for
 * offline KB vs AI mode, footer joke. Uses KB engine (todo 30) with
 * optional LLM relay when AI mode is enabled in Settings.
 */
export function ChatApp() {
  const aiChatEnabled = useSettingsStore(selectAiChatEnabled);
  const hydrated = useIsHydrated();
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useEffect(() => {
    if (!hydrated) return;
    saveHistory(messages);
  }, [messages, hydrated]);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 48;
  }

  async function sendText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: trimmed,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setTyping(true);
    stickToBottom.current = true;

    let botContent: string;
    let source: "kb" | "llm" = "kb";

    if (aiChatEnabled) {
      const llm = await fetchLlmReply(nextMessages);
      if (llm.ok) {
        botContent = llm.content;
        source = "llm";
      } else {
        botContent = matchChat(trimmed).response;
      }
    } else {
      // Small delay so the typing indicator feels natural in KB mode too.
      await new Promise((r) => setTimeout(r, 350));
      botContent = chatReply(trimmed);
    }

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "bot", content: botContent, source },
    ]);
    setTyping(false);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void sendText(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendText(input);
    }
  }

  function clearHistory() {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  }

  return (
    <div
      data-testid="app-content-chat"
      className="flex h-full w-full flex-col bg-zaid-surface"
    >
      <header className="flex shrink-0 items-center justify-between border-b border-zaid-border px-4 py-2">
        <div>
          <h2 className="font-mono text-sm font-semibold text-zaid-text">
            ZaidGPT
          </h2>
          <p className="font-mono text-[10px] text-zaid-muted">
            {aiChatEnabled ? "AI mode" : "offline KB"}
          </p>
        </div>
        <span
          data-testid="chat-mode-badge"
          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
            aiChatEnabled
              ? "bg-zaid-accent/15 text-zaid-accent"
              : "bg-zaid-surface2 text-zaid-muted"
          }`}
        >
          {aiChatEnabled ? "AI mode" : "offline KB"}
        </span>
      </header>

      <div
        ref={listRef}
        data-testid="chat-message-list"
        onScroll={onScroll}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
        aria-live="polite"
      >
        {messages.length === 0 && !typing && (
          <p className="font-mono text-xs text-zaid-muted">
            Ask about projects, skills, contact, or tap a chip below.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            data-testid={`chat-bubble-${msg.role}`}
            className={`max-w-[85%] rounded-lg px-3 py-2 font-mono text-xs leading-relaxed ${
              msg.role === "user"
                ? "ml-auto bg-zaid-accent/20 text-zaid-text"
                : "window-glass hairline text-zaid-text"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {typing && (
          <div
            data-testid="chat-typing"
            className="window-glass hairline flex w-fit items-center gap-2 rounded-lg px-3 py-2"
          >
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zaid-accent"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
            <span className="font-mono text-[10px] text-zaid-muted">
              zaid is thinking...
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-zaid-border p-3">
        <div
          data-testid="chat-quick-replies"
          className="mb-2 flex flex-wrap gap-2"
        >
          {QUICK_REPLIES.map((label) => (
            <button
              key={label}
              type="button"
              data-testid={`chat-chip-${label.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => void sendText(label)}
              disabled={typing}
              className="hairline rounded-full px-3 py-1 font-mono text-[10px] text-zaid-text transition-colors hover:border-zaid-accent hover:text-zaid-accent disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            data-testid="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask ZaidGPT…"
            disabled={typing}
            className="hairline min-w-0 flex-1 rounded-lg bg-zaid-surface2 px-3 py-2 font-mono text-xs text-zaid-text placeholder:text-zaid-muted focus:border-zaid-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            data-testid="chat-send"
            disabled={typing || !input.trim()}
            className="hairline shrink-0 rounded-lg bg-zaid-accent px-3 py-2 font-mono text-xs font-semibold text-zaid-surface transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Send
          </button>
          <button
            type="button"
            data-testid="chat-clear"
            onClick={clearHistory}
            title="Clear history"
            aria-label="Clear chat history"
            className="hairline shrink-0 rounded-lg px-2 py-2 text-zaid-muted transition-colors hover:text-zaid-accent"
          >
            <Trash2 size={14} aria-hidden />
          </button>
        </form>

        <p
          data-testid="chat-footer-joke"
          className="mt-2 text-center font-mono text-[10px] text-zaid-muted"
        >
          powered by my own API-transformer vibes
        </p>
      </div>
    </div>
  );
}

export default ChatApp;
