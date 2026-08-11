import { lazy } from "react";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";
import type { AppId } from "@/components/ui/AppIcon";
import { AppIcon } from "@/components/ui/AppIcon";
import type { WorkspaceId } from "@/store/workspaces";

/**
 * App registry — metadata shared by every shell surface that lists apps
 * (desktop icons, launcher, taskbar, window frame) PLUS the lazy-loaded window
 * content each app renders inside a WindowHost.
 *
 * The 11 apps mirror APP_IDS from components/ui/AppIcon.tsx exactly — a
 * registry entry whose id is not in APP_IDS is a bug (validation test locks
 * this in apps.test.ts). The ENTRY ORDER is significant: the launcher grid and
 * the desktop icon grid render apps in APPS order, so keep them sorted as
 * terminal, about, projects, skills, experience, resume, contact, articles,
 * settings, chat, chess.
 */

/**
 * Props every windowed app receives from WindowHost. Real apps use these to
 * drive their chrome; placeholder apps ignore them.
 */
export interface WindowAppProps {
  windowId: string;
  close: () => void;
  minimize: () => void;
  maximize: () => void;
  setTitle: (title: string) => void;
}

export type WindowAppComponent = ComponentType<WindowAppProps>;

/**
 * Registry entry for one app.
 *
 * `component` is lazily imported (code-splitting): WindowHost Suspends while
 * the chunk loads and never statically imports an app component. `defaultSize`
 * is the float size used when the app opens (wm.open viewport-caps it).
 * `defaultWorkspace` pins an app to a workspace when opened without an explicit
 * one (terminal joins the "term" workspace). Icons render via AppIcon(appId) —
 * the glyph map in components/ui/AppIcon.tsx stays the single source.
 */
export interface AppMeta {
  id: AppId;
  /** Human title shown on icons, launcher, titlebars, and taskbar. */
  title: string;
  /** Icon element used by window chrome and the WindowHost loading fallback. */
  icon: ReactNode;
  /** Launcher search keywords (fuzzy-scored alongside the title). */
  keywords: string[];
  /** Lazy window content, resolved by WindowHost under Suspense. */
  component: LazyExoticComponent<WindowAppComponent>;
  /** Initial float window size (viewport-capped by wm.open). */
  defaultSize: { w: number; h: number };
  /** Workspace to open on when no workspace is specified (active ws wins). */
  defaultWorkspace?: WorkspaceId;
}

export const APPS: readonly AppMeta[] = [
  {
    id: "terminal",
    title: "Terminal",
    icon: <AppIcon appId="terminal" size={20} />,
    keywords: ["shell", "bash", "zaid@zaidos", "console", "cli"],
    component: lazy(() => import("@/components/apps/TerminalApp")),
    defaultSize: { w: 640, h: 480 },
    defaultWorkspace: 1,
  },
  {
    id: "about",
    title: "About",
    icon: <AppIcon appId="about" size={20} />,
    keywords: ["me", "bio", "zaid", "profile", "whoami"],
    component: lazy(() => import("@/components/apps/AboutApp")),
    defaultSize: { w: 720, h: 540 },
  },
  {
    id: "projects",
    title: "Projects",
    icon: <AppIcon appId="projects" size={20} />,
    keywords: ["github", "repos", "work", "portfolio"],
    component: lazy(() => import("@/components/apps/ProjectsApp")),
    defaultSize: { w: 760, h: 560 },
  },
  {
    id: "skills",
    title: "Skills",
    icon: <AppIcon appId="skills" size={20} />,
    keywords: ["tech", "stack", "tools", "languages"],
    component: lazy(() => import("@/components/apps/SkillsApp")),
    defaultSize: { w: 640, h: 520 },
  },
  {
    id: "experience",
    title: "Experience",
    icon: <AppIcon appId="experience" size={20} />,
    keywords: ["work", "job", "education", "timeline", "resume history"],
    component: lazy(() => import("@/components/apps/ExperienceApp")),
    defaultSize: { w: 700, h: 540 },
  },
  {
    id: "resume",
    title: "Resume",
    icon: <AppIcon appId="resume" size={20} />,
    keywords: ["cv", "print", "pdf", "download"],
    component: lazy(() => import("@/components/apps/ResumeApp")),
    defaultSize: { w: 620, h: 760 },
  },
  {
    id: "contact",
    title: "Contact",
    icon: <AppIcon appId="contact" size={20} />,
    keywords: ["email", "hello", "message", "reach"],
    component: lazy(() => import("@/components/apps/ContactApp")),
    defaultSize: { w: 560, h: 600 },
  },
  {
    id: "articles",
    title: "Articles",
    icon: <AppIcon appId="articles" size={20} />,
    keywords: ["blog", "posts", "writing", "notes"],
    component: lazy(() => import("@/components/apps/ArticlesApp")),
    defaultSize: { w: 700, h: 540 },
  },
  {
    id: "settings",
    title: "Settings",
    icon: <AppIcon appId="settings" size={20} />,
    keywords: ["options", "preferences", "wallpaper", "theme"],
    component: lazy(() => import("@/components/apps/SettingsApp")),
    defaultSize: { w: 560, h: 520 },
  },
  {
    id: "chat",
    title: "ZaidGPT",
    icon: <AppIcon appId="chat" size={20} />,
    keywords: ["ai", "assistant", "chatbot", "gpt", "bot"],
    component: lazy(() => import("@/components/apps/ChatApp")),
    defaultSize: { w: 640, h: 520 },
  },
  {
    id: "chess",
    title: "Chess",
    icon: <AppIcon appId="chess" size={20} />,
    keywords: ["game", "london", "play", "board"],
    component: lazy(() => import("@/components/apps/ChessApp")),
    defaultSize: { w: 480, h: 520 },
  },
];

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
