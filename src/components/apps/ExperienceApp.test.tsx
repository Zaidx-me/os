import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExperienceApp from "@/components/apps/ExperienceApp";
import { experience } from "@/content";

/**
 * Experience (experience) content tests (todo 20 acceptance): timeline shows
 * >=3 entries incl. BSIT + Tech Bridge; education labeled; QA happy: all
 * entries render factual org names; failure: unknown date renders as "—",
 * never "undefined".
 */
describe("ExperienceApp", () => {
  it("renders at least 3 entries including BSIT and Tech Bridge", () => {
    render(<ExperienceApp />);
    expect(screen.getByTestId("experience-entry-bsit-punjab")).toBeInTheDocument();
    expect(
      screen.getByTestId("experience-entry-tech-bridge-intern"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("experience-entry-freelance-mobile-shopify")).toBeInTheDocument();
    expect(experience.length).toBeGreaterThanOrEqual(3);
  });

  it("labels the education group and shows its org", () => {
    render(<ExperienceApp />);
    const group = screen.getByTestId("experience-group-education");
    expect(group).toHaveTextContent("Education");
    expect(
      screen.getByTestId("experience-org-bsit-punjab"),
    ).toHaveTextContent("University of the Punjab, Gujranwala Campus");
  });

  it("QA happy: renders factual org names and no invented employers", () => {
    render(<ExperienceApp />);
    expect(
      screen.getByTestId("experience-org-tech-bridge-intern"),
    ).toHaveTextContent("Tech Bridge Consultancy");
    // freelance entry has no org field — must render no org line at all
    expect(
      screen.queryByTestId("experience-org-freelance-mobile-shopify"),
    ).not.toBeInTheDocument();
  });

  it("QA failure: unknown date renders as '—', never 'undefined'", () => {
    render(<ExperienceApp />);
    const body = screen.getByTestId("app-content-experience");
    expect(body.textContent).not.toContain("undefined");
    // tech-bridge is not current and has no published period
    expect(
      screen.getByTestId("experience-period-tech-bridge-intern"),
    ).toHaveTextContent("—");
  });
});
