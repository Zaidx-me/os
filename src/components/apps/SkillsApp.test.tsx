import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import SkillsApp from "@/components/apps/SkillsApp";
import { skillGroups } from "@/content";

/**
 * Skills (skills) content tests (todo 19 acceptance): all 6 groups render,
 * each group has >=1 chip, the disclaimer is present because bars are used,
 * and QA happy: React Native + Hyprland are present; failure: no empty groups.
 */
describe("SkillsApp", () => {
  it("renders all 6 groups, each with at least one chip (no empty groups)", () => {
    render(<SkillsApp />);
    expect(skillGroups.length).toBe(6);
    for (const group of skillGroups) {
      const groupEl = screen.getByTestId(`skills-group-${group.id}`);
      expect(groupEl).toBeInTheDocument();
      for (const skill of group.skills) {
        expect(
          screen.getByTestId(`skills-chip-${slugify(skill.name)}`),
        ).toBeInTheDocument();
      }
      expect(group.skills.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("QA happy: React Native and Hyprland are present", () => {
    render(<SkillsApp />);
    expect(screen.getByTestId("skills-chip-react-native")).toBeInTheDocument();
    expect(screen.getByTestId("skills-chip-hyprland")).toBeInTheDocument();
  });

  it("shows the disclaimer because level bars are used", () => {
    render(<SkillsApp />);
    const disclaimer = screen.getByTestId("skills-disclaimer");
    expect(disclaimer).toHaveTextContent("vibes, not metrics");
  });

  it("renders the full README stack section with bar widths", () => {
    render(<SkillsApp />);
    const stack = screen.getByTestId("skills-stack");
    expect(stack).toBeInTheDocument();
    for (const name of [
      "React Native",
      "TypeScript",
      "Node.js",
      "Python",
      "C++",
      "FastAPI",
      "Docker",
      "Arch",
      "Hyprland",
    ]) {
      expect(
        screen.getByTestId(`skills-stack-bar-${slugify(name)}`),
      ).toBeInTheDocument();
    }
  });
});

function slugify(name: string): string {
  return name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}
