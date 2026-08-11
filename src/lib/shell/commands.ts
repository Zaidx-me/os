/**
 * Content shell commands (todo 25) — every handler reads from the data layer
 * via ShellContext.data; nothing is hardcoded. Registered once per shell via
 * registerContentCommands() from shell.ts.
 */
import { APP_IDS } from "@/components/ui/AppIcon";
import { cowsay } from "./cowsay";
import { randomFortune } from "./fortune";
import { neofetch, readNeofetchEnv } from "./neofetch";
import { openBrowser } from "@/lib/wm/openBrowser";
import { register } from "./registry";

export const SUDOERS_JOKE =
  "zaid is not in the sudoers file. This incident will be reported. (to the chess board)";

export const SUDO_RM_JOKE =
  "nice try. this isn't real, and neither is your productivity.";

/** Two-column help grid: name padded, em dash, description. */
export function formatHelpGrid(
  entries: readonly { name: string; help: string }[],
): string[] {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  const width = Math.max(...sorted.map((e) => e.name.length), 1);
  return sorted.map((e) => `${e.name.padEnd(width + 2)}— ${e.help}`);
}

export function registerContentCommands(): void {
  register({
    name: "fortune",
    help: "print a witty line in Zaid's voice",
    handler: () => [randomFortune()],
  });

  register({
    name: "cowsay",
    help: "ASCII cow says a fortune line",
    handler: (args) => cowsay(args.length > 0 ? args.join(" ") : undefined),
  });

  register({
    name: "matrix",
    aliases: ["cmatrix"],
    help: "full-screen matrix rain until Esc or click",
    handler: (_args, ctx) => {
      ctx.showMatrix?.();
      return ["Entering the Matrix… (Esc or click to exit)"];
    },
  });

  register({
    name: "nano",
    aliases: ["vim", "edit"],
    help: "open the text editor (optional path)",
    handler: (args, ctx) => {
      ctx.openApp("editor");
      return args[0] ? [`Editing ${args[0]}…`] : ["Opened Editor."];
    },
  });

  register({
    name: "browse",
    aliases: ["browser"],
    help: "open the in-OS tabbed browser (optional URL)",
    handler: (args) => {
      const raw = args[0];
      if (raw) {
        openBrowser(raw);
        return [`Opening ${raw} in Browser…`];
      }
      openBrowser();
      return ["Opening Browser…"];
    },
  });

  register({
    name: "neofetch",
    help: "print system info (simulated)",
    handler: () => neofetch(readNeofetchEnv()),
  });

  register({
    name: "about",
    help: "print bio and personality chips",
    handler: (_args, ctx) => {
      const { site } = ctx.data;
      return [
        site.owner,
        site.roleLine,
        "",
        ...site.bio,
        "",
        site.personalityChips.join(" · "),
      ];
    },
  });

  register({
    name: "projects",
    help: "list project ids and status from the data layer",
    handler: (_args, ctx) =>
      ctx.data.projects.map((p) => `${p.id}  [${p.status}]`),
  });

  register({
    name: "skills",
    help: "list skill groups and skills",
    handler: (_args, ctx) =>
      ctx.data.skillGroups.flatMap((g) => [
        `${g.label}:`,
        ...g.skills.map((s) => `  ${s.name}${s.note ? ` — ${s.note}` : ""}`),
        "",
      ]),
  });

  register({
    name: "experience",
    help: "print experience and education timeline",
    handler: (_args, ctx) =>
      ctx.data.experience.flatMap((e) => [
        `${e.role} @ ${e.org}${e.current ? " (current)" : ""}`,
        ...e.bullets.map((b) => `  • ${b}`),
        "",
      ]),
  });

  register({
    name: "contact",
    help: "show contact email and social handles",
    handler: (_args, ctx) => {
      const { site, socials } = ctx.data;
      return [
        site.contactEmail,
        "",
        ...socials.slice(0, 3).map((s) => `${s.label}: ${s.handle}`),
      ];
    },
  });

  register({
    name: "socials",
    help: "list social profile URLs",
    handler: (_args, ctx) =>
      ctx.data.socials.map((s) => `${s.label}: ${s.url}`),
  });

  register({
    name: "whoami",
    help: "who am I?",
    handler: () => ["zaid — developer who rices his desktop"],
  });

  register({
    name: "date",
    help: "print the current date and time",
    handler: () => [new Date().toString()],
  });

  register({
    name: "echo",
    help: "print arguments to stdout",
    handler: (args) => (args.length === 0 ? [""] : [args.join(" ")]),
  });

  register({
    name: "exit",
    help: "close the terminal window",
    handler: (_args, ctx) => {
      ctx.close?.();
      return [];
    },
  });

  register({
    name: "open",
    help: "open an app window by id",
    handler: (args, ctx) => {
      const appId = args[0];
      if (appId === undefined) return ["open: missing app name"];
      if (!(APP_IDS as readonly string[]).includes(appId)) {
        return [`open: unknown app '${appId}'`];
      }
      ctx.openApp(appId);
      return [`Opened ${appId}.`];
    },
    complete: (args) => {
      const prefix = args[0] ?? "";
      return (APP_IDS as readonly string[]).filter((id) =>
        id.startsWith(prefix),
      );
    },
  });
}

export function sudoHandler(args: readonly string[]): readonly string[] {
  const joined = args.join(" ");
  if (joined === "rm -rf /" || joined === "rm -rf / ") {
    return [SUDO_RM_JOKE];
  }
  return [SUDOERS_JOKE];
}
