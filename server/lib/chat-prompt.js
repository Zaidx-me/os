import { site, projects, skillGroups, socials, experience } from "./content.js";

export function buildChatSystemPrompt() {
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

export function truncateUserMessage(text, max = 500) {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max);
}

export function truncateHistory(messages, max = 10) {
  return messages.slice(-max);
}

export function parseMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const parsed = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const role = item.role;
    const content = item.content;
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.trim().length > 0
    ) {
      parsed.push({
        role,
        content: role === "user" ? truncateUserMessage(content) : content.trim(),
      });
    }
  }
  return parsed.length > 0 ? parsed : null;
}
