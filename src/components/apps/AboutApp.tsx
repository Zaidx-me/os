"use client";

import Image from "next/image";

import { articles, projects, site } from "@/content";

/**
 * About (about) — profile header, bio, personality chips, quick stats.
 *
 * All copy comes from the content data layer (site.bio / site.personalityChips
 * written in Zaid's own voice from the zaidx.me home bio + GitHub README). The
 * quick stats derive from shipped data (projects.length, articles.length); the
 * repo count is a published GitHub fact (29 public repos). Deliberately no
 * template /uses copy or generic meta-description text.
 */
export function AboutApp() {
  return (
    <div
      data-testid="app-content-about"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex flex-col gap-6 p-6">
        <header className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-lg hairline">
            <Image
              data-testid="about-photo"
              src="/images/profile.jpg"
              alt="Portrait of Muhammad Zaid Yaseen"
              fill
              sizes="112px"
              unoptimized
              className="object-cover"
            />
          </div>
          <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
            <h1
              data-testid="about-name"
              className="font-sans text-2xl font-semibold text-zaid-text"
            >
              {site.owner}
            </h1>
            <p
              data-testid="about-role"
              className="font-mono text-sm text-zaid-accent"
            >
              {site.roleLine}
            </p>
            <p className="font-mono text-xs text-zaid-muted">
              ~{site.handle} · {site.siteUrl.replace("https://", "")}
            </p>
          </div>
        </header>

        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
            Bio
          </h2>
          <div className="flex flex-col gap-3">
            {site.bio.map((paragraph) => (
              <p
                key={paragraph.slice(0, 24)}
                className="text-sm leading-relaxed text-zaid-text"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
            Beyond the code
          </h2>
          <div className="flex flex-wrap gap-2">
            {site.personalityChips.map((chip) => (
              <span
                key={chip}
                data-testid={`about-chip-${chip.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
                className="hairline rounded-full px-3 py-1 font-mono text-xs text-zaid-text"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-mono text-xs uppercase tracking-wider text-zaid-muted">
            Quick stats
          </h2>
          <dl className="grid grid-cols-3 gap-3">
            <div className="hairline flex flex-col items-center gap-1 rounded-lg p-3">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zaid-muted">
                Projects
              </dt>
              <dd data-testid="about-stat-projects" className="font-mono text-2xl text-zaid-accent">
                {projects.length}
              </dd>
            </div>
            <div className="hairline flex flex-col items-center gap-1 rounded-lg p-3">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zaid-muted">
                Repos
              </dt>
              <dd data-testid="about-stat-repos" className="font-mono text-2xl text-zaid-accent">
                29
              </dd>
            </div>
            <div className="hairline flex flex-col items-center gap-1 rounded-lg p-3">
              <dt className="font-mono text-[10px] uppercase tracking-wider text-zaid-muted">
                Articles
              </dt>
              <dd data-testid="about-stat-articles" className="font-mono text-2xl text-zaid-accent">
                {articles.length}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

export default AboutApp;
