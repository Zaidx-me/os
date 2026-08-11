import type { AppId } from "@/components/ui/AppIcon";

/**
 * App registry — metadata shared by every shell surface that lists apps
 * (desktop icons, launcher, taskbar). Holds the id/title/keywords portion;
 * todo 15 extends this module with lazy component imports + defaultSize for
 * the window content provider.
 *
 * The 11 apps mirror APP_IDS from components/ui/AppIcon.tsx exactly — a
 * registry entry whose id is not in APP_IDS is a bug (validation test locks
 * this in apps.test.ts).
 */

export interface AppMeta {
  id: AppId;
  /** Human title shown on icons, launcher, titlebars, and taskbar. */
  title: string;
  /** Launcher search keywords (fuzzy-scored alongside the title). */
  keywords: string[];
}

export const APPS: readonly AppMeta[] = [
  {
    id: "terminal",
    title: "Terminal",
    keywords: ["shell", "bash", "zaid@zaidos", "console", "cli"],
  },
  {
    id: "about",
    title: "About",
    keywords: ["me", "bio", "zaid", "profile", "whoami"],
  },
  {
    id: "projects",
    title: "Projects",
    keywords: ["github", "repos", "work", "portfolio"],
  },
  {
    id: "skills",
    title: "Skills",
    keywords: ["tech", "stack", "tools", "languages"],
  },
  {
    id: "experience",
    title: "Experience",
    keywords: ["work", "job", "education", "timeline", "resume history"],
  },
  {
    id: "resume",
    title: "Resume",
    keywords: ["cv", "print", "pdf", "download"],
  },
  {
    id: "contact",
    title: "Contact",
    keywords: ["email", "hello", "message", "reach"],
  },
  {
    id: "articles",
    title: "Articles",
    keywords: ["blog", "posts", "writing", "notes"],
  },
  {
    id: "settings",
    title: "Settings",
    keywords: ["options", "preferences", "wallpaper", "theme"],
  },
  {
    id: "chat",
    title: "ZaidGPT",
    keywords: ["ai", "assistant", "chatbot", "gpt", "bot"],
  },
  {
    id: "chess",
    title: "Chess",
    keywords: ["game", "london", "play", "board"],
  },
] as const;

/** Looks up app metadata by id; undefined for unknown ids (never throws). */
export function getAppMeta(appId: string): AppMeta | undefined {
  return APPS.find((app) => app.id === appId);
}

/** Title for an app id, falling back to the humanized id for unknown ids. */
export function appTitle(appId: string): string {
  return (
    getAppMeta(appId)?.title ??
    appId.replace(/[-_]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
  );
}
