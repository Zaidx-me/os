import type { ReactNode } from "react";

/**
 * ZaidOS app icons — custom, rice-style, geometric SVGs drawn to match the
 * dark Hyprland desktop aesthetic. Every glyph is stroke-based
 * (thin strokes, round caps), renders in `currentColor` so it inherits the
 * accent/text color of its parent, and contains NO emoji.
 *
 * Unknown appIds render a deterministic generic "app" glyph (never throw).
 */

export const APP_IDS = [
  "about",
  "projects",
  "skills",
  "experience",
  "resume",
  "contact",
  "articles",
  "settings",
  "terminal",
  "chat",
  "chess",
] as const;

export type AppId = (typeof APP_IDS)[number];

/** Human-readable accessible names (asserted by AppIcon.test.tsx). */
const APP_LABELS: Record<string, string> = {
  about: "About",
  projects: "Projects",
  skills: "Skills",
  experience: "Experience",
  resume: "Resume",
  contact: "Contact",
  articles: "Articles",
  settings: "Settings",
  terminal: "Terminal",
  chat: "Chat",
  chess: "Chess",
};

const FALLBACK_LABEL = "App";

/** One-off path/anatomy set per app. Shared stroke props applied by <AppIcon/>. */
const GLYPHS: Record<string, ReactNode> = {
  // prompt chevron + underscore cursor
  terminal: (
    <>
      <path d="M5 7.5l4.2 4.5L5 16.5" />
      <path d="M12.5 16.5H19" />
    </>
  ),
  // person: head + shoulders
  about: (
    <>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 19.5c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5" />
    </>
  ),
  // folder
  projects: (
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
  ),
  // wrench
  skills: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  // briefcase
  experience: (
    <>
      <rect x="3" y="7" width="18" height="12.5" rx="2" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
    </>
  ),
  // document with text lines
  resume: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8.5 9h7" />
      <path d="M8.5 12.5h7" />
      <path d="M8.5 16h4" />
    </>
  ),
  // envelope
  contact: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </>
  ),
  // open book
  articles: (
    <>
      <path d="M12 6.2C10.3 4.9 7.8 4.6 4.5 5.3v12.4c3.3-.7 5.8-.4 7.5.9 1.7-1.3 4.2-1.6 7.5-.9V5.3c-3.3-.7-5.8-.4-7.5.9z" />
      <path d="M12 6.2v12.4" />
    </>
  ),
  // sliders (settings)
  settings: (
    <>
      <path d="M4 6.5h16" />
      <circle cx="9" cy="6.5" r="1.8" fill="currentColor" stroke="none" />
      <path d="M4 12h16" />
      <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <path d="M4 17.5h16" />
      <circle cx="7" cy="17.5" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  // message bubble with tail
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  // chess pawn
  chess: (
    <>
      <circle cx="12" cy="5" r="2.4" />
      <path d="M12 7.4c-2.2 1.1-2.9 3.2-1.7 4.6.9 1 1.7 2 1.7 3.2v2.3" />
      <path d="M8.5 19.5h7" />
    </>
  ),
};

/** Deterministic fallback for unknown appIds: generic app tile with center dot. */
const FALLBACK_GLYPH = (
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </>
);

export interface AppIconProps {
  /** Any string renders (fallback glyph for unknown ids — no throw). */
  appId: AppId | (string & {});
  /** Render size in px (default 24 — desktop-icon/titlebar density). */
  size?: number;
  className?: string;
}

/**
 * Renders the ZaidOS glyph for an app. Accessible name = humanized app label
 * (e.g. appId "terminal" -> aria-label "Terminal"); unknown ids get the
 * generic "App" glyph. Colors inherit via currentColor.
 */
export function AppIcon({ appId, size = 24, className }: AppIconProps) {
  const glyph = GLYPHS[appId] ?? FALLBACK_GLYPH;
  const label = APP_LABELS[appId] ?? FALLBACK_LABEL;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      className={className}
    >
      {glyph}
    </svg>
  );
}
