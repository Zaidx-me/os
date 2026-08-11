"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { setModalOpen } from "@/lib/hotkeys";
import { focusWindow } from "@/lib/wm/actions";
import { isVisible } from "@/lib/wm/selectors";
import { useWmStore, type WindowState } from "@/store/wm";
import {
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Mod+Tab window switcher overlay (todo 16).
 *
 * Opens in response to `zaidos:toggle-switcher`, dispatched by the Mod+Tab
 * hotkey handler (wired in the shell). Lists ONLY the active workspace's
 * VISIBLE windows (minimized excluded), topmost (highest z) first, each with
 * its app icon + title. Native Alt+Tab is never used — Mod+Tab only.
 *
 * Keyboard: ArrowUp/ArrowDown moves the active row (wrapping), Enter focuses
 * the selected window, Escape dismisses. Modal: while open it calls
 * setModalOpen(true) (blocks the global hotkeys, matching the Launcher) and
 * covers the desktop with a click-away backdrop, so no keystrokes or clicks
 * can reach the windows below.
 *
 * With zero visible windows the overlay never appears (auto-dismisses), so
 * Mod+Tab on an empty workspace is a silent no-op.
 */
export default function Switcher() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { windows } = useWorkspacesStore(selectWorkspace(activeWs));
  const wmWindows = useWmStore((s) => s.windows);

  const close = useCallback(() => setOpen(false), []);

  // Mod+Tab hotkey handler (page.tsx) dispatches this event.
  useEffect(() => {
    const onToggle = () => {
      setOpen((o) => !o);
      setActive(0);
    };
    window.addEventListener("zaidos:toggle-switcher", onToggle);
    return () => window.removeEventListener("zaidos:toggle-switcher", onToggle);
  }, []);

  // Block hotkeys while the modal is up (same contract as the Launcher).
  useEffect(() => {
    setModalOpen(open);
    return () => setModalOpen(false);
  }, [open]);

  // Visible active-workspace windows, topmost (highest z) first.
  const entries = useMemo<WindowState[]>(() => {
    return windows
      .map((id) => wmWindows[id])
      .filter(
        (win): win is WindowState => win !== undefined && isVisible(win.id),
      )
      .sort((a, b) => b.z - a.z);
  }, [windows, wmWindows]);

  // Nothing to switch to (workspace empty or every window minimized): never
  // show an empty overlay. Adjusting state during render (not in an effect)
  // keeps `open` synced without a cascading setState-in-effect.
  if (open && entries.length === 0) {
    setOpen(false);
  }

  const safeActive = Math.min(active, Math.max(0, entries.length - 1));

  // The overlay owns every keystroke while open. The listener runs in the
  // CAPTURE phase and swallows the event (preventDefault + stopPropagation),
  // so keys never leak to whatever still holds DOM focus underneath — e.g. a
  // desktop icon button whose Enter handler would re-open its app on top (the
  // todo-16 e2e caught exactly that). An Effect Event keeps the handler
  // reading the freshest open/entries/safeActive without writing a ref during
  // render.
  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (!open) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      if (entries.length > 0) setActive((a) => (a + 1) % entries.length);
    } else if (e.key === "ArrowUp") {
      if (entries.length > 0) {
        setActive((a) => (a - 1 + entries.length) % entries.length);
      }
    } else if (e.key === "Enter") {
      const entry = entries[safeActive];
      if (entry) {
        focusWindow(entry.id);
        close();
      }
    }
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, []);

  if (!open || entries.length === 0) return null;

  return (
    <>
      {/* click-away backdrop — also swallows right-clicks so they can never
          open the desktop context menu underneath */}
      <div
        data-testid="switcher-backdrop"
        className="fixed inset-0 z-[60]"
        onClick={close}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div
        data-testid="switcher"
        role="dialog"
        aria-label="Window switcher"
        className="window-glass hairline fixed left-1/2 top-[18%] z-[70] w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl p-2 font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        <ul
          role="listbox"
          aria-label="Windows"
          className="flex flex-col gap-0.5"
        >
          {entries.map((win, i) => {
            const selected = i === safeActive;
            return (
              <li key={win.id}>
                <button
                  type="button"
                  role="option"
                  data-testid={`switcher-option-${win.appId}`}
                  data-window={win.id}
                  data-active={selected ? "true" : "false"}
                  aria-selected={selected}
                  onMouseMove={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    focusWindow(win.id);
                    close();
                  }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-zaid-accent/15 text-zaid-accent"
                      : "text-zaid-text hover:bg-zaid-surface2"
                  }`}
                >
                  <AppIcon appId={win.appId} size={16} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{win.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-1 border-t border-zaid-border px-2 pt-1.5 text-[10px] text-zaid-muted">
          ↑↓ select · ↵ open · esc dismiss
        </p>
      </div>
    </>
  );
}
