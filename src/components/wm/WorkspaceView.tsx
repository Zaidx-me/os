"use client";

import {
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Renders the ACTIVE workspace's window stack. Windows themselves arrive in
 * todo 13 (window chrome); for now each window renders as a placeholder tile
 * keyed by its window id, and an empty workspace shows the launcher hint.
 *
 * Component only — the shell mounts it in a later todo. Pure view: it only
 * reads the workspaces store, never mutates it.
 */
export function WorkspaceView() {
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { windows } = useWorkspacesStore(selectWorkspace(activeWs));

  return (
    <div
      data-testid="workspace-view"
      className="relative h-full w-full overflow-hidden"
    >
      {windows.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center p-4">
          <p data-testid="ws-empty-hint" className="font-mono text-sm text-zaid-muted">
            Nothing here yet. Press Super+Space
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-[var(--gap-window)] p-[var(--gap-window)]">
          {windows.map((id) => (
            <div
              key={id}
              data-testid="ws-window"
              className="window-glass hairline flex h-40 w-64 items-center justify-center rounded-[var(--radius-window)] font-mono text-sm text-zaid-muted"
            >
              {id}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
