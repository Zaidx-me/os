"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Reusable Canvas-2D matrix rain wallpaper (ORIGINAL implementation — no
 * copied code; this is a purpose-built renderer, not the canonical snippet).
 *
 * Behaviour contract:
 * - rAF loop capped to ~30fps via frame skip (FRAME_MS), never animates at
 *   display rate.
 * - Pauses entirely while the tab is hidden (visibilitychange cancels the
 *   rAF chain and restarts it on visibility).
 * - prefers-reduced-motion: exactly ONE static frame is painted — no rAF
 *   loop at all. `data-frames` stays frozen at "1", which is what the e2e
 *   suite uses to prove "no loop".
 * - Colors come from the design tokens in globals.css (@theme), read once at
 *   mount through getComputedStyle (fallbacks mirror the token values so the
 *   canvas still works in jsdom, where custom props are empty).
 * - `data-frames` exposes the drawn-frame counter for QA observability (also
 *   reused by the terminal's `matrix` app in a later todo).
 *
 * The renderer is a column model: each drop owns a pre-generated glyph trail
 * and a head position. Every drawn frame unshifts a fresh glyph at the head
 * and fades the older trail cells — a translucent background wash creates the
 * classic motion smear. Heads are drawn in the light text token for contrast,
 * trails in the green accent fading to 15%.
 */

const FRAME_MS = 33; // ~30fps cap
const FONT_PX = 16; // one glyph per 16px column slot
const TRAIL_MAX = 12; // glyphs retained per column
const FADE_ALPHA = 0.085; // translucent background wash per frame

const GLYPHS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789$%#@";

interface Drop {
  x: number;
  y: number; // head position (pixels from top)
  speed: number; // pixels per drawn frame
  glyphs: string[]; // trail, glyphs[0] is the head
  reset: () => void; // teleports the head above the top edge
}

function randomGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
}

interface Tokens {
  bg: [number, number, number];
  accent: [number, number, number];
  text: [number, number, number];
  mono: string;
}

/** Reads the design tokens (globals.css @theme) once, with token-mirroring
 *  fallbacks for environments where getComputedStyle has no custom props
 *  (jsdom). */
function readTokens(): Tokens {
  const fallback = { bg: "#0a0c10", accent: "#39FF14", text: "#e6e9ef" };
  let raw = { ...fallback, mono: "monospace" };
  if (typeof getComputedStyle === "function") {
    const styles = getComputedStyle(document.documentElement);
    raw = {
      bg: styles.getPropertyValue("--color-zaid-bg").trim() || fallback.bg,
      accent:
        styles.getPropertyValue("--color-zaid-accent").trim() || fallback.accent,
      text: styles.getPropertyValue("--color-zaid-text").trim() || fallback.text,
      mono: styles.getPropertyValue("--font-mono").trim() || "monospace",
    };
  }
  const hexToRgb = (hex: string): [number, number, number] => {
    const digits = hex.replace("#", "");
    const expanded =
      digits.length === 3
        ? digits
            .split("")
            .map((c) => c + c)
            .join("")
        : digits;
    const n = Number.parseInt(expanded, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  return {
    bg: hexToRgb(raw.bg),
    accent: hexToRgb(raw.accent),
    text: hexToRgb(raw.text),
    mono: raw.mono,
  };
}

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return; // jsdom has no 2d context — nothing to draw, no loop

    const { bg, accent, text, mono } = readTokens();
    const [bgR, bgG, bgB] = bg;
    const [acR, acG, acB] = accent;
    const [txR, txG, txB] = text;
    const font = `${FONT_PX}px ${mono}`;

    let width = 0;
    let height = 0;
    let drops: Drop[] = [];

    /** (Re)fits the backing store to the element (devicePixelRatio-aware,
     *  capped at 2x for memory) and rebuilds the column model. Returns false
     *  when the canvas has no laid-out size yet. */
    const fit = (): boolean => {
      const clientWidth = canvas.clientWidth;
      const clientHeight = canvas.clientHeight;
      if (clientWidth === 0 || clientHeight === 0) return false;
      if (clientWidth !== width || clientHeight !== height) {
        width = clientWidth;
        height = clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = font;
        drops = buildDrops();
      }
      return true;
    };

    const buildDrops = (): Drop[] => {
      const columns = Math.max(1, Math.floor(width / FONT_PX));
      return Array.from({ length: columns }, (_, i) => {
        const drop: Drop = {
          x: i * FONT_PX + FONT_PX / 2,
          y: 0,
          speed: 0,
          glyphs: [],
          reset() {
            drop.glyphs = Array.from({ length: TRAIL_MAX }, randomGlyph);
            drop.y = -Math.random() * height * 1.2 - TRAIL_MAX * FONT_PX;
            drop.speed = 1.5 + Math.random() * 4.5;
          },
        };
        drop.reset();
        // Scatter heads across the viewport so the first frame already shows
        // rain instead of an empty screen converging over a second.
        drop.y = Math.random() * (height + TRAIL_MAX * FONT_PX) - TRAIL_MAX * FONT_PX;
        return drop;
      });
    };

    const fadeWash = () => {
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${FADE_ALPHA})`;
      ctx.fillRect(0, 0, width, height);
    };

    const drawFrame = () => {
      if (!fit()) return;
      fadeWash();
      for (const drop of drops) {
        drop.glyphs.unshift(randomGlyph());
        if (drop.glyphs.length > TRAIL_MAX) drop.glyphs.pop();
        const headY = drop.y;
        for (let i = 0; i < drop.glyphs.length; i++) {
          if (i === 0) {
            // Bright head glyph in the light text token.
            ctx.fillStyle = `rgba(${txR}, ${txG}, ${txB}, 1)`;
          } else {
            // Trail fades from full accent to 15%.
            const alpha = 1 - (i / TRAIL_MAX) * 0.85;
            ctx.fillStyle = `rgba(${acR}, ${acG}, ${acB}, ${alpha.toFixed(3)})`;
          }
          ctx.fillText(drop.glyphs[i], drop.x, headY - i * FONT_PX);
        }
        drop.y += drop.speed;
        if (drop.y - TRAIL_MAX * FONT_PX > height) drop.reset();
      }
    };

    /** Single frozen frame for reduced-motion visitors: opaque base plus a
     *  few mid-brightness trail glyphs per column. */
    const drawStatic = () => {
      if (!fit()) return;
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, width, height);
      for (const drop of drops) {
        for (let i = 0; i < 3; i++) {
          const glyph =
            drop.glyphs[(drop.glyphs.length - 1 - i + drop.glyphs.length) % drop.glyphs.length];
          const alpha = 0.25 + 0.22 * i;
          ctx.fillStyle = `rgba(${acR}, ${acG}, ${acB}, ${alpha.toFixed(3)})`;
          ctx.fillText(glyph ?? "0", drop.x, drop.y - i * FONT_PX);
        }
      }
    };

    // Reduced motion: paint exactly one static frame, never start the loop.
    if (reducedMotion) {
      drawStatic();
      canvas.dataset.frames = "1";
      return;
    }

    let rafId = 0;
    let frames = 0;

    const startLoop = () => {
      let last = 0;
      const loop = (t: number) => {
        if (t - last >= FRAME_MS) {
          last = t;
          drawFrame();
          frames += 1;
          canvas.dataset.frames = String(frames);
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    };

    // Pause entirely while the tab is hidden; resume on visibility.
    const onVisibilityChange = () => {
      cancelAnimationFrame(rafId);
      if (!document.hidden) startLoop();
    };

    startLoop();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="matrix-rain"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}
