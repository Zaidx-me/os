"use client";

import {
  experience,
  projects,
  resumePdfUrl,
  site,
  skillGroups,
  socials,
} from "@/content";

/**
 * Resume (resume) — one-page resume assembled at runtime from the content
 * data layer (todo 21). Header, contact row, summary, skills, experience,
 * education, and project highlights ALL come from shipped content — nothing
 * is hand-written copy. Facts: site.ts (name/role/bio), socials.ts (contact
 * row), skills.ts (groups), experience.ts (work + education), projects.ts
 * (featured highlights).
 *
 * "Download PDF" prints the window via window.print() with the @media print
 * stylesheet in globals.css (hides waybar/windows/desktop, prints only the
 * resume sheet). When the user later drops a real PDF at public/resume/
 * zaid-resume.pdf and sets the resumePdfUrl export in content/site.ts to it,
 * the button becomes a link to that file instead; until then print stays the
 * delivery — we NEVER ship a fake/hand-written PDF. PDF presence is a
 * data-layer fact, never a runtime probe (a HEAD request to a missing asset
 * would log a 404 console error).
 */

/** Contact-row links: GitHub, LinkedIn, and Linktree (the essential trio). */
const CONTACT_IDS = ["github", "linkedin", "linktree"] as const;

export function ResumeApp() {
  const contact = CONTACT_IDS.map((id) =>
    socials.find((s) => s.id === id),
  ).filter((s) => s !== undefined);
  const workEntries = experience.filter((e) => e.type !== "education");
  const educationEntries = experience.filter((e) => e.type === "education");
  const featured = projects.filter((p) => p.featured);

  return (
    <div
      data-testid="app-content-resume"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-end gap-2 border-b border-zaid-border p-3 print:hidden">
          {resumePdfUrl !== null ? (
            <a
              href={resumePdfUrl}
              download="zaid-resume.pdf"
              data-testid="resume-print"
              className="hairline rounded-lg px-3 py-1.5 font-mono text-xs text-zaid-accent transition-colors hover:bg-zaid-surface2"
            >
              Download PDF
            </a>
          ) : (
            <button
              type="button"
              data-testid="resume-print"
              onClick={() => window.print()}
              className="hairline rounded-lg px-3 py-1.5 font-mono text-xs text-zaid-accent transition-colors hover:bg-zaid-surface2"
            >
              Download PDF
            </button>
          )}
        </div>

        <article
          data-testid="resume-sheet"
          className="flex-1 overflow-y-auto p-4 print:overflow-visible print:p-8 sm:p-6"
        >
          <header className="flex flex-col gap-1 border-b border-zaid-border pb-4 print:border-neutral-300">
            <h1
              data-testid="resume-name"
              className="font-sans text-3xl font-semibold text-zaid-text print:text-black"
            >
              {site.owner}
            </h1>
            <p
              data-testid="resume-role"
              className="font-mono text-sm text-zaid-accent print:text-neutral-800"
            >
              {site.roleLine}
            </p>
            <p
              data-testid="resume-contact"
              className="break-words font-mono text-xs text-zaid-muted print:text-neutral-700"
            >
              {site.contactEmail} · {site.siteUrl.replace("https://", "")} ·{" "}
              {contact.map((s) => s.handle).join(" · ")}
            </p>
          </header>

          <section data-testid="resume-summary" className="mt-4 flex flex-col gap-1">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted print:text-neutral-500">
              Summary
            </h2>
            <p className="text-sm leading-relaxed text-zaid-text print:text-black">
              {site.bio[0]}
            </p>
          </section>

          <section data-testid="resume-skills" className="mt-4 flex flex-col gap-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted print:text-neutral-500">
              Skills
            </h2>
            <ul className="flex list-none flex-col gap-1.5">
              {skillGroups.map((group) => (
                <li
                  key={group.id}
                  data-testid={`resume-skill-group-${group.id}`}
                  className="flex flex-wrap items-baseline gap-x-2 text-xs"
                >
                  <span className="font-mono font-semibold text-zaid-text print:text-black">
                    {group.label}:
                  </span>
                  <span className="text-zaid-muted print:text-neutral-700">
                    {group.skills.map((s) => s.name).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section data-testid="resume-experience" className="mt-4 flex flex-col gap-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted print:text-neutral-500">
              Experience
            </h2>
            <ul className="flex list-none flex-col gap-3">
              {workEntries.map((entry) => (
                <li key={entry.id} data-testid={`resume-exp-${entry.id}`} className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-sans font-semibold text-zaid-text print:text-black">
                      {entry.role}
                    </span>
                    {entry.org !== undefined && (
                      <span className="font-mono text-zaid-muted print:text-neutral-700">
                        — {entry.org}
                      </span>
                    )}
                  </div>
                  <ul className="flex list-disc flex-col gap-0.5 pl-4">
                    {entry.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-xs leading-relaxed text-zaid-muted print:text-neutral-700"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section data-testid="resume-education" className="mt-4 flex flex-col gap-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted print:text-neutral-500">
              Education
            </h2>
            <ul className="flex list-none flex-col gap-3">
              {educationEntries.map((entry) => (
                <li key={entry.id} data-testid={`resume-edu-${entry.id}`} className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                    <span className="font-sans font-semibold text-zaid-text print:text-black">
                      {entry.role}
                    </span>
                    {entry.org !== undefined && (
                      <span className="font-mono text-zaid-muted print:text-neutral-700">
                        — {entry.org}
                      </span>
                    )}
                  </div>
                  <ul className="flex list-disc flex-col gap-0.5 pl-4">
                    {entry.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-xs leading-relaxed text-zaid-muted print:text-neutral-700"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </section>

          <section data-testid="resume-projects" className="mt-4 flex flex-col gap-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted print:text-neutral-500">
              Projects
            </h2>
            <ul className="flex list-none flex-col gap-1.5">
              {featured.map((project) => (
                <li
                  key={project.id}
                  data-testid={`resume-project-${project.id}`}
                  className="flex flex-col gap-0.5"
                >
                  <span className="font-sans text-xs font-semibold text-zaid-text print:text-black">
                    {project.title}
                  </span>
                  <span className="text-xs text-zaid-muted print:text-neutral-700">
                    {project.tagline}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </article>
      </div>
    </div>
  );
}

export default ResumeApp;
