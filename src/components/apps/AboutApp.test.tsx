import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AboutApp from "@/components/apps/AboutApp";
import { articles, projects, site } from "@/content";

/**
 * About (about) content tests (todo 17 acceptance): name, role line, >=3
 * chips, profile photo src, and quick stats derived from the data layer. The
 * QA failure scenario — no old-template meta-description text in the DOM — is
 * asserted here and in e2e/about.spec.ts.
 */
describe("AboutApp", () => {
  it("renders the name and role line", () => {
    render(<AboutApp />);
    expect(screen.getByTestId("about-name")).toHaveTextContent(site.owner);
    expect(screen.getByTestId("about-role")).toHaveTextContent(site.roleLine);
  });

  it("renders the profile photo with the canonical src", () => {
    render(<AboutApp />);
    expect(screen.getByTestId("about-photo")).toHaveAttribute(
      "src",
      "/images/profile.jpg",
    );
  });

  it("renders at least 3 personality chips and no template copy", () => {
    render(<AboutApp />);
    const chips = screen
      .getAllByTestId(/^about-chip-/)
      .map((el) => el.textContent);
    expect(chips.length).toBeGreaterThanOrEqual(3);
    expect(chips).toEqual(site.personalityChips);

    const body = screen.getByTestId("app-content-about");
    expect(body.textContent).not.toContain(
      "product designer working on web & mobile apps",
    );
    expect(body.textContent?.toLowerCase()).not.toContain("uses");
  });

  it("renders quick stats from the data layer", () => {
    render(<AboutApp />);
    expect(screen.getByTestId("about-stat-projects")).toHaveTextContent(
      String(projects.length),
    );
    expect(screen.getByTestId("about-stat-articles")).toHaveTextContent(
      String(articles.length),
    );
    expect(screen.getByTestId("about-stat-repos")).toHaveTextContent("29");
  });
});
