import { site, projects, skillGroups, experience, socials } from "../content/index.ts";

const ctx = { site, projects, skillGroups, experience, socials };

const INTENTS = [
  { patterns: ["hi", "hello", "hey"], respond: () => "Hey — welcome to ZaidOS. Ask about projects, skills, or contact." },
  { patterns: ["who are you", "about you"], respond: () => `I'm ${site.owner} — ${site.roleLine}. ${site.bio[0]}` },
  {
    patterns: ["projects", "portfolio", "your work"],
    respond: () =>
      projects.map((p) => `• ${p.title} — ${p.tagline}`).join("\n"),
  },
  {
    patterns: ["skills", "tech stack", "stack"],
    respond: () =>
      skillGroups.map((g) => `${g.label}: ${g.skills.map((s) => s.name).join(", ")}`).join("\n"),
  },
  {
    patterns: ["experience", "education", "university"],
    respond: () =>
      experience.map((e) => `• ${e.role} @ ${e.org}`).join("\n"),
  },
  {
    patterns: ["contact", "email", "hire"],
    respond: () =>
      `Open the Contact app or email ${site.contactEmail}. Socials: ${socials.map((s) => s.label).join(", ")}.`,
  },
  { patterns: ["help"], respond: () => "Try: who are you, projects, skills, experience, contact, chess, applicator, whatbot." },
];

const FALLBACK = [
  "Not sure — try 'projects', 'skills', or 'contact'.",
  "ZaidGPT offline edition. Ask about Applicator, Whatbot, or chess.",
];

function normalize(input) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

function scorePhrase(pattern, normalized) {
  const p = pattern.toLowerCase();
  if (normalized === p) return 1;
  if (normalized.includes(p)) return 0.9;
  return 0;
}

export function matchChat(input) {
  const n = normalize(input);
  if (!n) return { response: "Say something — I'm listening." };

  let best = { score: 0, response: "" };
  for (const intent of INTENTS) {
    for (const pattern of intent.patterns) {
      const score = scorePhrase(pattern, n);
      if (score > best.score) {
        best = { score, response: intent.respond(ctx) };
      }
    }
  }

  if (best.score >= 0.55) return { response: best.response, source: "kb" };
  return { response: FALLBACK[Math.floor(Math.random() * FALLBACK.length)], source: "kb" };
}

export function chatReply(input) {
  return matchChat(input).response;
}
