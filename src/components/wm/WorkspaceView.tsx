"use client";

import { AnimatePresence } from "motion/react";
import Window from "@/components/wm/Window";
import {
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Renders the ACTIVE workspace's window stack as real window chrome (todo 13).
 *
 * Each window id is a Window component keyed by its win-<n> id, animated in
 * with AnimatePresence (open scale+fade, close reverse). Windows render above
 * the desktop icons (the layer is z-20, pointer-events-none; each Window
 * re-enables pointer events for its own frame) and below the waybar.
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
        {windows.map((id) => (
          <Window key={id} windowId={id} />
        ))}
      </AnimatePresence>
    </div>
  );
}
