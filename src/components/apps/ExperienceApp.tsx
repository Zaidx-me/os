"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { experience, type ExperienceType } from "@/content";

/**
 * Experience & Education (experience) — timeline grouped by type.
 *
 * Entries render from content/experience.ts (facts only — sourced from the
 * zaidx.me home bio + GitHub README; no invented employers, dates, or
 * achievements). Each entry shows role, org, a period or Current badge, and
 * 2-3 factual bullets. Periods were never published, so the UI renders "—"
 * for unknown dates (never "undefined").
 */

const GROUP_LABELS: Record<ExperienceType, string> = {
  education: "Education",
  work: "Work",
  freelance: "Freelance",
};

const GROUP_ICONS: Record<ExperienceType, IconName> = {
  education: "graduation-cap",
  work: "briefcase",
  freelance: "globe",
};

export function ExperienceApp() {
  const groups = (["education", "work", "freelance"] as const)
    .map((type) => ({
      type,
      entries: experience.filter((e) => e.type === type),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <div
      data-testid="app-content-experience"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex flex-col gap-6 p-6">
        {groups.map((group) => (
          <section
            key={group.type}
            data-testid={`experience-group-${group.type}`}
            className="flex flex-col gap-2"
          >
            <h2 className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-zaid-muted">
              <Icon name={GROUP_ICONS[group.type]} size={14} />
              {GROUP_LABELS[group.type]}
            </h2>
            <ol className="flex flex-col gap-3">
              {group.entries.map((entry) => (
                <li
                  key={entry.id}
                  data-testid={`experience-entry-${entry.id}`}
                  className="hairline flex flex-col gap-1 rounded-lg bg-zaid-surface2 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-sm font-semibold text-zaid-text">
                      {entry.role}
                    </span>
                    {entry.current && (
                      <span
                        data-testid={`experience-current-${entry.id}`}
                        className="rounded-full border border-zaid-accent/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-zaid-accent"
                      >
                        Current
                      </span>
                    )}
                  </div>
                  {entry.org !== undefined && (
                    <p
                      data-testid={`experience-org-${entry.id}`}
                      className="font-mono text-xs text-zaid-muted"
                    >
                      {entry.org}
                    </p>
                  )}
                  <p
                    data-testid={`experience-period-${entry.id}`}
                    className="font-mono text-[10px] text-zaid-muted"
                  >
                    {entry.period ?? (entry.current ? "Current" : "—")}
                  </p>
                  <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
                    {entry.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="text-xs leading-relaxed text-zaid-text"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

export default ExperienceApp;
