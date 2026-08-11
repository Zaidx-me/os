/**
 * Command registry — the shelf every shell command hangs on.
 *
 * Commands are registered once per `createShell()` (see shell.ts), keyed by
 * name; aliases resolve to the same entry. The registry is deliberately
 * module-level: content commands (todo 25) register from their own modules
 * without threading a store through the app.
 */
import type {
  Article,
  ExperienceEntry,
  Project,
  SkillGroup,
  Social,
  WallpaperType,
} from "@/content";
import type { site } from "@/content";
import type { FakeFs } from "./fakefs";

/** The content data layer the shell commands read from (todo 25 uses it). */
export interface ContentData {
  site: typeof site;
  projects: readonly Project[];
  skillGroups: readonly SkillGroup[];
  experience: readonly ExperienceEntry[];
  socials: readonly Social[];
  articles: readonly Article[];
}

/**
 * Everything a command may reach for. Wired once in TerminalApp: opening an
 * app, reading the content data layer, switching the wallpaper, or toggling
 * the launcher — never raw stores.
 */
export interface ShellContext {
  openApp: (appId: string) => void;
  data: ContentData;
  wallpaper: (type: WallpaperType) => void;
  launcher: () => void;
  /** Wired by TerminalApp so `exit` can close its window. */
  close?: () => void;
  /** Wired by TerminalApp — `matrix` / `cmatrix` show the full-screen overlay. */
  showMatrix?: () => void;
}

/** A command's rendered output: lines, or nothing. */
export type CommandOutput = readonly string[] | void;

export interface ShellCommand {
  name: string;
  aliases?: readonly string[];
  /** One-line description shown by `help`. */
  help: string;
  handler: (args: readonly string[], ctx: ShellContext) => CommandOutput;
  /** Tab-completion candidates for the current (partial) argument. */
  complete?: (args: readonly string[], fs: FakeFs) => readonly string[];
}

const commands = new Map<string, ShellCommand>();

/** Register (or replace) a command by name. */
export function register(cmd: ShellCommand): void {
  commands.set(cmd.name, cmd);
}

/** Find a command by name or alias; undefined when unknown (never throws). */
export function findCommand(name: string): ShellCommand | undefined {
  const direct = commands.get(name);
  if (direct) return direct;
  for (const cmd of commands.values()) {
    if (cmd.aliases?.includes(name)) return cmd;
  }
  return undefined;
}

/** All registered commands, in registration order. */
export function listCommands(): readonly ShellCommand[] {
  return [...commands.values()];
}

/** Test helper: drop every registered command. */
export function clearCommands(): void {
  commands.clear();
}
