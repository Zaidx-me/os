import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ResumeApp from "@/components/apps/ResumeApp";
import { experience, projects, site, skillGroups } from "@/content";

/**
 * Resume (resume) content tests (todo 21 acceptance): header + sections render
 * from data; QA happy: resumePdfUrl is null in shipped content, so Download
 * PDF is a button that calls window.print; QA failure: when a real PDF path
 * ships in content/site.ts, Download PDF becomes a link to it — never a fake
 * blob. PDF presence is data-layer truth, never a runtime probe.
 */
describe("ResumeApp", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the header, contact row, and all resume sections", () => {
    render(<ResumeApp />);
    expect(screen.getByTestId("resume-name")).toHaveTextContent(site.owner);
    expect(screen.getByTestId("resume-role")).toHaveTextContent(site.roleLine);
    expect(screen.getByTestId("resume-contact")).toHaveTextContent(
      site.contactEmail,
    );
    expect(screen.getByTestId("resume-summary")).toHaveTextContent(
      site.bio[0].slice(0, 24),
    );
    for (const group of skillGroups) {
      expect(
        screen.getByTestId(`resume-skill-group-${group.id}`),
      ).toHaveTextContent(group.label);
    }
    expect(screen.getByTestId("resume-experience")).toBeInTheDocument();
    expect(screen.getByTestId("resume-education")).toBeInTheDocument();
    expect(screen.getByTestId("resume-projects")).toBeInTheDocument();
  });

  it("renders experience, education, and featured projects from data", () => {
    render(<ResumeApp />);
    const workEntries = experience.filter((e) => e.type !== "education");
    const eduEntries = experience.filter((e) => e.type === "education");
    for (const entry of workEntries) {
      expect(screen.getByTestId(`resume-exp-${entry.id}`)).toBeInTheDocument();
    }
    for (const entry of eduEntries) {
      expect(screen.getByTestId(`resume-edu-${entry.id}`)).toBeInTheDocument();
    }
    for (const project of projects.filter((p) => p.featured)) {
      expect(
        screen.getByTestId(`resume-project-${project.id}`),
      ).toHaveTextContent(project.title);
    }
  });

  it("QA happy: Download PDF calls window.print while no PDF asset ships", () => {
    const printSpy = vi
      .spyOn(window, "print")
      .mockImplementation(() => undefined);
    render(<ResumeApp />);
    fireEvent.click(screen.getByTestId("resume-print"));
    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it("QA failure: links the real PDF when one ships (never a fake blob)", async () => {
    vi.resetModules();
    vi.doMock("@/content", () => ({
      experience: [],
      projects: [],
      skillGroups: [],
      socials: [],
      resumePdfUrl: "/resume/zaid-resume.pdf",
      site: {
        owner: "Zaid",
        roleLine: "role",
        contactEmail: "a@b.c",
        siteUrl: "https://zaidx.me",
        bio: ["mock bio"],
      },
    }));
    const { default: MockedResumeApp } = await import(
      "@/components/apps/ResumeApp"
    );
    const printSpy = vi
      .spyOn(window, "print")
      .mockImplementation(() => undefined);
    render(<MockedResumeApp />);
    const link = screen.getByTestId("resume-print");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/resume/zaid-resume.pdf");
    expect(link).toHaveAttribute("download", "zaid-resume.pdf");
    expect(printSpy).not.toHaveBeenCalled();
  });
});
