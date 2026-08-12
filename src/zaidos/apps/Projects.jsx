import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ExternalLink, Github, Sparkles, BookOpen, Globe } from "lucide-react";
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

const STATUS_STYLES = {
  live: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "open-source": "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  client: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  archived: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
  "in-progress": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

const CARD_GRADIENTS = [
  "from-[#0ea5e9] to-[#6366f1]",
  "from-[#10b981] to-[#059669]",
  "from-[#8b5cf6] to-[#6d28d9]",
  "from-[#f97316] to-[#ea580c]",
  "from-[#ec4899] to-[#be185d]",
  "from-[#14b8a6] to-[#0d9488]",
  "from-[#3b82f6] to-[#1d4ed8]",
  "from-[#84cc16] to-[#4d7c0f]",
];

function sortFeatured(list) {
  return [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
}

function gradientFor(id) {
  const index = projects.findIndex((p) => p.id === id);
  return CARD_GRADIENTS[(index >= 0 ? index : 0) % CARD_GRADIENTS.length];
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
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
            STATUS_STYLES[project.status] ?? STATUS_STYLES.archived
          }`}
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

function MobileProjectDetail({ project, onBack }) {
  const gradient = gradientFor(project.id);

  return (
    <div
      data-testid="app-content-projects"
      className="mobile-app-scroll flex h-full min-h-0 flex-col overflow-y-auto bg-[#f2f2f7] dark:bg-black"
    >
      <div className={`relative shrink-0 bg-gradient-to-br ${gradient} px-4 pb-6 pt-2`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            data-testid="projects-back"
            onClick={onBack}
            className="flex min-h-11 items-center gap-0.5 text-[17px] font-medium text-white/95 active:opacity-70"
          >
            <ChevronLeft size={22} strokeWidth={2.25} />
            Projects
          </button>
          <span
            data-testid="projects-detail-status"
            className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white shadow-lg backdrop-blur-sm">
            {project.title.charAt(0)}
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-white">{project.title}</h1>
          <p className="mt-1 text-[15px] leading-snug text-white/85">{project.tagline}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-5 pb-8">
        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1c1c1e]">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">About</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-gray-800 dark:text-gray-200">{project.description}</p>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1c1c1e]">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Stack</h2>
          <div data-testid="projects-detail-stack" className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-[#f2f2f7] px-3 py-1.5 text-[13px] font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-2 shadow-sm dark:bg-[#1c1c1e]">
          {project.links.live && (
            <button
              type="button"
              data-testid="projects-link-live"
              onClick={() => openBrowser(project.links.live)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left active:bg-black/5 dark:active:bg-white/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#007AFF]/15 text-[#007AFF]">
                <Globe size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-[16px] font-medium text-gray-900 dark:text-white">Open live site</span>
                <span className="block truncate text-[13px] text-gray-500">{project.links.live.replace(/^https?:\/\//, "")}</span>
              </span>
              <ExternalLink size={16} className="shrink-0 text-gray-400" />
            </button>
          )}
          {project.links.repo && (
            <a
              href={project.links.repo}
              target="_blank"
              rel="noreferrer"
              data-testid="projects-link-repo"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left active:bg-black/5 dark:active:bg-white/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-500/15 text-gray-700 dark:text-gray-300">
                <Github size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-[16px] font-medium text-gray-900 dark:text-white">View repository</span>
                <span className="block truncate text-[13px] text-gray-500">GitHub</span>
              </span>
              <ExternalLink size={16} className="shrink-0 text-gray-400" />
            </a>
          )}
          {project.links.article && (
            <a
              href={project.links.article}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left active:bg-black/5 dark:active:bg-white/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600">
                <BookOpen size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-[16px] font-medium text-gray-900 dark:text-white">Read article</span>
                <span className="block text-[13px] text-gray-500">Write-up on ZaidOS</span>
              </span>
              <ExternalLink size={16} className="shrink-0 text-gray-400" />
            </a>
          )}
        </section>
      </div>
    </div>
  );
}

function MobileFeaturedCard({ project, onSelect }) {
  const gradient = gradientFor(project.id);

  return (
    <article
      data-testid={`projects-featured-${project.id}`}
      className={`flex h-[168px] w-[260px] shrink-0 flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br ${gradient} p-4 shadow-lg active:scale-[0.98] transition-transform`}
      onClick={() => onSelect(project.id)}
      onKeyDown={(e) => e.key === "Enter" && onSelect(project.id)}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Featured
        </span>
        {project.links.live && (
          <Globe size={14} className="shrink-0 text-white/80" aria-hidden />
        )}
      </div>
      <div>
        <h3 className="text-[20px] font-bold leading-tight text-white">{project.title}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/80">{project.tagline}</p>
      </div>
    </article>
  );
}

function MobileProjectCard({ project, onSelect }) {
  const gradient = gradientFor(project.id);

  return (
    <article
      data-testid={`projects-card-${project.id}`}
      className="overflow-hidden rounded-[20px] bg-white shadow-sm active:scale-[0.99] transition-transform dark:bg-[#1c1c1e]"
    >
      <button
        type="button"
        onClick={() => onSelect(project.id)}
        className="flex w-full flex-col text-left"
      >
        <div className={`relative h-[88px] bg-gradient-to-br ${gradient} px-4 py-3`}>
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white backdrop-blur-sm">
              {project.title.charAt(0)}
            </span>
            <span
              data-testid={`projects-card-${project.id}-status`}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                STATUS_STYLES[project.status] ?? STATUS_STYLES.archived
              } bg-white/90 dark:bg-black/30`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
        </div>

        <div className="px-4 py-3.5">
          <h3 className="text-[17px] font-semibold leading-tight text-gray-900 dark:text-white">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-[14px] leading-snug text-gray-500 dark:text-gray-400">{project.tagline}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.stack.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300"
              >
                {tech}
              </span>
            ))}
            {project.stack.length > 3 && (
              <span className="rounded-md bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:bg-white/10">
                +{project.stack.length - 3}
              </span>
            )}
          </div>
        </div>
      </button>

      {project.links.live && (
        <div className="border-t border-black/[0.04] px-4 py-2.5 dark:border-white/[0.06]">
          <button
            type="button"
            data-testid={`projects-card-${project.id}-live`}
            onClick={() => openBrowser(project.links.live)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#007AFF] py-2.5 text-[15px] font-semibold text-white active:opacity-90"
          >
            <ExternalLink size={16} />
            View live
          </button>
        </div>
      )}
    </article>
  );
}

function MobileProjectsList({ filter, setFilter, visible, featured, onSelect }) {
  const liveCount = projects.filter((p) => p.status === "live").length;

  return (
    <div
      data-testid="app-content-projects"
      className="mobile-app-scroll flex h-full min-h-0 flex-col overflow-y-auto bg-[#f2f2f7] dark:bg-black"
    >
      <header className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[34px] font-bold leading-none tracking-tight text-gray-900 dark:text-white">Projects</h1>
            <p className="mt-1.5 text-[15px] text-gray-500 dark:text-gray-400">
              {projects.length} builds · {liveCount} live
            </p>
          </div>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#007AFF]/10 text-[#007AFF]">
            <Sparkles size={22} />
          </div>
        </div>
      </header>

      <div className="shrink-0 px-4 pb-3">
        <div className="mobile-filter-row flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {FILTERS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              data-testid={`projects-filter-${tab.value}`}
              onClick={() => setFilter(tab.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-semibold transition active:scale-95 ${
                filter === tab.value
                  ? "bg-[#007AFF] text-white shadow-sm"
                  : "bg-white text-gray-700 dark:bg-[#1c1c1e] dark:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filter === "all" && featured.length > 0 && (
        <section className="shrink-0 pb-4">
          <div className="mb-2 flex items-center justify-between px-4">
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">Featured</h2>
            <span className="text-[13px] font-medium text-gray-500">{featured.length}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 hide-scrollbar snap-x snap-mandatory">
            {featured.map((project) => (
              <div key={project.id} className="snap-start">
                <MobileFeaturedCard project={project} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex-1 px-4 pb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-gray-900 dark:text-white">
            {filter === "all" ? "All projects" : FILTERS.find((f) => f.value === filter)?.label}
          </h2>
          <span className="text-[13px] font-medium text-gray-500">{visible.length}</span>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-12 text-center dark:bg-[#1c1c1e]">
            <p className="text-[16px] font-medium text-gray-700 dark:text-gray-300">No projects here</p>
            <p className="mt-1 text-[14px] text-gray-500">Try another filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visible.map((project) => (
              <MobileProjectCard key={project.id} project={project} onSelect={onSelect} />
            ))}
          </div>
        )}
      </section>
    </div>
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

  const featured = useMemo(
    () => sortFeatured(projects.filter((p) => p.featured)),
    [],
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

  if (isMobile) {
    if (selected) {
      return <MobileProjectDetail project={selected} onBack={() => setSelectedId(null)} />;
    }

    return (
      <MobileProjectsList
        filter={filter}
        setFilter={(value) => {
          setFilter(value);
          setSelectedId(null);
        }}
        visible={visible}
        featured={featured}
        onSelect={setSelectedId}
      />
    );
  }

  return (
    <div data-testid="app-content-projects" className="mobile-app-scroll flex h-full min-h-0 flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="flex min-h-0 w-full flex-col md:w-72 md:shrink-0 md:border-r md:border-black/5 dark:md:border-white/10 flex-1">
          <div className="shrink-0 border-b border-black/5 px-3 py-2 dark:border-white/10">
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
                </li>
              );
            })}
          </ul>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4">
          {selected ? (
            <ProjectDetail project={selected} onBack={() => setSelectedId(null)} isMobile={false} />
          ) : (
            <p className="text-sm text-gray-500">Select a project from the list.</p>
          )}
        </div>
      </div>
    </div>
  );
}
