import { describe, expect, it } from "vitest";

import {
  FALLBACK_LINES,
  INTENTS,
  chatReply,
  matchChat,
  normalizeInput,
  pickFallback,
} from "./kb";

describe("chat KB engine (todo 30)", () => {
  it("defines at least 18 intents", () => {
    expect(INTENTS.length).toBeGreaterThanOrEqual(18);
  });

  it("normalizes case and whitespace", () => {
    expect(normalizeInput("  Hello   WORLD  ")).toBe("hello world");
  });

  it("returns help prompt on empty input", () => {
    const result = matchChat("   ");
    expect(result.kind).toBe("empty");
    expect(result.response).toMatch(/say something/i);
  });

  it("falls back on gibberish", () => {
    const result = matchChat("asdfgh");
    expect(result.kind).toBe("fallback");
    expect(FALLBACK_LINES).toContain(result.response);
  });

  it("pickFallback returns a known line", () => {
    expect(FALLBACK_LINES).toContain(pickFallback(() => 0));
  });

  const intentCases: { id: string; input: string }[] = [
    { id: "greeting", input: "hello" },
    { id: "who_are_you", input: "who are you" },
    { id: "what_do_you_do", input: "what do you do" },
    { id: "projects", input: "show me projects" },
    { id: "project_applicator", input: "tell me about applicator" },
    { id: "project_whatbot", input: "what is whatbot" },
    { id: "project_maktaba", input: "maktaba" },
    { id: "project_media_cleaner", input: "media cleaner" },
    { id: "project_pu_stacks", input: "pu stacks" },
    { id: "project_zesho", input: "zesho" },
    { id: "project_tower_defense", input: "tower defense" },
    { id: "project_tank_arena", input: "tank arena" },
    { id: "skills", input: "skills" },
    { id: "stack", input: "what stack do you use" },
    { id: "experience", input: "experience" },
    { id: "education", input: "education" },
    { id: "availability", input: "are you available for hire" },
    { id: "contact", input: "how do I contact you" },
    { id: "socials", input: "socials" },
    { id: "chess", input: "chess" },
    { id: "arch_ricing", input: "hyprland ricing" },
    { id: "fun", input: "tell me a joke" },
    { id: "thanks", input: "thank you" },
    { id: "bye", input: "bye" },
    { id: "help_chat", input: "help" },
  ];

  for (const { id, input } of intentCases) {
    it(`matches intent ${id} for "${input}"`, () => {
      const result = matchChat(input);
      expect(result.kind).toBe("intent");
      if (result.kind === "intent") {
        expect(result.intentId).toBe(id);
        expect(result.response.length).toBeGreaterThan(0);
      }
    });
  }

  it("injects whatbot project data", () => {
    const reply = chatReply("what is whatbot");
    expect(reply).toMatch(/Whatbot/i);
    expect(reply).toMatch(/WhatsApp/i);
    expect(reply).toMatch(/whatbot\.zaidx\.me/);
  });

  it("is case insensitive", () => {
    const lower = matchChat("WHO ARE YOU");
    const upper = matchChat("who are you");
    expect(lower.kind).toBe("intent");
    expect(upper.kind).toBe("intent");
    if (lower.kind === "intent" && upper.kind === "intent") {
      expect(lower.intentId).toBe(upper.intentId);
    }
  });

  it("every intent has at least one pattern", () => {
    for (const intent of INTENTS) {
      expect(intent.patterns.length).toBeGreaterThan(0);
    }
  });
});
