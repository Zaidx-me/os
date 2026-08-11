import {
  experience,
  projects,
  site,
  skillGroups,
  socials,
} from "@/content";

/** Content injected into intent responders. */
export interface ChatContext {
  projects: typeof projects;
  skillGroups: typeof skillGroups;
  socials: typeof socials;
  site: typeof site;
  experience: typeof experience;
}

export const defaultChatContext: ChatContext = {
  projects,
  skillGroups,
  socials,
  site,
  experience,
};

export interface Intent {
  id: string;
  patterns: (string | RegExp)[];
  respond: string | ((ctx: ChatContext) => string);
}

/** Witty fallback lines in Zaid's voice when nothing matches. */
export const FALLBACK_LINES: readonly string[] = [
  "Not sure I caught that — try asking about my projects, skills, or how to hire me.",
  "My KB is offline but my vibes are online. Ask me about Applicator, Whatbot, or chess.",
  "That one flew over my Hyprland config. Type 'help' or tap a quick reply below.",
  "I rice desktops for fun and build apps for work — ask me something in that ballpark.",
  "ZaidGPT (offline edition) did not recognize that. London System energy only goes so far.",
  "If this were a real shell I'd say 'command not found'. Try 'who are you' or 'projects'.",
];

export type MatchResult =
  | { kind: "intent"; intentId: string; response: string; score: number }
  | { kind: "fallback"; response: string }
  | { kind: "empty"; response: string };

/** Normalize user input for matching. */
export function normalizeInput(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Tokenize into words for overlap scoring. */
function tokenize(text: string): string[] {
  return text.split(/[^a-z0-9]+/).filter(Boolean);
}

/** Escape special regex characters in a literal. */
function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Score a literal/phrase pattern against normalized input. */
function scorePhrase(pattern: string, normalized: string): number {
  const p = pattern.toLowerCase().trim();
  if (!p) return 0;
  if (normalized === p) return 1;

  const patternWords = tokenize(p);
  const inputWords = new Set(tokenize(normalized));

  // Multi-word phrases: substring match when the phrase appears intact.
  if (patternWords.length > 1) {
    if (normalized.includes(p)) return 0.9;
    const overlap = patternWords.filter((w) => inputWords.has(w)).length;
    return overlap / patternWords.length;
  }

  // Single-word patterns: whole-word match only (avoids "yo" in "you", "hi" in "hire").
  const wordRe = new RegExp(`\\b${escapeRegex(p)}\\b`);
  if (wordRe.test(normalized)) return 0.85;

  if (p.length >= 4 && normalized.includes(p)) return 0.75;

  if (patternWords.length === 0) return 0;
  const overlap = patternWords.filter((w) => inputWords.has(w)).length;
  return overlap / patternWords.length;
}

/** Score one pattern (regex or phrase). */
function scorePattern(
  pattern: string | RegExp,
  normalized: string,
): number {
  if (pattern instanceof RegExp) {
    return pattern.test(normalized) ? 0.95 : 0;
  }
  return scorePhrase(pattern, normalized);
}

const MATCH_THRESHOLD = 0.55;

function resolveResponse(
  respond: Intent["respond"],
  ctx: ChatContext,
): string {
  return typeof respond === "function" ? respond(ctx) : respond;
}

function projectById(id: string) {
  return projects.find((p) => p.id === id);
}

/** All scripted intents — pure function, no network. */
export const INTENTS: Intent[] = [
  {
    id: "greeting",
    patterns: ["hi", "hello", "hey", "yo", "salam", "assalam", /^h+i+!*$/],
    respond: () =>
      "Hey — welcome to ZaidOS. I'm ZaidGPT (offline KB edition unless you flip AI mode in Settings). Ask about my projects, stack, or whether I'm available for work.",
  },
  {
    id: "who_are_you",
    patterns: [
      "who are you",
      "who is zaid",
      "tell me about yourself",
      "about you",
      "introduce yourself",
    ],
    respond: (ctx) =>
      `I'm ${ctx.site.owner} — ${ctx.site.roleLine}. ${ctx.site.bio[0]}`,
  },
  {
    id: "what_do_you_do",
    patterns: [
      "what do you do",
      "what do you build",
      "what kind of developer",
      "what are you working on",
    ],
    respond: (ctx) =>
      `Mobile + full-stack dev: React Native apps, NestJS backends, AI tooling, and the occasional C++ SFML game nobody ordered. Featured work includes ${ctx.projects.filter((p) => p.featured).map((p) => p.title).join(", ")}.`,
  },
  {
    id: "projects",
    patterns: ["projects", "portfolio", "show me projects", "what have you built", "your work"],
    respond: (ctx) => {
      const lines = ctx.projects.map(
        (p) => `• ${p.title} (${p.status}) — ${p.tagline}`,
      );
      return `I've shipped ${ctx.projects.length} projects in the data layer:\n${lines.join("\n")}\nOpen the Projects app for demos and repos.`;
    },
  },
  {
    id: "project_applicator",
    patterns: ["applicator", "job application assistant", "what is applicator"],
    respond: (ctx) => {
      const p = projectById("applicator")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.${p.links.live ? ` Live: ${p.links.live}` : ""}`;
    },
  },
  {
    id: "project_whatbot",
    patterns: ["whatbot", "whatsapp gateway", "whatsapp api", "what is whatbot"],
    respond: (ctx) => {
      const p = projectById("whatbot")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}. Live at ${p.links.live ?? "whatbot.zaidx.me"}.`;
    },
  },
  {
    id: "project_maktaba",
    patterns: ["maktaba", "urdu reader", "offline books"],
    respond: (ctx) => {
      const p = projectById("maktaba")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.`;
    },
  },
  {
    id: "project_media_cleaner",
    patterns: ["media cleaner", "whatsapp cleaner", "media-cleaner"],
    respond: (ctx) => {
      const p = projectById("media-cleaner")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.`;
    },
  },
  {
    id: "project_pu_stacks",
    patterns: ["pu stacks", "pustacks", "courseware", "pu-stacks"],
    respond: (ctx) => {
      const p = projectById("pu-stacks")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.${p.links.live ? ` Live: ${p.links.live}` : ""}`;
    },
  },
  {
    id: "project_zesho",
    patterns: ["zesho", "resource sharing"],
    respond: (ctx) => {
      const p = projectById("zesho")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.`;
    },
  },
  {
    id: "project_tower_defense",
    patterns: ["tower defense", "tower-defense", "sfml tower"],
    respond: (ctx) => {
      const p = projectById("tower-defense")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.`;
    },
  },
  {
    id: "project_tank_arena",
    patterns: ["tank arena", "tank-arena", "battle city"],
    respond: (ctx) => {
      const p = projectById("tank-arena")!;
      return `${p.title}: ${p.description} Stack: ${p.stack.join(", ")}.`;
    },
  },
  {
    id: "skills",
    patterns: ["skills", "what can you do", "technologies", "tech stack skills"],
    respond: (ctx) => {
      const groups = ctx.skillGroups.map(
        (g) => `${g.label}: ${g.skills.map((s) => s.name).join(", ")}`,
      );
      return `Skills by domain:\n${groups.join("\n")}`;
    },
  },
  {
    id: "stack",
    patterns: [
      "stack",
      "what stack",
      "what stack do you use",
      "tools you use",
      "daily driver",
      "linkedin cosplay",
    ],
    respond: () =>
      "The stack I actually use (not the LinkedIn cosplay version): React Native, TypeScript, Node.js, Python, C++, FastAPI, Docker, Arch, Hyprland. Open the Skills app for the full grouped list.",
  },
  {
    id: "experience",
    patterns: ["experience", "work history", "jobs", "internship", "freelance"],
    respond: (ctx) => {
      const lines = ctx.experience.map(
        (e) => `• ${e.role} @ ${e.org}${e.current ? " (current)" : ""}`,
      );
      return `Experience timeline:\n${lines.join("\n")}`;
    },
  },
  {
    id: "education",
    patterns: ["education", "university", "degree", "bsit", "punjab", "student"],
    respond: (ctx) => {
      const edu = ctx.experience.filter((e) => e.type === "education");
      if (edu.length === 0) return "BSIT at University of the Punjab — Gujranwala campus, currently enrolled.";
      return edu
        .map((e) => `${e.role} at ${e.org}. ${e.bullets[0] ?? ""}`)
        .join(" ");
    },
  },
  {
    id: "availability",
    patterns: [
      "available for hire",
      "available",
      "hire me",
      "hire",
      "freelance",
      "open to work",
      "collaborate",
      "work together",
    ],
    respond: (ctx) =>
      `Yes — I'm open to mobile, full-stack, and AI-adjacent projects. Drop a line via Contact (${ctx.site.contactEmail}) or the form in the Contact app. I reply faster than my chess engine at depth 2.`,
  },
  {
    id: "contact",
    patterns: ["contact", "contact you", "email", "reach you", "get in touch", "message you"],
    respond: (ctx) =>
      `Email: ${ctx.site.contactEmail}. Or open the Contact app — form with mailto fallback if the server relay isn't configured. Socials are one ask away too.`,
  },
  {
    id: "socials",
    patterns: ["social", "socials", "github", "linkedin", "instagram", "linktree"],
    respond: (ctx) => {
      const lines = ctx.socials.map((s) => `• ${s.label}: ${s.url}`);
      return `Find me online:\n${lines.join("\n")}`;
    },
  },
  {
    id: "chess",
    patterns: ["chess", "london system", "play chess", "chess app"],
    respond: () =>
      "I open every game with the London System — controversial, efficient, very on-brand. Open the Chess app from the launcher (⌘Space → chess) for hot-seat or vs Rookie CPU.",
  },
  {
    id: "arch_ricing",
    patterns: [
      "arch",
      "hyprland",
      "ricing",
      "cachyos",
      "linux",
      "dotfiles",
      "niri",
    ],
    respond: () =>
      "Daily driver: CachyOS + Niri/Hyprland ricing as procrastination with extra blur radius. This whole site is ZaidOS — a web desktop because why ship a normal portfolio when you can ship an OS cosplay.",
  },
  {
    id: "fun",
    patterns: ["joke", "fun", "fortune", "matrix", "easter egg", "sudo"],
    respond: () =>
      "Open Terminal and try `fortune`, `matrix`, or `sudo rm -rf /` for curated chaos. The London System is not an opening — it's a lifestyle.",
  },
  {
    id: "thanks",
    patterns: ["thanks", "thank you", "thx", "appreciate"],
    respond: () =>
      "Anytime — if this desktop impressed you, wait until you see my actual Hyprland blur settings.",
  },
  {
    id: "bye",
    patterns: ["bye", "goodbye", "see you", "later", "cya"],
    respond: () =>
      "Later — the matrix rain keeps falling even when you're gone. `exit` if you need to close a window for real.",
  },
  {
    id: "help_chat",
    patterns: ["help", "help chat", "what can i ask", "commands"],
    respond: () =>
      "Try: who are you · projects · what is whatbot · skills · contact · chess · hire me. Or tap a quick-reply chip below.",
  },
];

/** Pick a random fallback line (deterministic seed optional for tests). */
export function pickFallback(rng: () => number = Math.random): string {
  return FALLBACK_LINES[Math.floor(rng() * FALLBACK_LINES.length)]!;
}

/**
 * Match user input to an intent. Returns fallback on gibberish, help prompt
 * on empty/whitespace. Pure function — no network.
 */
export function matchChat(
  input: string,
  ctx: ChatContext = defaultChatContext,
  rng: () => number = Math.random,
): MatchResult {
  const normalized = normalizeInput(input);
  if (normalized.length === 0) {
    return {
      kind: "empty",
      response:
        "Say something — ask about my projects, skills, contact info, or whether I'm available for work.",
    };
  }

  let best: { intent: Intent; score: number; matchLen: number } | null = null;

  for (const intent of INTENTS) {
    let intentScore = 0;
    let matchLen = 0;
    for (const pattern of intent.patterns) {
      const s = scorePattern(pattern, normalized);
      const len = pattern instanceof RegExp ? 0 : pattern.length;
      if (s > intentScore || (s === intentScore && len > matchLen)) {
        intentScore = s;
        matchLen = len;
      }
    }
    if (
      !best ||
      intentScore > best.score ||
      (intentScore === best.score && matchLen > best.matchLen)
    ) {
      best = { intent, score: intentScore, matchLen };
    }
  }

  if (best && best.score >= MATCH_THRESHOLD) {
    return {
      kind: "intent",
      intentId: best.intent.id,
      response: resolveResponse(best.intent.respond, ctx),
      score: best.score,
    };
  }

  return { kind: "fallback", response: pickFallback(rng) };
}

/** Convenience: get only the response string. */
export function chatReply(
  input: string,
  ctx: ChatContext = defaultChatContext,
): string {
  return matchChat(input, ctx).response;
}
