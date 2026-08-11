"use client";

import { AnimatePresence } from "motion/react";
import { useShallow } from "zustand/react/shallow";
import Window from "@/components/wm/Window";
import { isVisible } from "@/lib/wm/selectors";
import { useWmStore } from "@/store/wm";
import {
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Renders the ACTIVE workspace's VISIBLE window stack as real window chrome
 * (todo 13 / 16).
 *
 * Each window id is a Window component keyed by its win-<n> id, animated in
 * with AnimatePresence (open scale+fade, close reverse). The list is filtered
 * through the shared isVisible selector: minimized windows leave the workspace
 * layer (the waybar task is their only representation, todo 16) and return on
 * restore. Windows render above the desktop icons (the layer is z-20,
 * pointer-events-none; each Window re-enables pointer events for its own
 * frame) and below the waybar.
 *
 * Performance: WorkspaceView subscribes to ONLY the minimized flags of this
 * workspace's windows (shallow-compared), never the full wm store — dragging
 * or resizing a window changes geometry but not those flags, so this list
 * (and every Window under it) does not re-render on every drag frame.
 *
 * Component only — reads both stores, never mutates them. Membership comes
 * from workspaces (todo 9); geometry from wm (todo 12). An exiting window is
 * kept mounted for its close animation by Window's own snapshot, so the store
 * drops it from both stores immediately and this list only carries the ids
 * that still belong to the active workspace.
 */
export function WorkspaceView() {
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { windows } = useWorkspacesStore(selectWorkspace(activeWs));

  // Reactive minimized flags for the workspace's windows. The selector output
  // is a shallow-compared record, so a store change that leaves every flag
  // unchanged (a drag, a raise, a title edit) does not re-render this view.
  const minimized = useWmStore(
    useShallow((s) => {
      const flags: Record<string, boolean> = {};
      for (const id of windows) {
        flags[id] = s.windows[id]?.minimized ?? true;
      }
      return flags;
    }),
  );

  const visible = windows.filter((id) => isVisible(id) && !minimized[id]);

  return (
    <div
      data-testid="workspace-view"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      {windows.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center p-4">
          <p data-testid="ws-empty-hint" className="font-mono text-sm text-zaid-muted">
            Nothing here yet. Press Super+Space
          </p>
        </div>
      ) : null}
      <AnimatePresence>
        {visible.map((id) => (
          <Window key={id} windowId={id} />
        ))}
      </AnimatePresence>
    </div>
  );
}
