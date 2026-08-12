import { cowsay } from "./cowsay.js";
import { randomFortune } from "./fortune.js";
import { neofetch, readNeofetchEnv } from "./neofetch.js";
import { register } from "./registry.js";

/** App ids the `open` command understands. */
export const APP_IDS = [
  "Finder", "Launchpad", "Safari", "Messages", "Mail", "Maps", "Photos", "FaceTime",
  "Phone", "Calendar", "Contacts", "Notes", "Reminders", "Music", "Settings", "Trash",
  "TextEdit", "Terminal", "About", "Projects", "Articles", "Experience", "Resume",
  "Chess", "Skills", "ZaidGPT", "Contact",
];

export const SUDOERS_JOKE =
  "zaid is not in the sudoers file. This incident will be reported. (to the chess board)";

export const SUDO_RM_JOKE =
  "nice try. this isn't real, and neither is your productivity.";

export function formatHelpGrid(entries) {
  const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
  const width = Math.max(...sorted.map((e) => e.name.length), 1);
  return sorted.map((e) => `${e.name.padEnd(width + 2)}— ${e.help}`);
}

export function sudoHandler(args) {
  const joined = args.join(" ");
  if (joined === "hire zaid") {
    return [
      "Password: ********",
      "",
      "Access granted. Initiating hiring protocol…",
      "",
      "Candidate: Muhammad Zaid",
      "Status: Available for full-time, contract, and “we should’ve hired you sooner” roles.",
      "Next step: run `contact` or open the Contact app.",
    ];
  }
  if (joined === "rm -rf /" || joined === "rm -rf / ") {
    return [SUDO_RM_JOKE];
  }
  return [SUDOERS_JOKE];
}

let contentRegistered = false;

export function registerContentCommands() {
  if (contentRegistered) return;
  contentRegistered = true;

  register({
    name: "fortune",
    help: "print a witty line",
    handler: () => [randomFortune()],
  });

  register({
    name: "cowsay",
    help: "ASCII cow says a fortune line",
    handler: (args) => cowsay(args.length > 0 ? args.join(" ") : undefined),
  });

  register({
    name: "nano",
    aliases: ["vim", "edit"],
    help: "open TextEdit (optional path)",
    handler: (args, ctx) => {
      ctx.openEditor?.(args[0]);
      return args[0] ? [`Editing ${args[0]}…`] : ["Opened TextEdit."];
    },
  });

  register({
    name: "browse",
    aliases: ["browser"],
    help: "open Safari (optional URL)",
    handler: (args, ctx) => {
      ctx.browse?.(args[0]);
      return args[0] ? [`Opening ${args[0]} in Safari…`] : ["Opening Safari…"];
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
    help: "list projects from the data layer",
    handler: (_args, ctx) => ctx.data.projects.map((p) => `${p.id}  [${p.status}]  ${p.title}`),
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
    help: "print experience timeline",
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
    handler: (_args, ctx) => ctx.data.socials.map((s) => `${s.label}: ${s.url}`),
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
    help: "close the terminal",
    handler: (_args, ctx) => {
      ctx.close?.();
      return [];
    },
  });

  register({
    name: "open",
    help: "open an app by name",
    handler: (args, ctx) => {
      const appId = args[0];
      if (appId === undefined) return ["open: missing app name"];
      const normalized =
        appId === "Browser" ? "Safari"
        : appId === "Spotify" || appId === "Gallery" || appId === "Gallary" ? "Photos"
        : appId;
      if (!APP_IDS.includes(normalized)) {
        return [`open: unknown app '${appId}'`, "Type 'help' for available apps."];
      }
      ctx.openApp(normalized);
      return [`Opened ${normalized}.`];
    },
    complete: (args) => {
      const prefix = args[0] ?? "";
      return APP_IDS.filter((id) => id.toLowerCase().startsWith(prefix.toLowerCase()));
    },
  });
}
