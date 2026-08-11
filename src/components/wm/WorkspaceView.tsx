"use client";

import { useWmStore } from "@/store/wm";
import {
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Renders the ACTIVE workspace's window stack. Windows themselves arrive in
 * todo 13 (window chrome); for now each window renders as a placeholder tile
 * keyed by its window id, labelled with its appId (data-app — the pre-chrome
 * proxy for the window-<appId> testid that todo 13's chrome introduces). Tiles
 * stop right-click propagation so the desktop context menu never opens from
 * inside a window (todo 10 acceptance).
 *
 * Component only — reads both stores, never mutates them.
 */
export function WorkspaceView() {
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { windows } = useWorkspacesStore(selectWorkspace(activeWs));
  // Stable snapshot — an inline map here would churn a new array every render.
  const windowsState = useWmStore((s) => s.windows);
  const appIds = windows.map((id) => windowsState[id]?.appId ?? id);

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
      ) : (
        <div className="flex flex-wrap gap-[var(--gap-window)] p-[var(--gap-window)]">
          {windows.map((id, i) => (
            <div
              key={id}
              data-testid="ws-window"
              data-window
              data-app={appIds[i]}
              onContextMenu={(e) => e.stopPropagation()}
              className="window-glass hairline pointer-events-auto flex h-40 w-64 items-center justify-center rounded-[var(--radius-window)] font-mono text-sm text-zaid-muted"
            >
              {appIds[i]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
