import type { ReactNode } from "react";
import { getSvgPath } from "figma-squircle";

/**
 * Liquid Glass app icons — true squircle clip, specular highlight layer,
 * and macOS/iOS semantic glyphs.
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
  "browser",
  "files",
  "calculator",
  "notes",
  "editor",
  "monitor",
  "music",
  "photos",
  "chat",
  "chess",
  "snake",
] as const;

export type AppId = (typeof APP_IDS)[number];

export type IconRenderMode = "default" | "dark" | "clear-light" | "clear-dark";
export type IconShape = "app" | "document" | "folder";

const APP_LABELS: Record<string, string> = {
  about: "Contacts",
  projects: "Projects",
  skills: "Skills",
  experience: "Experience",
  resume: "Resume",
  contact: "Mail",
  articles: "News",
  settings: "Settings",
  terminal: "Terminal",
  browser: "Safari",
  files: "Finder",
  calculator: "Calculator",
  notes: "Notes",
  editor: "Editor",
  monitor: "Activity Monitor",
  music: "Music",
  photos: "Photos",
  chat: "Messages",
  chess: "Chess",
  snake: "Snake",
};

const FALLBACK_LABEL = "App";

const ICON_GRADIENTS: Record<string, { top: string; bottom: string }> = {
  terminal: { top: "#3a3a3c", bottom: "#1c1c1e" },
  browser: { top: "#ffffff", bottom: "#e8f4ff" },
  files: { top: "#64d2ff", bottom: "#0071e3" },
  calculator: { top: "#2c2c2e", bottom: "#0a0a0a" },
  notes: { top: "#ffe566", bottom: "#ffcc00" },
  editor: { top: "#48484a", bottom: "#1c1c1e" },
  monitor: { top: "#1c1c1e", bottom: "#000000" },
  music: { top: "#ff6482", bottom: "#fa233b" },
  photos: { top: "#ffffff", bottom: "#f2f2f7" },
  about: { top: "#c7c7cc", bottom: "#8e8e93" },
  projects: { top: "#5e5ce6", bottom: "#3634a3" },
  skills: { top: "#30d158", bottom: "#248a3d" },
  experience: { top: "#ff9f0a", bottom: "#ff6723" },
  resume: { top: "#ffffff", bottom: "#d1d1d6" },
  contact: { top: "#64d2ff", bottom: "#007aff" },
  articles: { top: "#ff453a", bottom: "#d70015" },
  settings: { top: "#aeaeb2", bottom: "#636366" },
  chat: { top: "#30d158", bottom: "#248a3d" },
  chess: { top: "#8b7355", bottom: "#5c4a32" },
  snake: { top: "#34c759", bottom: "#248a3d" },
};

function squirclePath(size: number): string {
  return getSvgPath({
    width: size,
    height: size,
    cornerRadius: size * 0.2237,
    cornerSmoothing: 0.6,
  });
}

const GLYPHS: Record<string, ReactNode> = {
  terminal: (
    <>
      <path d="M5 7.5l4.2 4.5L5 16.5" stroke="#fff" />
      <path d="M12.5 16.5H19" stroke="#fff" />
    </>
  ),
  browser: (
    <>
      <circle cx="12" cy="12" r="8.5" fill="#fff" stroke="none" />
      <path d="M12 3.5v17M3.5 12h17" stroke="#007AFF" strokeWidth="1.2" />
      <path d="M12 3.5a13 13 0 0 1 0 17" fill="#FF3B30" stroke="none" opacity="0.9" />
      <path d="M12 3.5a13 13 0 0 0 0 17" fill="#007AFF" stroke="none" opacity="0.35" />
      <circle cx="12" cy="12" r="2" fill="#fff" stroke="#333" strokeWidth="0.5" />
    </>
  ),
  files: (
    <>
      <path d="M12 4c-3 0-5.5 2-5.5 5.5 0 2.5 1.5 4.5 3.5 5.5-2 1-3.5 3-3.5 5.5 0 3.5 2.5 5.5 5.5 5.5s5.5-2 5.5-5.5c0-2.5-1.5-4.5-3.5-5.5 2-1 3.5-3 3.5-5.5C17.5 6 15 4 12 4z" fill="#fff" stroke="none" opacity="0.95" />
      <path d="M12 4v16" stroke="#007AFF" strokeWidth="0.8" opacity="0.5" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" fill="#1c1c1e" stroke="none" />
      <rect x="7" y="5" width="10" height="3.5" rx="0.5" fill="#ff9500" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="#fff" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="#fff" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="#fff" stroke="none" />
      <circle cx="9" cy="15.5" r="1" fill="#fff" stroke="none" />
      <circle cx="12" cy="15.5" r="1" fill="#fff" stroke="none" />
      <circle cx="15" cy="15.5" r="1" fill="#fff" stroke="none" />
    </>
  ),
  notes: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" fill="#fff" stroke="#e5c100" strokeWidth="0.5" />
      <path d="M8 8h8M8 11h8M8 14h5" stroke="#c7a600" strokeWidth="0.8" />
      <path d="M15 3v4h4" fill="#f5e6a3" stroke="none" />
    </>
  ),
  editor: <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" stroke="#fff" />,
  monitor: (
    <>
      <path d="M4 14V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8" fill="none" stroke="#30d158" strokeWidth="1.5" />
      <path d="M6 10h3M6 12.5h6" stroke="#30d158" strokeWidth="1.2" />
      <path d="M14 8.5l2 1.5-2 1.5" stroke="#30d158" strokeWidth="1.2" fill="none" />
    </>
  ),
  music: (
    <>
      <circle cx="8" cy="17" r="2.5" fill="#fff" stroke="none" />
      <circle cx="17" cy="15" r="2.5" fill="#fff" stroke="none" />
      <path d="M10.5 17V6l8.5-1.5v11" stroke="#fff" strokeWidth="1.8" fill="none" />
    </>
  ),
  photos: (
    <>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const colors = ["#ff3b30", "#ff9500", "#ffcc00", "#34c759", "#007aff", "#5856d6", "#af52de", "#ff2d55"];
        return (
          <ellipse
            key={deg}
            cx="12"
            cy="8"
            rx="3.5"
            ry="6"
            fill={colors[i]}
            stroke="none"
            transform={`rotate(${deg} 12 12)`}
          />
        );
      })}
      <circle cx="12" cy="12" r="3.2" fill="#fff" stroke="none" />
    </>
  ),
  about: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" fill="#fff" stroke="none" opacity="0.9" />
      <circle cx="12" cy="10" r="2.5" fill="#8e8e93" stroke="none" />
      <path d="M7 17c1-2.5 3-3.5 5-3.5s4 1 5 3.5" fill="#8e8e93" stroke="none" />
      <rect x="4" y="5" width="4" height="14" rx="1" fill="#007AFF" stroke="none" opacity="0.35" />
    </>
  ),
  projects: (
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" stroke="#fff" />
  ),
  skills: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="#fff" />
  ),
  experience: (
    <>
      <rect x="3" y="7" width="18" height="12.5" rx="2" stroke="#fff" fill="none" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" stroke="#fff" />
    </>
  ),
  resume: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" fill="#fff" stroke="none" />
      <path d="M8 8h8M8 11h8M8 14h5" stroke="#8e8e93" strokeWidth="0.8" />
    </>
  ),
  contact: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="#fff" stroke="none" />
      <path d="M3.5 7.5 12 13l8.5-5.5" stroke="#007AFF" strokeWidth="1.2" fill="none" />
      <path d="M3 6h18v4" fill="#64d2ff" stroke="none" opacity="0.35" />
    </>
  ),
  articles: (
    <>
      <path d="M5 5.5h14v13H5z" fill="#fff" stroke="none" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="#ff3b30" strokeWidth="0.9" />
      <rect x="5" y="5.5" width="3" height="13" fill="#ff3b30" stroke="none" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.5" stroke="#fff" fill="none" />
      <path d="M12 2v2.5M12 19.5V22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2 12h2.5M19.5 12H22M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" stroke="#fff" strokeWidth="1.2" />
    </>
  ),
  chat: (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#fff" fill="none" />
  ),
  chess: (
    <>
      <path d="M12 4.5c-1.8 0-3 1-3 2.4s1.2 2.4 3 2.4 3-1 3-2.4-1.2-2.4-3-2.4z" fill="#f5e6d3" stroke="#8b6914" strokeWidth="0.6" />
      <path d="M10 9.5h4v2.5c0 1.5-1 2.5-2 3.5-1-1-2-2-2-3.5v-2.5z" fill="#f5e6d3" stroke="#8b6914" strokeWidth="0.6" />
      <path d="M9 17.5h6" stroke="#8b6914" strokeWidth="1.2" />
    </>
  ),
  snake: (
    <>
      <rect x="4" y="7" width="5" height="5" rx="1" fill="#fff" stroke="none" />
      <rect x="10" y="7" width="5" height="5" rx="1" fill="#fff" stroke="none" opacity="0.85" />
      <rect x="16" y="7" width="4" height="5" rx="1" fill="#fff" stroke="none" opacity="0.7" />
    </>
  ),
};

const FALLBACK_GLYPH = <circle cx="12" cy="12" r="2" fill="white" stroke="none" />;

function modeOpacity(mode: IconRenderMode): number {
  if (mode === "clear-light" || mode === "clear-dark") return 0.22;
  if (mode === "dark") return 0.92;
  return 1;
}

export interface AppIconProps {
  appId: AppId | (string & {});
  size?: number;
  className?: string;
  variant?: "tile" | "glyph";
  renderMode?: IconRenderMode;
  shape?: IconShape;
}

export function iconShapeForApp(appId: string): IconShape {
  if (["resume", "articles", "notes"].includes(appId)) return "document";
  if (["files", "projects"].includes(appId)) return "folder";
  return "app";
}

export function AppIcon({
  appId,
  size = 24,
  className,
  variant = "tile",
  renderMode = "default",
  shape = "app",
}: AppIconProps) {
  const label = APP_LABELS[appId] ?? FALLBACK_LABEL;
  const glyph = GLYPHS[appId] ?? FALLBACK_GLYPH;
  const grad = ICON_GRADIENTS[appId] ?? { top: "#8e8e93", bottom: "#636366" };
  const gid = `app-icon-${String(appId).replace(/[^a-z0-9-]/gi, "")}`;
  const opacity = modeOpacity(renderMode);

  if (variant === "glyph") {
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

  if (shape === "folder") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} className={className}>
        <defs>
          <linearGradient id={`${gid}-folder`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64b5ff" />
            <stop offset="100%" stopColor="#007aff" />
          </linearGradient>
        </defs>
        <path
          d="M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2h8.5A1.5 1.5 0 0 1 21 10.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V7.5z"
          fill={`url(#${gid}-folder)`}
          opacity={opacity}
        />
        <path d="M3 7.5h7l2 2h9" fill="#8ecbff" opacity={opacity * 0.85} />
      </svg>
    );
  }

  if (shape === "document") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={label} className={className}>
        <rect x="5" y="3" width="14" height="18" rx="1" fill="#fff" opacity={opacity} />
        <path d="M15 3v5h5" fill="#e5e5ea" opacity={opacity} />
        <path d="M8 10h8M8 13h8M8 16h5" stroke="#aeaeb2" strokeWidth="0.8" />
      </svg>
    );
  }

  const path = squirclePath(size);
  const glyphScale = size / 24;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className={className}
      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={grad.top} />
          <stop offset="100%" stopColor={grad.bottom} />
        </linearGradient>
        <linearGradient id={`${gid}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${gid})`} opacity={opacity} />
      <path d={path} fill={`url(#${gid}-glass)`} />
      <path d={path} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <g
        transform={`translate(${size / 2} ${size / 2}) scale(${glyphScale * 0.72}) translate(-12 -12)`}
        fill="none"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {glyph}
      </g>
    </svg>
  );
}
