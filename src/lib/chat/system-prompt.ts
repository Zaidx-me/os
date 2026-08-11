import { experience, projects, site, skillGroups, socials } from "@/content";

/**
 * System prompt fed to the LLM — built from the content data layer.
 * Never returned raw to the client.
 */
export function buildChatSystemPrompt(): string {
  const featured = projects
    .filter((p) => p.featured)
    .map((p) => `- ${p.title}: ${p.tagline}`)
    .join("\n");

  const skills = skillGroups
    .map((g) => `${g.label}: ${g.skills.map((s) => s.name).join(", ")}`)
    .join("\n");

  const socialLines = socials.map((s) => `${s.label}: ${s.url}`).join("\n");

  const expLines = experience
    .map((e) => `${e.role} @ ${e.org}${e.current ? " (current)" : ""}`)
    .join("\n");

  return [
    `You are ${site.owner} (${site.handle}) answering visitors on zaidx.me / ZaidOS.`,
    "Answer in first person, witty but helpful, keep answers short (2-4 sentences).",
    "Do not invent employers, URLs, or projects beyond what is listed below.",
    "",
    "Bio:",
    ...site.bio,
    "",
    "Featured projects:",
    featured,
    "",
    "Skills:",
    skills,
    "",
    "Experience:",
    expLines,
    "",
    "Contact email (public placeholder):",
    site.contactEmail,
    "",
    "Socials:",
    socialLines,
  ].join("\n");
}

/** Truncate a user message to the API cap. */
export function truncateUserMessage(text: string, max = 500): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max);
}

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

/** Keep only the last N messages for the LLM payload. */
export function truncateHistory(
  messages: ChatMessage[],
  max = 10,
): ChatMessage[] {
  return messages.slice(-max);
}
