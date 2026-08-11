"use client";

import { useEffect, useMemo, useState } from "react";
import { FolderGit2 } from "lucide-react";

import { Icon, type IconName } from "@/components/ui/Icon";
import { OsAppShell, OsButton, OsStatusBar, OsToolbar } from "@/components/os";
import { openBrowser } from "@/lib/wm/openBrowser";
import { projects, type Project, type ProjectStatus } from "@/content";

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

function sortFeatured(list: Project[]): Project[] {
  return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
}

function ProjectLinks({ project }: { project: Project }) {
  const { links } = project;
  const entries: {
    href: string;
    label: string;
    icon: IconName;
    testid: string;
  }[] = [];

  if (links.live) {
    entries.push({
      href: links.live,
      label: "Open live",
      icon: "external-link",
      testid: "projects-link-live",
    });
  }
  if (links.repo) {
    entries.push({
      href: links.repo,
      label: "Repo",
      icon: "folder-git",
      testid: "projects-link-repo",
    });
  }
  if (links.article) {
    entries.push({
      href: links.article,
      label: "Article",
      icon: "file-text",
      testid: "projects-link-article",
    });
  }
  if (links.figma) {
    entries.push({
      href: links.figma,
      label: "Design",
      icon: "paintbrush",
      testid: "projects-link-figma",
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry) => (
        <OsButton
          key={entry.testid}
          data-testid={entry.testid}
          variant={entry.testid === "projects-link-live" ? "primary" : "default"}
          onClick={() => openBrowser(entry.href)}
        >
          <Icon name={entry.icon} size={14} />
          {entry.label}
        </OsButton>
      ))}
    </div>
  );
}

export function ProjectsApp() {
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      sortFeatured(
        filter === "all" ? [...projects] : projects.filter((p) => p.status === filter),
      ),
    [filter],
  );

  const selected = useMemo(
    () => (selectedId ? projects.find((p) => p.id === selectedId) ?? null : null),
    [selectedId],
  );

  useEffect(() => {
    if (visible.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId === null || !visible.some((p) => p.id === selectedId)) {
      setSelectedId(visible[0]!.id);
    }
  }, [visible, selectedId]);

  return (
    <OsAppShell
      testId="app-content-projects"
      toolbar={
        <OsToolbar className="gap-2">
          {FILTER_LABELS.map((tab) => (
            <OsButton
              key={tab.value}
              data-testid={`projects-filter-${tab.value}`}
              variant={filter === tab.value ? "primary" : "default"}
              onClick={() => {
                setFilter(tab.value);
                setSelectedId(null);
              }}
            >
              {tab.label}
            </OsButton>
          ))}
        </OsToolbar>
      }
      statusBar={
        <OsStatusBar>
          <span>{visible.length} projects</span>
          <button
            type="button"
            data-testid="projects-more-github"
            onClick={() => openBrowser("https://github.com/Zaidx-me?tab=repositories")}
            className="text-zaid-accent hover:underline"
          >
            github.com/Zaidx-me
          </button>
        </OsStatusBar>
      }
    >
      <div className="flex h-full min-h-0">
        <div className="flex w-full min-w-0 flex-col border-r border-zaid-border md:w-72 md:shrink-0">
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((project) => {
              const active = selectedId === project.id;
              return (
                <li
                  key={project.id}
                  className={active ? "bg-zaid-accent text-white" : "bg-zaid-surface2"}
                >
                  <button
                    type="button"
                    data-testid={`projects-card-${project.id}`}
                    onClick={() => setSelectedId(project.id)}
                    className="flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{project.title}</span>
                      <span
                        data-testid={`projects-card-${project.id}-status`}
                        className={`shrink-0 px-1.5 py-0.5 text-[10px] uppercase ${
                          active ? "bg-white/20" : "bevel-in text-zaid-muted"
                        }`}
                      >
                        {STATUS_LABELS[project.status]}
                      </span>
                    </div>
                    <p
                      className={`line-clamp-1 text-xs ${active ? "text-white/90" : "text-zaid-muted"}`}
                    >
                      {project.tagline}
                    </p>
                  </button>
                  {project.links.live && (
                    <div className="px-3 pb-2">
                      <OsButton
                        data-testid={`projects-card-${project.id}-live`}
                        variant={active ? "ghost" : "primary"}
                        className={active ? "text-white hover:bg-white/20" : ""}
                        onClick={() => openBrowser(project.links.live!)}
                      >
                        View live
                      </OsButton>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto bg-white p-4">
          {selected ? (
            <section data-testid="projects-detail" className="flex flex-col gap-4">
              <div className="flex items-start gap-3 border-b border-zaid-border pb-3">
                <FolderGit2 size={28} className="shrink-0 text-zaid-accent" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-zaid-text">{selected.title}</h2>
                  <p className="text-sm text-zaid-muted">{selected.tagline}</p>
                </div>
                <span
                  data-testid="projects-detail-status"
                  className="bevel-in shrink-0 px-2 py-1 text-[10px] font-semibold uppercase text-zaid-muted"
                >
                  {STATUS_LABELS[selected.status]}
                </span>
              </div>

              <p className="text-sm leading-relaxed text-zaid-text">{selected.description}</p>

              {selected.id === "zenith-build" && (
                <p
                  data-testid="projects-detail-archived-note"
                  className="bevel-in px-3 py-2 text-xs text-zaid-muted"
                >
                  Deployed site is archived (404).
                </p>
              )}

              <div>
                <p className="label-caps mb-2">Stack</p>
                <div data-testid="projects-detail-stack" className="flex flex-wrap gap-1.5">
                  {selected.stack.map((tech) => (
                    <span key={tech} className="bevel-in px-2 py-0.5 text-[10px] text-zaid-text">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="label-caps mb-2">Links</p>
                <ProjectLinks project={selected} />
              </div>
            </section>
          ) : (
            <p className="text-sm text-zaid-muted">Select a project from the list.</p>
          )}
        </div>
      </div>
    </OsAppShell>
  );
}

export default ProjectsApp;
