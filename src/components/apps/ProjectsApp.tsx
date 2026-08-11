"use client";

import { useState } from "react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { projects, type Project, type ProjectStatus } from "@/content";

/**
 * Projects (projects) — card grid + filter tabs + detail pane.
 *
 * Cards render from the content data layer (title, tagline, stack, status,
 * featured). Featured projects sort first; the filter tabs mirror the status
 * enum (All / Live / Open source / Client / Archived). Clicking a card reveals
 * a detail pane with the description, full stack, and real link buttons
 * (Live demo / Repo / Article / Design) that open in new tabs. The archived
 * zenith-build shows a "Deployed site is archived (404)" note and never links a
 * dead live URL. No invented copy — everything comes from projects.ts.
 */

const FILTER_LABELS: { value: "all" | ProjectStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "open-source", label: "Open source" },
  { value: "client", label: "Client" },
  { value: "archived", label: "Archived" },
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  live: "Live",
  "open-source": "Open Source",
  client: "Client",
  archived: "Archived",
  "in-progress": "In Progress",
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  live: "border-zaid-accent/60 text-zaid-accent",
  "open-source": "border-zaid-accent2/60 text-zaid-accent2",
  client: "border-zaid-border text-zaid-text",
  archived: "border-zaid-border text-zaid-muted",
  "in-progress": "border-zaid-accent2/60 text-zaid-accent2",
};

function statusOf(status: ProjectStatus): string {
  return STATUS_LABELS[status];
}

function sortFeatured(list: Project[]): Project[] {
  return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
}

function ProjectLinks({ project }: { project: Project }) {
  const { links } = project;
  const entries: { href: string; label: string; icon: IconName; testid: string }[] = [];
  if (links.live) {
    entries.push({ href: links.live, label: "Live demo", icon: "external-link", testid: "projects-link-live" });
  }
  if (links.repo) {
    entries.push({ href: links.repo, label: "Repo", icon: "folder-git", testid: "projects-link-repo" });
  }
  if (links.article) {
    entries.push({ href: links.article, label: "Article", icon: "file-text", testid: "projects-link-article" });
  }
  if (links.figma) {
    entries.push({ href: links.figma, label: "Design", icon: "paintbrush", testid: "projects-link-figma" });
  }
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <a
          key={entry.testid}
          data-testid={entry.testid}
          href={entry.href}
          target="_blank"
          rel="noopener noreferrer"
          className="hairline flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-xs text-zaid-text hover:border-zaid-accent hover:text-zaid-accent"
        >
          <Icon name={entry.icon} size={14} />
          {entry.label}
        </a>
      ))}
    </div>
  );
}

export function ProjectsApp() {
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = sortFeatured(
    filter === "all" ? [...projects] : projects.filter((p) => p.status === filter),
  );
  const selected = selectedId === null ? null : projects.find((p) => p.id === selectedId) ?? null;

  return (
    <div
      data-testid="app-content-projects"
      className="h-full w-full overflow-y-auto bg-zaid-surface"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap gap-1.5">
          {FILTER_LABELS.map((tab) => (
            <button
              key={tab.value}
              data-testid={`projects-filter-${tab.value}`}
              type="button"
              onClick={() => {
                setFilter(tab.value);
                setSelectedId(null);
              }}
              className={`hairline rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                filter === tab.value
                  ? "border-zaid-accent bg-zaid-accent/10 text-zaid-accent"
                  : "text-zaid-muted hover:border-zaid-border hover:text-zaid-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((project) => (
            <button
              key={project.id}
              data-testid={`projects-card-${project.id}`}
              type="button"
              onClick={() => setSelectedId(project.id)}
              className={`hairline flex flex-col gap-2 rounded-lg p-4 text-left transition-colors ${
                selectedId === project.id
                  ? "border-zaid-accent bg-zaid-accent/5"
                  : "hover:border-zaid-border hover:bg-zaid-surface2"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="folder-git" size={18} className="shrink-0 text-zaid-accent" />
                <span className="font-sans text-sm font-semibold text-zaid-text">
                  {project.title}
                </span>
                <span
                  data-testid={`projects-card-${project.id}-status`}
                  className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLES[project.status]}`}
                >
                  {statusOf(project.status)}
                </span>
              </div>
              <p className="font-mono text-xs text-zaid-muted">{project.tagline}</p>
              <div className="flex flex-wrap gap-1">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-[10px] text-zaid-muted"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {selected !== null && (
          <section
            data-testid="projects-detail"
            className="hairline flex flex-col gap-3 rounded-lg bg-zaid-surface2 p-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="font-sans text-base font-semibold text-zaid-text">
                {selected.title}
              </h2>
              <span
                data-testid="projects-detail-status"
                className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${STATUS_STYLES[selected.status]}`}
              >
                {statusOf(selected.status)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zaid-text">
              {selected.description}
            </p>
            {selected.id === "zenith-build" && (
              <p
                data-testid="projects-detail-archived-note"
                className="font-mono text-xs text-zaid-muted"
              >
                Deployed site is archived (404).
              </p>
            )}
            <div data-testid="projects-detail-stack" className="flex flex-wrap gap-1.5">
              {selected.stack.map((tech) => (
                <span
                  key={tech}
                  className="hairline rounded-md px-2 py-0.5 font-mono text-[10px] text-zaid-muted"
                >
                  {tech}
                </span>
              ))}
            </div>
            <ProjectLinks project={selected} />
          </section>
        )}

        <footer className="mt-2 flex items-center gap-2">
          <span className="font-mono text-xs text-zaid-muted">More on GitHub</span>
          <a
            data-testid="projects-more-github"
            href="https://github.com/Zaidx-me?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-zaid-accent hover:underline"
          >
            https://github.com/Zaidx-me?tab=repositories
          </a>
        </footer>
      </div>
    </div>
  );
}

export default ProjectsApp;
