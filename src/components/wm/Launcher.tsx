"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pin, Search, Terminal, Waves } from "lucide-react";
import { motion } from "motion/react";
import { AppIcon } from "@/components/ui/AppIcon";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { APPS, type AppMeta } from "@/lib/apps";
import { APP_CATEGORIES } from "@/lib/os/categories";
import { scoreFuzzy, sortByScore } from "@/lib/fuzzy";
import { setModalOpen } from "@/lib/hotkeys";
import { openApp } from "@/lib/wm/actions";
import {
  selectPinnedApps,
  selectRecentApps,
  useLauncherPrefsStore,
} from "@/store/launcher-prefs";
import { useWallpaperStore } from "@/store/wallpaper";
import type { AppId } from "@/components/ui/AppIcon";
import { motionTokens, OS_DURATION } from "@/lib/motion/spring";

interface LauncherCommand {
  id: string;
  label: string;
  keywords: string[];
  icon: React.ReactNode;
  run: () => void;
}

type LauncherEntry =
  | { kind: "app"; app: AppMeta }
  | { kind: "command"; command: LauncherCommand };

const LAUNCHER_COMMANDS: readonly LauncherCommand[] = [
  {
    id: "open-terminal",
    label: "Open Terminal",
    keywords: ["open terminal", "shell", "console"],
    icon: <Terminal size={18} aria-hidden="true" />,
    run: () => openApp("terminal"),
  },
  {
    id: "matrix-rain",
    label: "Matrix Rain",
    keywords: ["matrix", "matrix rain", "wallpaper"],
    icon: <Waves size={18} aria-hidden="true" />,
    run: () => useWallpaperStore.getState().setWallpaper("teal"),
  },
];

function searchText(entry: LauncherEntry): string {
  return entry.kind === "app"
    ? `${entry.app.title} ${entry.app.keywords.join(" ")}`
    : `${entry.command.label} ${entry.command.keywords.join(" ")}`;
}

function entryId(entry: LauncherEntry): string {
  return entry.kind === "app" ? entry.app.id : entry.command.id;
}

function entryIcon(entry: LauncherEntry): React.ReactNode {
  return entry.kind === "app" ? (
    <AppIcon appId={entry.app.id} size={18} className="shrink-0" />
  ) : (
    entry.command.icon
  );
}

function entryLabel(entry: LauncherEntry): string {
  return entry.kind === "app" ? entry.app.title : entry.command.label;
}

export default function Launcher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pinned = useLauncherPrefsStore(selectPinnedApps);
  const recent = useLauncherPrefsStore(selectRecentApps);
  const togglePin = useLauncherPrefsStore((s) => s.togglePin);

  useFocusTrap(panelRef, open);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("zaidos:toggle-launcher", onToggle);
    return () => window.removeEventListener("zaidos:toggle-launcher", onToggle);
  }, []);

  useEffect(() => {
    setModalOpen(open);
    if (open) inputRef.current?.focus();
    return () => setModalOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") close();
  };

  const results = useMemo<LauncherEntry[]>(() => {
    const appEntry = (app: AppMeta): LauncherEntry => ({ kind: "app", app });
    const commandEntry = (command: LauncherCommand): LauncherEntry => ({
      kind: "command",
      command,
    });
    const trimmed = query.trim();
    if (trimmed === "") return APPS.map(appEntry);
    const candidates: LauncherEntry[] = [
      ...APPS.map(appEntry),
      ...LAUNCHER_COMMANDS.map(commandEntry),
    ];
    const scored = candidates
      .map((entry) => ({ entry, score: scoreFuzzy(trimmed, searchText(entry)) }))
      .filter((r) => r.score >= 0);
    return sortByScore(scored, (r) => r.score).map((r) => r.entry);
  }, [query]);

  const safeActive = Math.min(active, Math.max(0, results.length - 1));

  const runEntry = useCallback(
    (entry: LauncherEntry) => {
      if (entry.kind === "app") openApp(entry.app.id);
      else entry.command.run();
      close();
    },
    [close],
  );

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0) setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[safeActive];
      if (entry) runEntry(entry);
    }
  };

  if (!open) return null;

  const gridMode = query.trim() === "";
  const pinnedApps = pinned
    .map((id) => APPS.find((a) => a.id === id))
    .filter(Boolean) as AppMeta[];
  const recentApps = recent
    .map((id) => APPS.find((a) => a.id === id))
    .filter(Boolean) as AppMeta[];

  return (
    <>
      <motion.div
        data-testid="launcher-backdrop"
        className="spotlight-backdrop fixed inset-0 z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: OS_DURATION.base }}
        onClick={close}
        onContextMenu={(e) => e.preventDefault()}
      />
      <motion.div
        ref={panelRef}
        data-testid="launcher"
        role="dialog"
        aria-label="Spotlight Search"
        className="spotlight-panel window-glass fixed left-1/2 top-[12%] z-[70] max-h-[70vh] w-[min(94vw,680px)] -translate-x-1/2 overflow-hidden font-sans"
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={motionTokens.spring.smooth}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onPanelKeyDown}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <Search size={22} className="shrink-0 text-zaid-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            data-testid="launcher-input"
            role="combobox"
            aria-expanded="true"
            aria-controls="launcher-results"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Spotlight Search"
            aria-label="Spotlight Search"
            className="w-full bg-transparent text-xl font-light text-zaid-text outline-none placeholder:text-zaid-muted"
          />
        </div>
        <div className="h-px bg-zaid-border/60" />

        {gridMode ? (
          <div
            id="launcher-results"
            data-testid="launcher-grid"
            className="max-h-[60vh] overflow-y-auto p-3"
          >
            {pinnedApps.length > 0 && (
              <LauncherSection title="Pinned">
                <div className="grid grid-cols-4 gap-1">
                  {pinnedApps.map((app) => (
                    <LauncherAppCell
                      key={app.id}
                      app={app}
                      pinned
                      onRun={() => runEntry({ kind: "app", app })}
                      onTogglePin={() => togglePin(app.id)}
                    />
                  ))}
                </div>
              </LauncherSection>
            )}
            {recentApps.length > 0 && (
              <LauncherSection title="Recent">
                <div className="grid grid-cols-4 gap-1">
                  {recentApps.map((app) => (
                    <LauncherAppCell
                      key={app.id}
                      app={app}
                      pinned={pinned.includes(app.id)}
                      onRun={() => runEntry({ kind: "app", app })}
                      onTogglePin={() => togglePin(app.id)}
                    />
                  ))}
                </div>
              </LauncherSection>
            )}
            {APP_CATEGORIES.map((cat) => {
              const apps = cat.apps
                .map((id) => APPS.find((a) => a.id === id))
                .filter(Boolean) as AppMeta[];
              if (apps.length === 0) return null;
              return (
                <LauncherSection key={cat.id} title={cat.label}>
                  <div className="grid grid-cols-4 gap-1">
                    {apps.map((app) => (
                      <LauncherAppCell
                        key={app.id}
                        app={app}
                        pinned={pinned.includes(app.id)}
                        onRun={() => runEntry({ kind: "app", app })}
                        onTogglePin={() => togglePin(app.id)}
                      />
                    ))}
                  </div>
                </LauncherSection>
              );
            })}
          </div>
        ) : results.length === 0 ? (
          <p data-testid="launcher-empty" className="px-4 py-6 text-center text-xs text-zaid-muted">
            No matches for “{query}”
          </p>
        ) : (
          <ul
            id="launcher-results"
            data-testid="launcher-list"
            role="listbox"
            className="max-h-72 overflow-y-auto p-1.5"
          >
            {results.map((entry, i) => (
              <li key={entryId(entry)}>
                <LauncherOption
                  entry={entry}
                  active={i === safeActive}
                  onHover={() => setActive(i)}
                  onRun={() => runEntry(entry)}
                />
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </>
  );
}

function LauncherSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      <p className="label-caps mb-2 px-1">{title}</p>
      {children}
    </section>
  );
}

function LauncherAppCell({
  app,
  pinned,
  onRun,
  onTogglePin,
}: {
  app: AppMeta;
  pinned: boolean;
  onRun: () => void;
  onTogglePin: () => void;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        data-testid={`launcher-result-${app.id}`}
        onClick={onRun}
        className="flex w-full flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[11px] text-zaid-text hover:bg-zaid-surface2/80"
      >
        <AppIcon appId={app.id} size={40} />
        <span className="line-clamp-2">{app.title}</span>
      </button>
      <button
        type="button"
        aria-label={pinned ? "Unpin" : "Pin"}
        data-testid={`launcher-pin-${app.id}`}
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        className={`absolute right-0 top-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 ${
          pinned ? "text-zaid-accent opacity-100" : "text-zaid-muted"
        }`}
      >
        <Pin size={10} />
      </button>
    </div>
  );
}

function LauncherOption({
  entry,
  active,
  onHover,
  onRun,
}: {
  entry: LauncherEntry;
  active: boolean;
  onHover: () => void;
  onRun: () => void;
}) {
  const id = entryId(entry);
  return (
    <button
      type="button"
      role="option"
      data-testid={`launcher-result-${id}`}
      data-active={active ? "true" : "false"}
      aria-selected={active}
      onMouseMove={onHover}
      onMouseEnter={onHover}
      onClick={onRun}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
        active ? "bg-zaid-accent text-white" : "text-zaid-text hover:bg-zaid-surface2/80"
      }`}
    >
      {entry.kind === "app" ? (
        <AppIcon appId={entry.app.id} size={28} />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zaid-surface2">
          {entry.command.icon}
        </span>
      )}
      <span>{entryLabel(entry)}</span>
    </button>
  );
}
