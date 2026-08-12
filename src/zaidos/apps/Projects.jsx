import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  BookOpen,
  Globe,
  Search,
  Layers,
  Rocket,
} from "lucide-react";
import { projects, site } from "../content/index.ts";
import { openExternalUrlWithConfirm, openProjectLive } from "../lib/openBrowser.js";
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
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20",
  "open-source": "bg-blue-500/15 text-blue-700 dark:text-blue-400 ring-blue-500/20",
  client: "bg-violet-500/15 text-violet-700 dark:text-violet-400 ring-violet-500/20",
  archived: "bg-gray-500/15 text-gray-600 dark:text-gray-400 ring-gray-500/20",
  "in-progress": "bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-amber-500/20",
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

function StatusBadge({ status, className = "", testId }) {
  return (
    <span
      data-testid={testId}
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${
        STATUS_STYLES[status] ?? STATUS_STYLES.archived
      } ${className}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function ProjectActions({ project, variant = "card" }) {
  const rowClass =
    variant === "card"
      ? "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition active:bg-black/5 dark:active:bg-white/5"
      : "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition active:scale-[0.98]";

  return (
    <div className={variant === "card" ? "space-y-0.5 p-1" : "flex flex-wrap gap-2"}>
      {project.links.live && (
        <button
          type="button"
          data-testid="projects-link-live"
          onClick={() => openProjectLive(project.links.live)}
          className={
            variant === "card"
              ? rowClass
              : `${rowClass} bg-[#007AFF] text-white shadow-sm hover:bg-[#0066d6]`
          }
        >
          {variant === "card" ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#007AFF]/15 text-[#007AFF]">
                <Globe size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-gray-900 dark:text-white">Open live site</span>
                <span className="block truncate text-[12px] text-gray-500">
                  {project.links.live.replace(/^https?:\/\//, "")}
                </span>
              </span>
              <ExternalLink size={15} className="shrink-0 text-gray-400" />
            </>
          ) : (
            <>
              <Globe size={15} />
              Open live
            </>
          )}
        </button>
      )}
      {project.links.repo && (
        <button
          type="button"
          data-testid="projects-link-repo"
          onClick={() => void openExternalUrlWithConfirm(project.links.repo)}
          className={
            variant === "card"
              ? rowClass
              : `${rowClass} border border-black/10 bg-white text-gray-800 dark:border-white/15 dark:bg-white/5 dark:text-gray-200`
          }
        >
          {variant === "card" ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-500/10 text-gray-700 dark:text-gray-300">
                <Github size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-gray-900 dark:text-white">Repository</span>
                <span className="block text-[12px] text-gray-500">GitHub</span>
              </span>
              <ExternalLink size={15} className="shrink-0 text-gray-400" />
            </>
          ) : (
            <>
              <Github size={15} />
              Repo
            </>
          )}
        </button>
      )}
      {project.links.article && (
        <a
          href={project.links.article}
          className={
            variant === "card"
              ? rowClass
              : `${rowClass} border border-black/10 bg-white text-gray-800 dark:border-white/15 dark:bg-white/5 dark:text-gray-200`
          }
        >
          {variant === "card" ? (
            <>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
                <BookOpen size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-gray-900 dark:text-white">Article</span>
                <span className="block text-[12px] text-gray-500">Read on ZaidOS</span>
              </span>
              <ExternalLink size={15} className="shrink-0 text-gray-400" />
            </>
          ) : (
            <>
              <BookOpen size={15} />
              Article
            </>
          )}
        </a>
      )}
    </div>
  );
}

function ProjectDetailPanel({ project, onBack, compact = false }) {
  const gradient = gradientFor(project.id);

  return (
    <section data-testid="projects-detail" className="flex h-full min-h-0 flex-col">
      <div className={`relative shrink-0 overflow-hidden bg-gradient-to-br ${gradient} ${compact ? "px-5 pb-5 pt-4" : "px-6 pb-6 pt-5"}`}>
        {onBack && (
          <button
            type="button"
            data-testid="projects-back"
            onClick={onBack}
            className="mb-4 flex w-fit items-center gap-1 text-sm font-medium text-white/90 hover:text-white"
          >
            <ChevronLeft size={18} />
            All projects
          </button>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-xl font-bold text-white backdrop-blur-sm">
              {project.title.charAt(0)}
            </div>
            <h2 className={`font-bold leading-tight text-white ${compact ? "text-2xl" : "text-[28px]"}`}>
              {project.title}
            </h2>
            <p className="mt-1 text-[15px] leading-snug text-white/85">{project.tagline}</p>
          </div>
          <StatusBadge
            status={project.status}
            testId="projects-detail-status"
            className="!bg-black/25 !text-white !ring-white/20"
          />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${compact ? "space-y-4 p-4" : "space-y-5 p-6"}`}>
        <div className="rounded-2xl border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#2c2c2e]">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">About</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-gray-700 dark:text-gray-200">{project.description}</p>
        </div>

        <div className="rounded-2xl border border-black/[0.04] bg-white p-4 shadow-sm dark:border-white/[0.06] dark:bg-[#2c2c2e]">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Stack</h3>
          <div data-testid="projects-detail-stack" className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-[#f2f2f7] px-3 py-1 text-[12px] font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.04] bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#2c2c2e]">
          <ProjectActions project={project} variant="card" />
        </div>
      </div>
    </section>
  );
}

function ProjectListItem({ project, active, onSelect }) {
  const gradient = gradientFor(project.id);

  return (
    <li>
      <button
        type="button"
        data-testid={`projects-card-${project.id}`}
        onClick={() => onSelect(project.id)}
        className={`group flex w-full items-stretch gap-0 text-left transition ${
          active
            ? "bg-[#007AFF]/10 dark:bg-[#007AFF]/15"
            : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
        }`}
      >
        <span className={`w-1 shrink-0 bg-gradient-to-b ${gradient} ${active ? "opacity-100" : "opacity-40 group-hover:opacity-70"}`} />
        <span className="min-w-0 flex-1 px-4 py-3.5">
          <span className="flex items-center justify-between gap-2">
            <span className={`truncate text-[15px] font-semibold ${active ? "text-[#007AFF]" : "text-gray-900 dark:text-white"}`}>
              {project.title}
            </span>
            <StatusBadge status={project.status} testId={`projects-card-${project.id}-status`} />
          </span>
          <span className="mt-1 line-clamp-2 text-[13px] leading-snug text-gray-500 dark:text-gray-400">
            {project.tagline}
          </span>
        </span>
        <span className="flex items-center pr-3 text-gray-300 dark:text-gray-600">
          <ChevronRight size={16} className={active ? "text-[#007AFF]" : ""} />
        </span>
      </button>
    </li>
  );
}

function FeaturedStrip({ items, onSelect }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory">
      {items.map((project) => {
        const gradient = gradientFor(project.id);
        return (
          <button
            key={project.id}
            type="button"
            data-testid={`projects-featured-${project.id}`}
            onClick={() => onSelect(project.id)}
            className={`snap-start flex h-[140px] w-[220px] shrink-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-left shadow-md active:scale-[0.98] transition-transform`}
          >
            <span className="w-fit rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Featured
            </span>
            <span>
              <span className="block text-[17px] font-bold leading-tight text-white">{project.title}</span>
              <span className="mt-1 line-clamp-2 text-[12px] text-white/80">{project.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MobileProjectCard({ project, onSelect }) {
  const gradient = gradientFor(project.id);

  return (
    <article
      data-testid={`projects-card-${project.id}`}
      className="overflow-hidden rounded-2xl border border-black/[0.04] bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#1c1c1e]"
    >
      <button type="button" onClick={() => onSelect(project.id)} className="flex w-full flex-col text-left">
        <div className={`bg-gradient-to-br ${gradient} px-4 py-4`}>
          <div className="flex items-start justify-between gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold text-white backdrop-blur-sm">
              {project.title.charAt(0)}
            </span>
            <StatusBadge status={project.status} testId={`projects-card-${project.id}-status`} className="!bg-white/90 !text-gray-800 !ring-0 dark:!bg-black/40 dark:!text-white" />
          </div>
          <h3 className="mt-3 text-[18px] font-bold leading-tight text-white">{project.title}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] text-white/80">{project.tagline}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 py-3">
          {project.stack.slice(0, 4).map((tech) => (
            <span key={tech} className="rounded-md bg-[#f2f2f7] px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {tech}
            </span>
          ))}
        </div>
      </button>
      {project.links.live && (
        <div className="border-t border-black/[0.04] p-3 dark:border-white/[0.06]">
          <button
            type="button"
            data-testid={`projects-card-${project.id}-live`}
            onClick={() => openProjectLive(project.links.live)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007AFF] py-2.5 text-[15px] font-semibold text-white active:opacity-90"
          >
            <ExternalLink size={16} />
            View live
          </button>
        </div>
      )}
    </article>
  );
}

function ProjectsHeader({ search, onSearchChange, subtitle }) {
  return (
    <header className="shrink-0 border-b border-black/[0.05] px-4 py-4 dark:border-white/[0.06] sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white sm:text-[26px]">Projects</h1>
          <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#39FF14]/10 text-[#22c55e] dark:text-[#39FF14]">
          <Rocket size={20} />
        </div>
      </div>
      <div className="relative mt-3">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-xl border border-black/[0.06] bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-[#007AFF] dark:border-white/10 dark:bg-[#2c2c2e] dark:text-white"
        />
      </div>
    </header>
  );
}

function FilterPills({ filter, onChange, className = "" }) {
  return (
    <div className={`flex gap-2 overflow-x-auto hide-scrollbar ${className}`}>
      {FILTERS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          data-testid={`projects-filter-${tab.value}`}
          onClick={() => onChange(tab.value)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition active:scale-95 ${
            filter === tab.value
              ? "bg-[#007AFF] text-white shadow-sm"
              : "bg-white text-gray-700 ring-1 ring-black/[0.06] dark:bg-[#2c2c2e] dark:text-gray-300 dark:ring-white/10"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function ProjectsApp() {
  const isMobile = useIsMobile();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const liveCount = projects.filter((p) => p.status === "live").length;
  const featured = useMemo(() => sortFeatured(projects.filter((p) => p.featured)), []);

  const visible = useMemo(() => {
    let list = filter === "all" ? projects : projects.filter((p) => p.status === filter);
    list = sortFeatured(list);
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.stack.some((s) => s.toLowerCase().includes(q)),
    );
  }, [filter, search]);

  const selected = useMemo(
    () => (selectedId ? projects.find((p) => p.id === selectedId) ?? null : null),
    [selectedId],
  );

  const subtitle = `${projects.length} builds · ${liveCount} live · ${site.handle}`;

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
      return (
        <div data-testid="app-content-projects" className="mobile-app-scroll flex h-full min-h-0 flex-col overflow-y-auto bg-[#f2f2f7] dark:bg-black">
          <ProjectDetailPanel project={selected} onBack={() => setSelectedId(null)} compact />
        </div>
      );
    }

    return (
      <div data-testid="app-content-projects" className="mobile-app-scroll flex h-full min-h-0 flex-col overflow-y-auto bg-[#f2f2f7] dark:bg-black">
        <ProjectsHeader search={search} onSearchChange={setSearch} subtitle={subtitle} />
        <div className="px-4 py-3">
          <FilterPills filter={filter} onChange={setFilter} />
        </div>
        {filter === "all" && featured.length > 0 && (
          <section className="px-4 pb-4">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gray-500">
              <Layers size={14} />
              Featured
            </div>
            <FeaturedStrip items={featured} onSelect={setSelectedId} />
          </section>
        )}
        <section className="flex-1 px-4 pb-8">
          <p className="mb-3 text-[13px] font-medium text-gray-500">{visible.length} results</p>
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center dark:border-gray-700">
              <p className="font-medium text-gray-700 dark:text-gray-300">No projects found</p>
              <p className="mt-1 text-sm text-gray-500">Try another filter or search term.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((project) => (
                <MobileProjectCard key={project.id} project={project} onSelect={setSelectedId} />
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div data-testid="app-content-projects" className="flex h-full min-h-0 flex-col bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[min(100%,340px)] shrink-0 flex-col border-r border-black/[0.05] dark:border-white/[0.06]">
          <ProjectsHeader search={search} onSearchChange={setSearch} subtitle={subtitle} />
          <div className="border-b border-black/[0.05] px-4 py-3 dark:border-white/[0.06]">
            <FilterPills
              filter={filter}
              onChange={(value) => {
                setFilter(value);
                setSelectedId(null);
              }}
            />
          </div>
          {filter === "all" && featured.length > 0 && (
            <div className="border-b border-black/[0.05] px-4 py-3 dark:border-white/[0.06]">
              <FeaturedStrip items={featured} onSelect={setSelectedId} />
            </div>
          )}
          <ul className="min-h-0 flex-1 divide-y divide-black/[0.04] overflow-y-auto dark:divide-white/[0.05]">
            {visible.map((project) => (
              <ProjectListItem
                key={project.id}
                project={project}
                active={selectedId === project.id}
                onSelect={setSelectedId}
              />
            ))}
          </ul>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden bg-[#f2f2f7] dark:bg-[#161618]">
          {selected ? (
            <ProjectDetailPanel project={selected} compact />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
              <Layers size={32} className="text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500">Select a project from the list</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
