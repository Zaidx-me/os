import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProjectsApp from "@/components/apps/ProjectsApp";
import { projects } from "@/content";

/**
 * Projects (projects) content tests (todo 18 acceptance): >=12 cards, featured
 * first, filter tabs (Archived -> zenith-build visible, Live -> archived card
 * absent), and the detail pane with stack + real link hrefs (QA happy path:
 * repo links match https://github.com/Zaidx-me/<repo>).
 */
describe("ProjectsApp", () => {
  it("renders every project card, featured first", () => {
    render(<ProjectsApp />);
    const cards = screen
      .getAllByTestId(/^projects-card-[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .filter((el) => !(el.getAttribute("data-testid") ?? "").endsWith("-status"));
    expect(cards.length).toBe(projects.length);
    expect(cards.length).toBeGreaterThanOrEqual(12);

    const featured = projects.filter((p) => p.featured).map((p) => p.id);
    const nonFeatured = projects.filter((p) => !p.featured).map((p) => p.id);
    const cardIds = cards.map(
      (el) => (el.getAttribute("data-testid") ?? "").replace("projects-card-", ""),
    );
    expect(cardIds.slice(0, featured.length)).toEqual(featured);
    for (const id of nonFeatured) {
      expect(cardIds.indexOf(id)).toBeGreaterThan(cardIds.indexOf(featured[featured.length - 1]));
    }
  });

  it("filters to archived and shows zenith-build", () => {
    render(<ProjectsApp />);
    fireEvent.click(screen.getByTestId("projects-filter-archived"));
    expect(screen.getByTestId("projects-card-zenith-build")).toBeInTheDocument();
    expect(screen.queryByTestId("projects-card-applicator")).not.toBeInTheDocument();
  });

  it("QA failure: filtering Live hides the archived card", () => {
    render(<ProjectsApp />);
    fireEvent.click(screen.getByTestId("projects-filter-live"));
    expect(screen.queryByTestId("projects-card-zenith-build")).not.toBeInTheDocument();
    expect(screen.getByTestId("projects-card-applicator")).toBeInTheDocument();
  });

  it("opens the detail pane with stack and real repo hrefs", () => {
    render(<ProjectsApp />);
    fireEvent.click(screen.getByTestId("projects-card-whatbot"));

    const detail = screen.getByTestId("projects-detail");
    expect(detail).toBeInTheDocument();
    const whatbot = projects.find((p) => p.id === "whatbot");
    expect(whatbot).toBeDefined();
    for (const tech of whatbot!.stack) {
      expect(detail.textContent).toContain(tech);
    }

    const repo = screen.getByTestId("projects-link-repo");
    expect(repo).toHaveAttribute("href", `https://github.com/Zaidx-me/${whatbot!.links.repo!.split("/").pop()}`);
    expect(repo).toHaveAttribute("target", "_blank");
    expect(repo).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows the archived note for zenith-build and no dead live link", () => {
    render(<ProjectsApp />);
    fireEvent.click(screen.getByTestId("projects-card-zenith-build"));
    expect(screen.getByTestId("projects-detail-archived-note")).toHaveTextContent(
      "Deployed site is archived (404).",
    );
    expect(screen.queryByTestId("projects-link-live")).not.toBeInTheDocument();
  });

  it("renders the footer More-on-GitHub link", () => {
    render(<ProjectsApp />);
    expect(screen.getByTestId("projects-more-github")).toHaveAttribute(
      "href",
      "https://github.com/Zaidx-me?tab=repositories",
    );
  });
});
