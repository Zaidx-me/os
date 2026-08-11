"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { skillGroups } from "@/content";

/**
 * Skills (skills) — grouped skill chips + "the stack I actually use".
 *
 * The 6 groups (Mobile, Frontend, Backend, AI & DevTools, Design, Systems)
 * come from content/skills.ts. Each chip = lucide icon + name + one-line note.
 * A separate section highlights the README stack (React Native, TypeScript,
 * Node.js, Python, C++, FastAPI, Docker, Arch, Hyprland) with animated level
 * bars that are explicitly labeled "vibes, not metrics" — never real
 * percentages, so no fake metrics are implied.
 */

/** Per-skill icon pick; unknown skills fall back to a generic code glyph. */
const SKILL_ICONS: Record<string, IconName> = {
  "React Native": "atom",
  Expo: "rocket",
  Kotlin: "code",
  Android: "smartphone",
  TypeScript: "code-2",
  React: "atom",
  "Next.js": "command",
  Vue: "globe",
  "Tailwind CSS": "wand-2",
  "HTML/CSS": "file-text",
  "Node.js": "server",
  NestJS: "layers",
  Python: "code",
  FastAPI: "zap",
  "REST APIs": "link",
  "NVIDIA API": "cpu",
  MCP: "puzzle",
  Docker: "container",
  n8n: "workflow",
  "Git & GitHub": "folder-git",
  Figma: "palette",
  "UI/UX Design": "layout-dashboard",
  "Graphic Design": "paintbrush",
  "Motion Design": "sparkles",
  "C++": "code",
  SFML: "gamepad-2",
  CMake: "package",
  Arch: "command",
  "Arch Linux": "command",
  CachyOS: "grid-3x3",
  Hyprland: "layout-dashboard",
};

/** The README stack list, verbatim (plan line 243). */
const CORE_STACK = [
  "React Native",
  "TypeScript",
  "Node.js",
  "Python",
  "C++",
  "FastAPI",
  "Docker",
  "Arch",
  "Hyprland",
] as const;

/** Decorative bar widths — "vibes, not metrics", never real data. */
const CORE_STACK_VIBES: Record<string, number> = {
  "React Native": 88,
  TypeScript: 84,
  "Node.js": 80,
  Python: 72,
  "C++": 76,
  FastAPI: 68,
  Docker: 70,
  Arch: 82,
  Hyprland: 90,
};

function slugify(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

export function SkillsApp() {
  return (
    <div
      data-testid="app-content-skills"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex flex-col gap-6 p-6">
        {skillGroups.map((group) => (
          <section
            key={group.id}
            data-testid={`skills-group-${group.id}`}
            className="flex flex-col gap-2"
          >
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
              {group.label}
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <span
                  key={skill.name}
                  data-testid={`skills-chip-${slugify(skill.name)}`}
                  className="hairline flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                >
                  <Icon
                    name={SKILL_ICONS[skill.name] ?? "code"}
                    size={14}
                    className="shrink-0 text-zaid-accent"
                  />
                  <span className="font-mono text-xs text-zaid-text">
                    {skill.name}
                  </span>
                  <span className="font-mono text-[10px] text-zaid-muted">
                    — {skill.note}
                  </span>
                </span>
              ))}
            </div>
          </section>
        ))}

        <section
          data-testid="skills-stack"
          className="flex flex-col gap-3"
        >
          <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
            The stack I actually use
            <span className="ml-2 normal-case text-zaid-muted/70">
              (not the LinkedIn cosplay version)
            </span>
          </h2>
          <p
            data-testid="skills-disclaimer"
            className="font-mono text-[10px] text-zaid-muted"
          >
            Level bars are vibes, not metrics — nobody measures these in
            percentages.
          </p>
          <div className="flex flex-col gap-2">
            {CORE_STACK.map((name) => (
              <div
                key={name}
                data-testid={`skills-stack-bar-${slugify(name)}`}
                className="flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    name={SKILL_ICONS[name] ?? "code"}
                    size={13}
                    className="shrink-0 text-zaid-accent"
                  />
                  <span className="font-mono text-xs text-zaid-text">
                    {name}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zaid-surface2">
                  <div
                    className="h-full rounded-full bg-zaid-accent/70 motion-safe:animate-pulse"
                    style={{ width: `${CORE_STACK_VIBES[name] ?? 50}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default SkillsApp;
