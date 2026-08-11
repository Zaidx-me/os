"use client";

import { useEffect, useRef, useState } from "react";
import { AtSign, Command, Link, Power } from "lucide-react";
import { motion } from "motion/react";
import { AppIcon } from "@/components/ui/AppIcon";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { focusWindow } from "@/lib/wm/actions";
import { isVisible } from "@/lib/wm/selectors";
import { useBootStore } from "@/store/boot";
import { useWmStore } from "@/store/wm";
import {
  WORKSPACE_IDS,
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
  workspaceLabel,
} from "@/store/workspaces";

/**
 * ZaidOS top bar (Hyprland-style waybar). Fixed at the top edge, 40px tall
 * (--waybar-h), frosted glass over the wallpaper. Hidden below the md
 * breakpoint (CSS-only `hidden md:flex` — nothing mounts on mobile).
 *
 * Left: launcher button (dispatches `zaidos:toggle-launcher`; the Launcher
 * component of todo 11 listens for it) + one pill per workspace (term / proj /
 * web / soc / game). The active pill is highlighted with the accent token and
 * `data-active="true"`; clicking a pill switches the active workspace.
 *
 * Right: live HH:MM clock + date (refreshed every 60s), session uptime (1s
 * ticker since mount), a system tray with fake CPU/RAM percentages and a
 * canvas sparkline of their oscillation history, GitHub/LinkedIn links, and a
 * power button opening the power easter-egg menu (Reboot replays the boot
 * sequence, Log out fades then replays it, Cancel closes).
 *
 * MUST NOT read real system metrics — the tray values are sin-based
 * oscillators with light jitter, clamped to [5,95] so they never sit stuck at
 * 0% or 100%.
 *
 * jsdom safety (unit tests + SSR-adjacent renders): the sparkline guards a
 * null `getContext("2d")` (jsdom returns null), matchMedia is only touched
 * through the guarded usePrefersReducedMotion hook, and every interval is
 * cleared on unmount.
 */

const CLOCK_MS = 60_000; // clock/date refresh — once a minute
const TICK_MS = 1000; // uptime + demo tray refresh
const LOGOUT_MS = 400; // logout fade overlay duration
const SPARK_MAX = 60; // sparkline history points (1 per second)
const MIN_PCT = 5; // demo clamp floor — values never sit stuck at 0%
const MAX_PCT = 95; // demo clamp ceiling — values never sit stuck at 100%

/** "14:05" — zero-padded HH:MM. */
function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "Aug 10" — short month + day. */
function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "up 0:05:23" — unpadded hours, zero-padded minutes/seconds. */
function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `up ${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Next demo CPU/RAM sample. Two out-of-phase sines over the current time give
 * a slow oscillation that never repeats, plus a small random jitter so the
 * sparkline breathes. // demo values, not real metrics
 */
function nextMetrics(): { cpu: number; ram: number } {
  const t = Date.now();
  const osc = (mid: number, amp: number, slow: number, fast: number, phase: number) =>
    mid +
    amp * Math.sin(t / slow + phase) +
    amp * 0.4 * Math.sin(t / fast + phase) +
    (Math.random() * 6 - 3);
  return {
    cpu: Math.min(MAX_PCT, Math.max(MIN_PCT, Math.round(osc(42, 18, 9000, 1300, 0)))),
    ram: Math.min(MAX_PCT, Math.max(MIN_PCT, Math.round(osc(61, 12, 7000, 1700, 2)))),
  };
}

/** Sparkline colors — read from the design tokens once (canvas can't read
 *  CSS custom properties; the fallbacks mirror the token hex values so the
 *  sparkline still works in jsdom, exactly like MatrixRain). */
interface SparkTokens {
  accent: string;
  muted: string;
}

function readSparkTokens(): SparkTokens {
  const fallback = { accent: "#39FF14", muted: "#8b93a7" };
  if (typeof getComputedStyle === "function") {
    const styles = getComputedStyle(document.documentElement);
    return {
      accent: styles.getPropertyValue("--color-zaid-accent").trim() || fallback.accent,
      muted: styles.getPropertyValue("--color-zaid-muted").trim() || fallback.muted,
    };
  }
  return fallback;
}

/** Plots the CPU (accent) and RAM (muted) history as polylines on the tray
 *  canvas. Guards a null 2d context (jsdom) and a zero laid-out size. */
function drawSparkline(
  canvas: HTMLCanvasElement,
  history: readonly { cpu: number; ram: number }[],
  tokens: SparkTokens,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return; // jsdom has no 2d context — nothing to draw
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return; // not laid out yet
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const bw = Math.round(w * dpr);
  const bh = Math.round(h * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const plot = (values: readonly number[], color: string) => {
    if (values.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = (i / (SPARK_MAX - 1)) * (w - 1);
      const y = h - 1 - (v / 100) * (h - 1);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  plot(history.map((m) => m.cpu), tokens.accent);
  plot(history.map((m) => m.ram), tokens.muted);
}

export default function Waybar() {
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { windows: wsWindows, focused } = useWorkspacesStore(
    selectWorkspace(activeWs),
  );
  const wmWindows = useWmStore((s) => s.windows);
  const reducedMotion = usePrefersReducedMotion();

  const [now, setNow] = useState(() => new Date());
  const [uptimeSec, setUptimeSec] = useState(0);
  const [metrics, setMetrics] = useState<{ cpu: number; ram: number }>(() => nextMetrics());
  const [powerOpen, setPowerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<{ cpu: number; ram: number }[]>([]);

  // Clock refresh (60s) + uptime/tray tick (1s). setState inside the interval
  // callbacks is allowed (async-callback exemption); both intervals are
  // cleared on unmount so nothing updates an unmounted component. Uptime
  // counts ticks from mount (no Date.now() at render — purity rule).
  useEffect(() => {
    const tokens = readSparkTokens();
    const clockId = window.setInterval(() => setNow(new Date()), CLOCK_MS);
    const tickId = window.setInterval(() => {
      setUptimeSec((s) => s + 1);
      const next = nextMetrics();
      setMetrics(next);
      historyRef.current = [...historyRef.current, next].slice(-SPARK_MAX);
      const canvas = canvasRef.current;
      if (canvas) drawSparkline(canvas, historyRef.current, tokens);
    }, TICK_MS);
    return () => {
      window.clearInterval(clockId);
      window.clearInterval(tickId);
    };
  }, []);

  // Close the power menu on Escape while it is open.
  useEffect(() => {
    if (!powerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPowerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [powerOpen]);

  /** Opens the launcher (arrives in todo 11). */
  const openLauncher = () => {
    // TODO(todo 11): Launcher listens for zaidos:toggle-launcher
    window.dispatchEvent(new CustomEvent("zaidos:toggle-launcher"));
  };

  /**
   * Focused task -> minimize (toggle); otherwise focus (restores a minimized
   * task). The !minimized guard: a focused-but-minimized task (last window
   * hidden) must restore, not re-minimize.
   */
  const onTaskClick = (id: string, minimized: boolean) => {
    const workspaces = useWorkspacesStore.getState();
    const slot = workspaces.workspaces[workspaces.activeWs];
    if (slot.focused === id && !minimized) {
      useWmStore.getState().minimize(id);
    } else {
      focusWindow(id);
    }
  };

  /** Log out: short fade overlay, then replay the boot sequence. The
   *  reduced-motion path skips the fade entirely. */
  const logout = () => {
    setPowerOpen(false);
    if (reducedMotion) {
      useBootStore.getState().resetBoot();
      return;
    }
    setLoggingOut(true);
    window.setTimeout(() => useBootStore.getState().resetBoot(), LOGOUT_MS);
  };

  return (
    <header
      data-testid="waybar"
      className="window-glass fixed inset-x-0 top-0 z-40 hidden h-[var(--waybar-h)] items-center gap-3 border-b border-zaid-border px-3 font-mono text-xs text-zaid-muted md:flex"
    >
      {/* ---- left: launcher + workspace pills ---- */}
      <button
        type="button"
        data-testid="waybar-launcher"
        aria-label="Open launcher"
        title="Launcher (Super+Space)"
        onClick={openLauncher}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-surface2 hover:text-zaid-text"
      >
        <Command size={14} aria-hidden="true" />
      </button>

      <div role="group" aria-label="Workspaces" className="flex items-center gap-1">
        {WORKSPACE_IDS.map((ws) => {
          const active = ws === activeWs;
          return (
            <button
              key={ws}
              type="button"
              data-testid={`waybar-pill-${ws}`}
              data-active={active ? "true" : "false"}
              aria-pressed={active}
              title={workspaceLabel(ws)}
              aria-label={`Workspace ${ws}: ${workspaceLabel(ws)}`}
              onClick={() => useWorkspacesStore.getState().setActive(ws)}
              className={`flex h-6 items-center rounded px-1.5 transition-colors ${
                active
                  ? "bg-zaid-accent font-semibold text-zaid-bg"
                  : "text-zaid-muted hover:bg-zaid-surface2 hover:text-zaid-text"
              }`}
            >
              {workspaceLabel(ws)}
            </button>
          );
        })}
      </div>

      {/* ---- window taskbar: one task per open window on this workspace ---- */}
      <div
        role="toolbar"
        aria-label="Windows"
        data-testid="waybar-tasks"
        className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
      >
        {wsWindows.map((id) => {
          const win = wmWindows[id];
          if (win === undefined) return null;
          const active = focused === id;
          const visible = isVisible(id);
          return (
            <button
              key={id}
              type="button"
              data-testid={`waybar-task-${win.appId}`}
              data-window={id}
              data-app={win.appId}
              data-active={active ? "true" : "false"}
              data-minimized={visible ? "false" : "true"}
              aria-label={win.title}
              title={win.title}
              onClick={() => onTaskClick(id, !visible)}
              className={`flex h-6 min-w-0 max-w-36 items-center gap-1.5 rounded px-1.5 transition-colors ${
                active
                  ? "bg-zaid-surface2 text-zaid-text"
                  : "text-zaid-muted hover:bg-zaid-surface2/60 hover:text-zaid-text"
              } ${visible ? "opacity-100" : "opacity-50"}`}
            >
              <AppIcon appId={win.appId} size={12} className="shrink-0" />
              <span className="truncate">{win.title}</span>
            </button>
          );
        })}
      </div>

      {/* ---- right: clock, uptime, tray, socials, power ---- */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex flex-col items-end leading-tight">
          <span
            data-testid="waybar-clock"
            className="text-xs font-semibold text-zaid-text tabular-nums"
          >
            {formatClock(now)}
          </span>
          <span data-testid="waybar-date" className="text-[10px] text-zaid-muted">
            {formatDate(now)}
          </span>
        </div>

        <span
          data-testid="waybar-uptime"
          className="hidden text-[11px] tabular-nums lg:block"
        >
          {formatUptime(uptimeSec)}
        </span>

        {/* demo values, not real metrics */}
        <div
          data-testid="waybar-tray"
          title="System tray (demo values, not real metrics)"
          className="flex items-center gap-1.5"
        >
          <span className="tabular-nums">
            {`CPU ${metrics.cpu}% RAM ${metrics.ram}%`}
          </span>
          <canvas
            ref={canvasRef}
            data-testid="waybar-spark"
            aria-hidden="true"
            className="h-3 w-16"
          />
        </div>

        <a
          href="#"
          aria-label="GitHub"
          title="GitHub"
          className="flex h-6 w-6 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-surface2 hover:text-zaid-text"
        >
          <AtSign size={14} aria-hidden="true" />
        </a>
        <a
          href="#"
          aria-label="LinkedIn"
          title="LinkedIn"
          className="flex h-6 w-6 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-surface2 hover:text-zaid-text"
        >
          <Link size={14} aria-hidden="true" />
        </a>

        <button
          type="button"
          data-testid="power-button"
          aria-label="Power menu"
          title="Power"
          onClick={() => setPowerOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-danger hover:text-zaid-bg"
        >
          <Power size={14} aria-hidden="true" />
        </button>
      </div>

      {/* ---- power easter-egg menu ---- */}
      {powerOpen && (
        <>
          {/* click-away backdrop (must NOT open the desktop context menu) */}
          <div
            data-testid="power-menu-backdrop"
            className="fixed inset-0 z-40"
            onClick={() => setPowerOpen(false)}
          />
          <div
            data-testid="power-menu"
            role="dialog"
            aria-label="Power menu"
            className="window-glass hairline fixed right-3 top-[calc(var(--waybar-h)+0.5rem)] z-50 flex w-40 flex-col gap-0.5 rounded-lg p-1 font-mono text-xs"
          >
            <button
              type="button"
              data-testid="power-menu-reboot"
              onClick={() => useBootStore.getState().resetBoot()}
              className="flex items-center rounded px-2 py-1.5 text-left text-zaid-text transition-colors hover:bg-zaid-surface2"
            >
              Reboot
            </button>
            <button
              type="button"
              data-testid="power-menu-logout"
              onClick={logout}
              className="flex items-center rounded px-2 py-1.5 text-left text-zaid-text transition-colors hover:bg-zaid-surface2"
            >
              Log out
            </button>
            <button
              type="button"
              data-testid="power-menu-cancel"
              onClick={() => setPowerOpen(false)}
              className="flex items-center rounded px-2 py-1.5 text-left text-zaid-muted transition-colors hover:bg-zaid-surface2 hover:text-zaid-text"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* logout fade overlay — skipped entirely under reduced motion */}
      {loggingOut && !reducedMotion && (
        <motion.div
          data-testid="logout-overlay"
          className="fixed inset-0 z-[60] bg-zaid-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: LOGOUT_MS / 1000, ease: "easeIn" }}
        />
      )}
    </header>
  );
}
