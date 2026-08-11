"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useBootStore } from "@/store/boot";
import { pushNotification } from "@/store/notifications";

/**
 * Full-screen ZaidOS boot sequence, shown on first visit only.
 *
 * - "ZaidOS" logo (terminal glyph in the zaid accent) + typed systemd-style
 *   logs (typewriter), progress bar, auto-continue after ~4s.
 * - Any key press or pointer down skips immediately.
 * - prefers-reduced-motion: everything renders fully-formed with no
 *   animation and auto-advances after a short hold — no 4s wait.
 * - No audio, ever (plan guardrail).
 *
 * Exit fade is driven by AnimatePresence in page.tsx: calling `completeBoot`
 * flips the store, the boot screen fades out (exit={{ opacity: 0 }}), and
 * the desktop shell fades in behind it.
 */

const BOOT_LINES = [
  "[ OK ] Started ZaidOS - the only OS cooler than your window manager",
  "[ OK ] Mounted /dev/zaid on /home",
  "[ OK ] Started Hyprland.web compositor",
  "[ OK ] Reached target Graphical Interface",
  "[ OK ] Started waybar.service",
  "[ OK ] Started zaidos-wm.service",
  "[ OK ] Started network-online.target",
  "[ OK ] Started zaidos-browser-proxy.service",
] as const;

/** Typewriter speed: one character per tick. */
const CHAR_MS = 20;
/** Pause before each subsequent log line starts typing. */
const LINE_GAP_MS = 350;
/** Auto-continue budget: completeBoot fires once elapsed >= this. */
const AUTO_ADVANCE_MS = 5500;
/** Interval tick driving the elapsed clock (fixed step, timer-test friendly). */
const TICK_MS = 16;
/** Hold for reduced-motion visitors so the fully-formed screen is visible. */
const REDUCED_HOLD_MS = 800;
/** Exit fade duration. */
const EXIT_MS = 400;

const TOTAL_CHARS = BOOT_LINES.reduce((total, line) => total + line.length, 0);

type LineState = "done" | "typing" | "pending";

/** Chars typed across all lines after `elapsedMs`, honoring per-line gaps. */
function charsTypedAt(elapsedMs: number): number {
  return BOOT_LINES.reduce((total, line, index) => {
    const lineStart = index * LINE_GAP_MS;
    if (elapsedMs <= lineStart) return total;
    const typedInLine = Math.min(
      line.length,
      Math.floor((elapsedMs - lineStart) / CHAR_MS),
    );
    return total + typedInLine;
  }, 0);
}

export default function BootScreen() {
  const completeBoot = useBootStore((s) => s.completeBoot);
  const reducedMotion = useReducedMotion();
  const [typedCount, setTypedCount] = useState(0);
  const doneRef = useRef(false);

  // Reduced motion: full content on first paint (no typewriter at all).
  // usePrefersReducedMotion is useSyncExternalStore-backed, so the value is
  // already final on the client's first render — deriving avoids a
  // setState-in-effect.
  const typed = reducedMotion ? TOTAL_CHARS : typedCount;

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    pushNotification("Welcome to ZaidOS", "Press ⌘Space to launch apps");
    completeBoot();
  }, [completeBoot]);

  // Typewriter + auto-advance clock. Reduced motion: no animation, advance
  // after a short hold so the fully-formed screen is visible (no 4s wait).
  useEffect(() => {
    if (reducedMotion) {
      const hold = setTimeout(finish, REDUCED_HOLD_MS);
      return () => clearTimeout(hold);
    }
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += TICK_MS;
      setTypedCount(charsTypedAt(elapsed));
      if (elapsed >= AUTO_ADVANCE_MS) finish();
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [reducedMotion, finish]);

  // Skip on any key press or pointer down. Window-level listeners so the
  // whole screen (and its children) counts as "click to skip".
  useEffect(() => {
    window.addEventListener("keydown", finish);
    window.addEventListener("pointerdown", finish);
    return () => {
      window.removeEventListener("keydown", finish);
      window.removeEventListener("pointerdown", finish);
    };
  }, [finish]);

  const lines: { text: string; state: LineState }[] = [];
  let remaining = typed;
  for (const line of BOOT_LINES) {
    if (remaining >= line.length) {
      lines.push({ text: line, state: "done" });
      remaining -= line.length;
    } else if (remaining > 0) {
      lines.push({ text: line.slice(0, remaining), state: "typing" });
      remaining = 0;
    } else {
      lines.push({ text: "", state: "pending" });
    }
  }

  return (
    <motion.div
      data-testid="boot-screen"
      className="boot-screen-bg fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center font-sans"
      exit={{
        opacity: 0,
        transition: { duration: reducedMotion ? 0 : EXIT_MS / 1000 },
      }}
      aria-label="ZaidOS boot sequence"
    >
      {/* Logo */}
      <div className="mb-10 flex select-none items-center gap-3">
        <span aria-hidden="true">
          <AppIcon appId="terminal" size={44} className="text-zaid-accent" />
        </span>
        <span className="font-display text-4xl font-semibold tracking-tight text-zaid-text">
          Zaid<span className="text-zaid-accent">OS</span>
        </span>
      </div>

      {/* Typed systemd-style logs (fixed height so layout never jumps) */}
      <div
        className="w-[min(92vw,560px)] min-h-21 text-sm leading-7"
        aria-live="off"
      >
        {lines.map(({ text, state }, index) => (
          <p
            key={index}
            className={
              state === "done" ? "text-zaid-text" : "text-zaid-muted"
            }
          >
            {text}
            {state === "typing" && (
              <span className="text-zaid-accent" aria-hidden="true">
                ▌
              </span>
            )}
          </p>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-10 h-1 w-[min(92vw,560px)] overflow-hidden rounded-full bg-zaid-border/30">
        {reducedMotion ? (
          <div className="h-full w-full rounded-full bg-zaid-accent" />
        ) : (
          <motion.div
            className="h-full rounded-full bg-zaid-accent"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: AUTO_ADVANCE_MS / 1000,
              ease: "linear",
            }}
          />
        )}
      </div>

      {!reducedMotion && (
        <p className="mt-6 text-xs text-zaid-muted">Press any key to skip</p>
      )}
    </motion.div>
  );
}
