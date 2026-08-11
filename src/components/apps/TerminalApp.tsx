"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  articles,
  experience,
  projects,
  site,
  skillGroups,
  socials,
} from "@/content";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { createShell } from "@/lib/shell/shell";
import type { ShellContext } from "@/lib/shell/registry";
import { openApp as openAppAction } from "@/lib/wm/actions";
import { useWallpaperStore } from "@/store/wallpaper";

/**
 * Terminal (terminal) — the simulated shell (todo 24).
 *
 * A hidden <input> captures keystrokes while the prompt line renders from
 * state, so the blinking block cursor and ANSI-ish colors stay under app
 * control. Commands run through createShell() — pure handlers over the fake
 * filesystem, never eval'd. Output lines type out fast (one per tick); the
 * whole animation is skipped under prefers-reduced-motion. ArrowUp/Down walk
 * the shell history, Tab completes, and clicking anywhere focuses the input.
 * The `\x1b[2J` clear-screen escape wipes every line and leaves a fresh
 * prompt, exactly like a real `clear`.
 */
const LINE_TYPE_DELAY_MS = 12;

/** ANSI-ish escapes this terminal understands. */
const ANSI_GREEN = "\x1b[32m";
const ANSI_RESET = "\x1b[0m";
const ANSI_CLEAR = "\x1b[2J";

interface TermLine {
  id: number;
  kind: "cmd" | "out";
  text: string;
}

/** Boot banner — typed out when the terminal opens. */
const BOOT_LINES: readonly string[] = [
  `${ANSI_GREEN}[ OK ]${ANSI_RESET} ZaidOS shell v0.1 — everything here is simulated.`,
  `${ANSI_GREEN}[ OK ]${ANSI_RESET} Shell ready. Everything is pretend, including the sudoers file.`,
];

/** Render `\x1b[32m...\x1b[0m` spans in accent green, everything else plain. */
function renderAnsi(text: string) {
  const parts = text.split(/(\x1b\[32m[\s\S]*?\x1b\[0m)/g);
  return parts.map((part, i) =>
    part.startsWith(ANSI_GREEN) ? (
      <span key={i} className="text-zaid-accent">
        {part.slice(ANSI_GREEN.length, -ANSI_RESET.length)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function TerminalApp() {
  const shell = useMemo(() => createShell(), []);
  const reduced = usePrefersReducedMotion();

  const [lines, setLines] = useState<TermLine[]>([]);
  const [input, setInput] = useState("");
  const idRef = useRef(0);
  const pendingRef = useRef<string[]>([]);
  const drainingRef = useRef(false);
  const historyIndexRef = useRef(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bootedRef = useRef(false);

  const ctx = useMemo<ShellContext>(
    () => ({
      openApp: (appId) => openAppAction(appId),
      data: { site, projects, skillGroups, experience, socials, articles },
      wallpaper: (type) => useWallpaperStore.getState().setWallpaper(type),
      launcher: () =>
        window.dispatchEvent(new CustomEvent("zaidos:toggle-launcher")),
    }),
    [],
  );

  /**
   * Typewriter: drains one pending output line per tick. Keeps draining as
   * long as lines are queued, then parks (drainingRef) until the next
   * command. Reduced motion → zero delay, so output is instant.
   */
  const scheduleDrain = useCallback(() => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    const delay = reduced ? 0 : LINE_TYPE_DELAY_MS;
    const step = () => {
      const text = pendingRef.current.shift();
      if (text === undefined) {
        drainingRef.current = false;
        return;
      }
      const id = idRef.current++;
      if (text === ANSI_CLEAR) setLines([]);
      else setLines((prev) => [...prev, { id, kind: "out", text }]);
      window.setTimeout(step, delay);
    };
    window.setTimeout(step, delay);
  }, [reduced]);

  // Boot banner once (StrictMode-safe).
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    pendingRef.current.push(...BOOT_LINES);
    scheduleDrain();
  }, [scheduleDrain]);

  // Auto-scroll to the newest line.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const run = useCallback(
    (raw: string) => {
      if (raw.trim() === "") {
        // zsh re-prints the prompt on an empty Enter.
        const id = idRef.current++;
        setLines((prev) => [...prev, { id, kind: "cmd", text: "" }]);
        setInput("");
        historyIndexRef.current = -1;
        return;
      }
      const output = shell.run(raw, ctx);
      if (output.includes(ANSI_CLEAR)) {
        // `clear`: wipe every line (including this command), fresh prompt.
        pendingRef.current = [];
        const id = idRef.current++;
        setLines([{ id, kind: "cmd", text: "" }]);
        setInput("");
        historyIndexRef.current = -1;
        return;
      }
      const cmdId = idRef.current++;
      setLines((prev) => [...prev, { id: cmdId, kind: "cmd", text: raw }]);
      pendingRef.current.push(...output);
      scheduleDrain();
      setInput("");
      historyIndexRef.current = -1;
    },
    [ctx, scheduleDrain, shell],
  );

  const moveHistory = useCallback(
    (delta: number) => {
      const hist = shell.history;
      if (hist.length === 0) return;
      let index = historyIndexRef.current + delta;
      if (index >= hist.length) index = hist.length - 1;
      if (index < -1) index = -1;
      historyIndexRef.current = index;
      setInput(index === -1 ? "" : hist[hist.length - 1 - index]);
    },
    [shell],
  );

  const complete = useCallback(() => {
    const candidates = shell.complete(input);
    if (candidates.length === 0) return;
    if (candidates.length === 1) {
      const candidate = candidates[0];
      if (input === "" || input.endsWith(" ")) {
        setInput(input + candidate + " ");
      } else {
        const lastSpace = input.lastIndexOf(" ");
        setInput(input.slice(0, lastSpace + 1) + candidate + " ");
      }
      return;
    }
    // Multiple matches: list them above the prompt (input is untouched).
    const id = idRef.current++;
    setLines((prev) => [...prev, { id, kind: "out", text: candidates.join("  ") }]);
  }, [input, shell]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        run(input);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveHistory(1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveHistory(-1);
      } else if (e.key === "Tab") {
        e.preventDefault();
        complete();
      }
    },
    [complete, input, moveHistory, run],
  );

  const prompt = `zaid@zaidos:${shell.fs.promptPath()}$ `;

  return (
    <div
      data-testid="app-content-terminal"
      className="terminal-root relative flex h-full w-full flex-col bg-zaid-bg font-mono text-zaid-text"
      onMouseDown={() => inputRef.current?.focus()}
    >
      <div
        ref={scrollRef}
        data-testid="terminal-scroll"
        className="flex-1 select-text overflow-y-auto px-3 py-2 text-xs leading-relaxed"
      >
        {lines.map((line) =>
          line.kind === "cmd" ? (
            <div
              key={line.id}
              data-testid={`terminal-line-${line.id}`}
              data-kind="cmd"
              className="whitespace-pre-wrap break-words"
            >
              <span className="select-none text-zaid-accent">{prompt}</span>
              {line.text}
            </div>
          ) : (
            <div
              key={line.id}
              data-testid={`terminal-line-${line.id}`}
              data-kind="out"
              className="whitespace-pre-wrap break-words"
            >
              {renderAnsi(line.text)}
            </div>
          ),
        )}
        <div className="whitespace-pre-wrap break-words">
          <span className="select-none text-zaid-accent">{prompt}</span>
          {input}
          <span className="terminal-cursor" aria-hidden="true" />
        </div>
      </div>
      <input
        ref={inputRef}
        data-testid="terminal-input"
        className="terminal-hidden-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Terminal input"
      />
    </div>
  );
}

export default TerminalApp;
