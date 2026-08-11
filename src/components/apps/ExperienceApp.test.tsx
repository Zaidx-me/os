import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExperienceApp from "@/components/apps/ExperienceApp";
import { experience } from "@/content";

/**
 * Experience (experience) content tests (todo 20 acceptance): timeline shows
 * >=3 entries incl. BSIT + the freelance graphic-design and C++ roles;
 * education labeled; QA happy: entries render factual org names; failure:
 * unknown period renders as "—", never "undefined".
 */
describe("ExperienceApp", () => {
  it("renders at least 3 entries including BSIT and both freelance roles", () => {
    render(<ExperienceApp />);
    expect(
      screen.getByTestId("experience-entry-bsit-punjab"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("experience-entry-freelance-graphic-design"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("experience-entry-project-on-demand"),
    ).toBeInTheDocument();
    expect(experience.length).toBeGreaterThanOrEqual(3);
  });

  it("labels the education group and shows its org", () => {
    render(<ExperienceApp />);
    const group = screen.getByTestId("experience-group-education");
    expect(group).toHaveTextContent("Education");
    expect(
      screen.getByTestId("experience-org-bsit-punjab"),
    ).toHaveTextContent("University of the Punjab");
  });

  it("QA happy: renders factual org names and no invented employers", () => {
    render(<ExperienceApp />);
    expect(
      screen.getByTestId("experience-org-freelance-graphic-design"),
    ).toHaveTextContent("Self Employed");
    // freelance C++ entry has no org field — must render no org line at all
    expect(
      screen.queryByTestId("experience-org-project-on-demand"),
    ).not.toBeInTheDocument();
  });

  it("QA failure: unknown period renders as '—', never 'undefined'", () => {
    render(<ExperienceApp />);
    const body = screen.getByTestId("app-content-experience");
    expect(body.textContent).not.toContain("undefined");
    // graphic-design intern is not current and has no published period
    expect(
      screen.getByTestId("experience-period-freelance-graphic-design"),
    ).toHaveTextContent("—");
    expect(
      screen.queryByTestId("experience-current-freelance-graphic-design"),
    ).not.toBeInTheDocument();
    // project-on-demand IS current → badge shown, period reads Current
    expect(
      screen.getByTestId("experience-current-project-on-demand"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("experience-period-project-on-demand"),
    ).toHaveTextContent("Current");
  });
});
