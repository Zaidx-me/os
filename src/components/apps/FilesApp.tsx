"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChevronRight,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  Home,
  RefreshCw,
  Trash2,
} from "lucide-react";
import {
  OsAppShell,
  OsButton,
  OsPanel,
  OsStatusBar,
  OsToolbar,
} from "@/components/os";
import { osConfirm, osPrompt } from "@/lib/os/dialog";
import type { WindowAppProps } from "@/lib/apps";
import { HOME_PATH, type FsEntry } from "@/lib/shell/fakefs";
import { openBrowser } from "@/lib/wm/openBrowser";
import { bumpFilesystem, useFilesystemStore } from "@/store/filesystem";
import { pushNotification } from "@/store/notifications";

const PLACES: { label: string; path: string }[] = [
  { label: "Home", path: "~" },
  { label: "Desktop", path: "~/Desktop" },
  { label: "Documents", path: "~/Documents" },
  { label: "Downloads", path: "~/Downloads" },
  { label: "Pictures", path: "~/Pictures" },
  { label: "Projects", path: "~/projects" },
  { label: "Games", path: "~/games" },
];

function pathSegments(abs: string): { name: string; path: string }[] {
  if (abs === HOME_PATH) return [{ name: "~", path: "~" }];
  const rel = abs.startsWith(HOME_PATH + "/") ? abs.slice(HOME_PATH.length + 1) : abs;
  const parts = rel.split("/").filter(Boolean);
  const out: { name: string; path: string }[] = [{ name: "~", path: "~" }];
  let built = HOME_PATH;
  for (const part of parts) {
    built += `/${part}`;
    out.push({ name: part, path: built });
  }
  return out;
}

export function FilesApp(_props: WindowAppProps) {
  const navTick = useFilesystemStore((s) => s.navTick);
  const fs = useFilesystemStore((s) => s.fs);
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[] | null>(null);

  const pwd = fs.pwd();
  const entries = useMemo(() => fs.ls() ?? [], [fs, pwd, navTick]);
  const breadcrumbs = pathSegments(pwd);

  const navigate = useCallback(
    (target: string) => {
      const err = fs.cd(target);
      if (err) return;
      setSelected(null);
      setPreview(null);
      bumpFilesystem();
    },
    [fs],
  );

  const openEntry = useCallback(
    (entry: FsEntry) => {
      if (entry.type === "dir") {
        navigate(entry.name);
        return;
      }
      setSelected(entry.name);
      const result = fs.cat(entry.name);
      if (result.ok) setPreview(result.lines);
      else setPreview([result.reason === "missing" ? "File not found" : "Is a directory"]);
    },
    [fs, navigate],
  );

  const goUp = useCallback(() => {
    if (pwd === HOME_PATH) return;
    navigate("..");
  }, [navigate, pwd]);

  const newFolder = useCallback(async () => {
    const name = await osPrompt("Folder name", "new-folder", "New Folder");
    if (!name?.trim()) return;
    const err = fs.mkdir(name.trim());
    if (err) {
      pushNotification("Files", err);
      return;
    }
    bumpFilesystem();
    pushNotification("Folder created", name.trim());
  }, [fs]);

  const newFile = useCallback(async () => {
    const name = await osPrompt("File name", "notes.txt", "New File");
    if (!name?.trim()) return;
    const err = fs.touch(name.trim());
    if (err) {
      pushNotification("Files", err);
      return;
    }
    bumpFilesystem();
    pushNotification("File created", name.trim());
  }, [fs]);

  const deleteSelected = useCallback(async () => {
    if (!selected) return;
    const ok = await osConfirm(`Delete "${selected}"?`, "Delete");
    if (!ok) return;
    const err = fs.rm(selected);
    if (err) {
      pushNotification("Files", err);
      return;
    }
    setSelected(null);
    setPreview(null);
    bumpFilesystem();
    pushNotification("Deleted", selected);
  }, [fs, selected]);

  return (
    <OsAppShell
      testId="app-content-files"
      toolbar={
        <OsToolbar>
          <OsButton variant="icon" data-testid="files-home" aria-label="Home" onClick={() => navigate("~")}>
            <Home size={16} />
          </OsButton>
          <OsButton variant="icon" data-testid="files-up" aria-label="Up" onClick={goUp}>
            <ChevronRight size={16} className="-rotate-90" />
          </OsButton>
          <OsButton variant="icon" data-testid="files-refresh" aria-label="Refresh" onClick={() => bumpFilesystem()}>
            <RefreshCw size={16} />
          </OsButton>
          <OsButton variant="default" data-testid="files-new-folder" onClick={newFolder}>
            <FolderPlus size={14} />
            <span className="hidden sm:inline">New folder</span>
          </OsButton>
          <OsButton variant="default" data-testid="files-new-file" onClick={newFile}>
            <FilePlus size={14} />
            <span className="hidden sm:inline">New file</span>
          </OsButton>
          {selected && (
            <OsButton variant="danger" data-testid="files-delete" onClick={deleteSelected}>
              <Trash2 size={14} />
              <span className="hidden sm:inline">Delete</span>
            </OsButton>
          )}
          <nav
            data-testid="files-breadcrumb"
            className="ml-auto flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto text-zaid-muted"
            aria-label="Path"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} className="flex shrink-0 items-center gap-0.5">
                {i > 0 && <ChevronRight size={12} className="text-zaid-border" />}
                <button
                  type="button"
                  onClick={() => navigate(crumb.path === "~" ? "~" : crumb.path)}
                  className="truncate hover:text-zaid-accent"
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </nav>
        </OsToolbar>
      }
      statusBar={
        <OsStatusBar>
          <span>{entries.length} items</span>
          <span>{fs.promptPath()}</span>
        </OsStatusBar>
      }
    >
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-36 shrink-0 flex-col gap-0.5 border-r border-zaid-border/80 bg-zaid-surface2/40 p-2 sm:flex">
          <p className="label-caps mb-1 px-2">Places</p>
          {PLACES.map((place) => (
            <button
              key={place.path}
              type="button"
              data-testid={`files-place-${place.label.toLowerCase()}`}
              onClick={() => navigate(place.path)}
              className="truncate rounded-md px-2 py-1.5 text-left text-zaid-text hover:bg-zaid-bg/80"
            >
              {place.label}
            </button>
          ))}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            data-testid="files-list"
            className="grid min-h-0 flex-1 grid-cols-1 content-start gap-1 overflow-y-auto p-2 sm:grid-cols-2 lg:grid-cols-3"
          >
            {entries.map((entry) => (
              <button
                key={entry.name}
                type="button"
                data-testid={`files-entry-${entry.name}`}
                onClick={() => openEntry(entry)}
                onDoubleClick={() => entry.type === "dir" && openEntry(entry)}
                className={`bevel-out flex items-center gap-2 px-3 py-2 text-left hover:bg-zaid-surface2 ${
                  selected === entry.name ? "bg-zaid-accent text-white" : ""
                }`}
              >
                {entry.type === "dir" ? (
                  <Folder size={18} className="shrink-0 text-zaid-accent" />
                ) : (
                  <FileText size={18} className="shrink-0 text-zaid-accent" />
                )}
                <span className="truncate text-zaid-text">{entry.name}</span>
              </button>
            ))}
          </div>

          {preview !== null && (
            <div data-testid="files-preview" className="mx-2 mb-2 max-h-48 shrink-0">
              <OsPanel className="overflow-y-auto">
              <p className="label-caps mb-2">Preview — {selected}</p>
              <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-zaid-text">
                {preview.join("\n")}
              </pre>
              {selected?.endsWith(".md") && (
                <button
                  type="button"
                  className="mt-2 text-zaid-accent hover:underline"
                  onClick={() => openBrowser("https://github.com/zaidx-me")}
                >
                  Open related on GitHub →
                </button>
              )}
            </OsPanel>
            </div>
          )}
        </div>
      </div>
    </OsAppShell>
  );
}

export default FilesApp;
