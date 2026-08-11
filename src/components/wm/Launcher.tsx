"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Terminal, Waves } from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { APPS, type AppMeta } from "@/lib/apps";
import { scoreFuzzy, sortByScore } from "@/lib/fuzzy";
import { setModalOpen } from "@/lib/hotkeys";
import { openApp } from "@/lib/wm/actions";
import { useWallpaperStore } from "@/store/wallpaper";

/**
 * Rofi-style app launcher.
 *
 * Opens in response to `zaidos:toggle-launcher`, dispatched by the waybar
 * launcher button and by the Mod+Space hotkey handler (wired in the shell).
 * Modal: while open it calls setModalOpen(true) (blocks the global hotkeys)
 * and covers the desktop with a click-away backdrop, so no keystrokes or
 * clicks can reach the windows below.
 *
 * Empty query -> all apps as a grid. Typing -> fuzzy-ranked list of apps +
 * built-in commands ("open terminal", "matrix rain" — the shell command
 * vocabulary arrives with todo 25). Keyboard: ArrowUp/ArrowDown moves the
 * active option, Enter runs it, Escape closes. The panel stops keydown
 * propagation so launcher keys never fall through to the window hotkey
 * listener, and the input is focused on open.
 *
 * MUST NOT open while typing in a terminal/input: the hotkey service already
 * ignores events whose target is an editable element (isEditableTarget), so
 * Mod+Space inside a terminal never fires — nothing extra is needed here.
 */

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

/** Built-in launcher commands. Keywords are fuzzy-scored with the label. */
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
    run: () => useWallpaperStore.getState().setWallpaper("matrix"),
  },
];

/** Text the fuzzy scorer sees for an entry (title + keywords). */
function searchText(entry: LauncherEntry): string {
  return entry.kind === "app"
    ? `${entry.app.title} ${entry.app.keywords.join(" ")}`
    : `${entry.command.label} ${entry.command.keywords.join(" ")}`;
}

/** Stable result id for testids/keying. */
function entryId(entry: LauncherEntry): string {
  return entry.kind === "app" ? entry.app.id : entry.command.id;
}

/** Leading icon for a result row. */
function entryIcon(entry: LauncherEntry): React.ReactNode {
  return entry.kind === "app" ? (
    <AppIcon appId={entry.app.id} size={18} className="shrink-0" />
  ) : (
    entry.command.icon
  );
}

/** Visible label for a result row. */
function entryLabel(entry: LauncherEntry): string {
  return entry.kind === "app" ? entry.app.title : entry.command.label;
}

export default function Launcher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Waybar button + Mod+Space hotkey both dispatch this event.
  useEffect(() => {
    const onToggle = () => setOpen((o) => !o);
    window.addEventListener("zaidos:toggle-launcher", onToggle);
    return () => window.removeEventListener("zaidos:toggle-launcher", onToggle);
  }, []);

  // Block hotkeys while the modal is up; focus the input on open.
  useEffect(() => {
    setModalOpen(open);
    if (open) inputRef.current?.focus();
    return () => setModalOpen(false);
  }, [open]);

  // Escape closes from anywhere (input, grid, list).
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

  // Ranked results: all apps when the query is empty, fuzzy matches otherwise.
  const results = useMemo<LauncherEntry[]>(() => {
    const appEntry = (app: AppMeta): LauncherEntry => ({ kind: "app", app });
    const commandEntry = (command: LauncherCommand): LauncherEntry => ({
      kind: "command",
      command,
    });
    const trimmed = query.trim();
    if (trimmed === "") {
      return APPS.map(appEntry);
    }
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
    // Launcher keys must never leak to the window hotkey listener.
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length > 0) setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length > 0)
        setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[safeActive];
      if (entry) runEntry(entry);
    }
  };

  if (!open) return null;

  const gridMode = query.trim() === "";

  return (
    <>
      {/* click-away backdrop — also swallows right-clicks so they can never
          open the desktop context menu underneath */}
      <div
        data-testid="launcher-backdrop"
        className="fixed inset-0 z-[60]"
        onClick={close}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        data-testid="launcher"
        role="dialog"
        aria-label="App launcher"
        className="window-glass hairline fixed left-1/2 top-[15%] z-[70] w-[min(92vw,26rem)] -translate-x-1/2 rounded-xl font-mono"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onPanelKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-zaid-border px-3 py-2.5">
          <Search size={14} className="shrink-0 text-zaid-muted" aria-hidden="true" />
          <input
            ref={inputRef}
            data-testid="launcher-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search apps…"
            aria-label="Search apps"
            className="w-full bg-transparent text-sm text-zaid-text outline-none placeholder:text-zaid-muted"
          />
        </div>

        {gridMode ? (
          <div
            data-testid="launcher-grid"
            role="listbox"
            aria-label="Applications"
            className="grid grid-cols-4 gap-1 p-3"
          >
            {results.map((entry, i) => (
              <LauncherOption
                key={entryId(entry)}
                entry={entry}
                active={i === safeActive}
                onHover={() => setActive(i)}
                onRun={() => runEntry(entry)}
              />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p
            data-testid="launcher-empty"
            className="px-4 py-6 text-center text-xs text-zaid-muted"
          >
            No matches for “{query}”
          </p>
        ) : (
          <ul
            data-testid="launcher-list"
            role="listbox"
            aria-label="Results"
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
      </div>
    </>
  );
}

/** One result row/grid cell (role=option). */
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
      className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
        active
          ? "bg-zaid-accent/15 text-zaid-accent"
          : "text-zaid-text hover:bg-zaid-surface2"
      } ${id === "open-terminal" || id === "matrix-rain" ? "w-full" : "flex-col gap-1 py-2.5 text-center text-[11px]"}`}
    >
      {entryIcon(entry)}
      <span>{entryLabel(entry)}</span>
    </button>
  );
}
