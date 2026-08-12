import { useEffect, useMemo, useState } from "react";
import { projects } from "../content/index.ts";
import { openBrowser } from "../lib/openBrowser.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "open-source", label: "Open source" },
  { value: "client", label: "Client" },
  { value: "archived", label: "Archived" },
];

const STATUS_LABELS = {
  live: "Live",
  "open-source": "Open Source",
  client: "Client",
  archived: "Archived",
  "in-progress": "In Progress",
};

function sortFeatured(list) {
  return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
}

function ProjectDetail({ project, onBack, isMobile }) {
  return (
    <section data-testid="projects-detail" className="flex flex-col gap-4">
      {isMobile && (
        <button
          type="button"
          data-testid="projects-back"
          onClick={onBack}
          className="flex w-fit items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400"
        >
          ← All projects
        </button>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{project.title}</h2>
          <p className="mt-0.5 text-sm text-green-600 dark:text-green-400">{project.tagline}</p>
        </div>
        <span
          data-testid="projects-detail-status"
          className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-white/10 dark:text-gray-300"
        >
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{project.description}</p>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Stack</p>
        <div data-testid="projects-detail-stack" className="flex flex-wrap gap-1.5">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-white/10 dark:text-gray-200"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {project.links.live && (
          <button
            type="button"
            data-testid="projects-link-live"
            onClick={() => openBrowser(project.links.live)}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white active:scale-[0.98]"
          >
            Open live
          </button>
        )}
        {project.links.repo && (
          <a
            href={project.links.repo}
            target="_blank"
            rel="noreferrer"
            data-testid="projects-link-repo"
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 dark:border-white/15 dark:text-gray-200"
          >
            Repo
          </a>
        )}
        {project.links.article && (
          <a
            href={project.links.article}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-800 dark:border-white/15 dark:text-gray-200"
          >
            Article
          </a>
        )}
      </div>
    </section>
  );
}

export default function ProjectsApp() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const visible = useMemo(
    () => sortFeatured(filter === "all" ? projects : projects.filter((p) => p.status === filter)),
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
    if (selectedId && !visible.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visible, selectedId]);

  useEffect(() => {
    if (isMobile || selectedId) return;
    if (visible.length > 0) setSelectedId(visible[0].id);
  }, [isMobile, selectedId, visible]);

  if (isMobile && selected) {
    return (
      <div data-testid="app-content-projects" className="mobile-app-scroll h-full overflow-y-auto bg-[#f5f5f7] p-4 dark:bg-[#1c1c1e]">
        <ProjectDetail project={selected} onBack={() => setSelectedId(null)} isMobile />
      </div>
    );
  }

  return (
    <div data-testid="app-content-projects" className="mobile-app-scroll flex h-full min-h-0 flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <div className="shrink-0 border-b border-black/5 px-3 py-2 dark:border-white/10 md:hidden">
        <div className="mobile-filter-row flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              data-testid={`projects-filter-${tab.value}`}
              onClick={() => {
                setFilter(tab.value);
                setSelectedId(null);
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 dark:bg-[#2c2c2e] dark:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className={`flex min-h-0 w-full flex-col md:w-72 md:shrink-0 md:border-r md:border-black/5 dark:md:border-white/10 ${
            isMobile && selectedId ? "hidden" : "flex flex-1"
          }`}
        >
          <div className="hidden shrink-0 border-b border-black/5 px-3 py-2 dark:border-white/10 md:block">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  data-testid={`projects-filter-${tab.value}`}
                  onClick={() => {
                    setFilter(tab.value);
                    setSelectedId(null);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    filter === tab.value ? "bg-blue-600 text-white" : "bg-white dark:bg-[#2c2c2e]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto">
            {visible.map((project) => {
              const active = selectedId === project.id;
              return (
                <li
                  key={project.id}
                  className={active ? "bg-blue-600 text-white" : "border-b border-black/5 dark:border-white/5"}
                >
                  <button
                    type="button"
                    data-testid={`projects-card-${project.id}`}
                    onClick={() => setSelectedId(project.id)}
                    className="flex w-full flex-col gap-1 px-4 py-3 text-left active:bg-black/5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{project.title}</span>
                      <span
                        data-testid={`projects-card-${project.id}-status`}
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase ${
                          active ? "bg-white/20" : "bg-gray-100 text-gray-500 dark:bg-white/10"
                        }`}
                      >
                        {STATUS_LABELS[project.status] ?? project.status}
                      </span>
                    </div>
                    <p className={`line-clamp-2 text-xs ${active ? "text-white/90" : "text-gray-500 dark:text-gray-400"}`}>
                      {project.tagline}
                    </p>
                  </button>
                  {project.links.live && (
                    <div className="px-4 pb-3 md:hidden">
                      <button
                        type="button"
                        data-testid={`projects-card-${project.id}-live`}
                        onClick={() => openBrowser(project.links.live)}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          active ? "bg-white/20 text-white" : "bg-blue-600 text-white"
                        }`}
                      >
                        View live
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div
          className={`min-h-0 min-w-0 flex-1 overflow-y-auto p-4 ${
            isMobile && !selectedId ? "hidden" : "block"
          }`}
        >
          {selected ? (
            <ProjectDetail
              project={selected}
              onBack={() => setSelectedId(null)}
              isMobile={isMobile}
            />
          ) : (
            <p className="text-sm text-gray-500">Select a project from the list.</p>
          )}
        </div>
      </div>
    </div>
  );
}
