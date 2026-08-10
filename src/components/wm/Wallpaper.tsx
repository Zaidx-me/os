"use client";

import { AnimatePresence, motion } from "motion/react";
import MatrixRain from "@/components/wm/MatrixRain";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  selectWallpaperType,
  useWallpaperStore,
} from "@/store/wallpaper";

/**
 * Active wallpaper rendered behind all windows (mounted at z-0 in the
 * desktop shell). Variants:
 *
 * - `matrix`  — Canvas-2D green rain (MatrixRain, ~30fps, pauses when the
 *               tab is hidden; a single static frame under reduced motion).
 * - `gradient`— Animated hue-rotate on a token-colored gradient. The
 *               `filter: hue-rotate()` animation runs on the compositor;
 *               static under reduced motion.
 * - `dark`    — Static abstract SVG on the dark rice palette.
 * - `light`   — Static abstract SVG, light variant.
 *
 * Crossfades on change via AnimatePresence (old variant exits while the new
 * one enters; durations collapse to 0 under reduced motion). Purely
 * decorative: the whole layer is aria-hidden.
 */
export default function Wallpaper() {
  const type = useWallpaperStore(selectWallpaperType);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      data-testid="wallpaper"
      data-theme={type}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden bg-zaid-bg"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={type}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeInOut" }}
        >
          {type === "matrix" && <MatrixRain />}
          {type === "gradient" && <GradientWallpaper reducedMotion={reducedMotion} />}
          {type === "dark" && <AbstractSvg variant="dark" />}
          {type === "light" && <AbstractSvg variant="light" />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/** Animated hue-shift gradient. `filter: hue-rotate` animates on the
 *  compositor (no layout/paint churn); reduced-motion visitors get the same
 *  gradient, frozen. */
function GradientWallpaper({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <motion.div
      data-testid="gradient-wallpaper"
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(135deg, var(--color-zaid-bg) 0%, var(--color-zaid-accent2) 40%, var(--color-zaid-accent) 72%, var(--color-zaid-surface) 100%)",
      }}
      initial={false}
      animate={
        reducedMotion
          ? undefined
          : { filter: ["hue-rotate(0deg)", "hue-rotate(360deg)"] }
      }
      transition={
        reducedMotion ? undefined : { duration: 24, ease: "linear", repeat: Infinity }
      }
    />
  );
}

/**
 * Deterministic abstract wallpaper — locally generated SVG, no network, no
 * runtime randomness (same output on every render, SSR-safe). A soft blob
 * field + concentric rings + a dot-grid horizon, all built from design
 * tokens via CSS vars.
 */
function AbstractSvg({ variant }: { variant: "dark" | "light" }) {
  const light = variant === "light";
  const bg = light
    ? "color-mix(in srgb, var(--color-zaid-text) 90%, white)"
    : "var(--color-zaid-bg)";
  const ringStroke = "var(--color-zaid-border)";
  const ringOpacity = light ? 0.55 : 0.7;
  const gridDot = light ? "var(--color-zaid-muted)" : "var(--color-zaid-border)";
  const accentDot = light ? "var(--color-zaid-accent2)" : "var(--color-zaid-accent)";

  // Deterministic dot-grid horizon (arithmetic skip pattern — no RNG).
  const dots: { x: number; y: number; accent: boolean }[] = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 26; col++) {
      if ((row * 7 + col * 13) % 5 === 0) continue;
      dots.push({
        x: 40 + col * 54,
        y: 620 + row * 34,
        accent: (row * 7 + col * 13) % 17 === 0,
      });
    }
  }

  return (
    <svg
      data-testid={`${variant}-wallpaper`}
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
    >
      <defs>
        <radialGradient id={`blob-a-${variant}`} cx="78%" cy="12%" r="70%">
          <stop
            offset="0%"
            stopColor="var(--color-zaid-accent2)"
            stopOpacity={light ? 0.3 : 0.5}
          />
          <stop offset="100%" stopColor="var(--color-zaid-accent2)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`blob-b-${variant}`} cx="10%" cy="88%" r="60%">
          <stop
            offset="0%"
            stopColor={light ? "var(--color-zaid-muted)" : "var(--color-zaid-accent)"}
            stopOpacity={light ? 0.35 : 0.16}
          />
          <stop offset="100%" stopColor={light ? "var(--color-zaid-muted)" : "var(--color-zaid-accent)"} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* base */}
      <rect width="1440" height="900" fill={bg} />
      {/* soft blobs */}
      <rect width="1440" height="900" fill={`url(#blob-a-${variant})`} />
      <rect width="1440" height="900" fill={`url(#blob-b-${variant})`} />

      {/* concentric rings */}
      {[90, 170, 260, 360].map((r, i) => (
        <circle
          key={r}
          cx="330"
          cy="470"
          r={r}
          fill="none"
          stroke={ringStroke}
          strokeWidth="1"
          opacity={ringOpacity * (0.55 + 0.15 * i)}
        />
      ))}

      {/* diagonal hairline */}
      <line
        x1="1440"
        y1="120"
        x2="60"
        y2="900"
        stroke="var(--color-zaid-accent2)"
        strokeWidth="1"
        opacity={light ? 0.35 : 0.14}
      />

      {/* dot-grid horizon */}
      {dots.map((dot) => (
        <circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={dot.accent ? 3 : 2}
          fill={dot.accent ? accentDot : gridDot}
          opacity={dot.accent ? 0.9 : 0.55}
        />
      ))}

      {/* horizon line */}
      <rect
        y="618"
        width="1440"
        height="1"
        fill={light ? "var(--color-zaid-border)" : "var(--color-zaid-muted)"}
        opacity="0.35"
      />
    </svg>
  );
}
