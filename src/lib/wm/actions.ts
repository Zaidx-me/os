import { useWmStore, clampWindowBounds } from "@/store/wm";
import {
  useWorkspacesStore,
  type WorkspaceId,
} from "@/store/workspaces";

/**
 * WM orchestrators — the ONLY entry points that mutate BOTH stores.
 *
 * A window's geometry (wm.ts) and its workspace membership (workspaces.ts) are
 * two halves of one operation: a component must never call one store's
 * mutator without the other's in the SAME synchronous handler (React 19 batches
 * both into a single commit, so there is never an intermediate state where the
 * stores disagree). Hotkey/tile wiring (todos 14/16) must call these
 * orchestrators, never a raw store action.
 *
 *   openApp(id)            : workspaces.openInWorkspace THEN wm.open
 *   closeWindow(id)        : wm.close THEN workspaces.closeWindow (wm first so
 *                            close() can still read the closed window's owning
 *                            workspace for the next-highest-z promotion)
 *   moveWindowToWorkspace  : workspaces.moveWindow + wm raise/bounds
 *
 * The `win-<n>` id returned by workspaces.openInWorkspace is the join key
 * between the two stores.
 */

export { clampWindowBounds };

/**
 * Human-readable default title ("file-manager" -> "File Manager"). The app
 * registry (todo 15) supplies real titles once it lands.
 */
function defaultTitle(appId: string): string {
  return appId.replace(/[-_]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/** Opens an app: registers membership, then creates the window. Returns the win-<n> id. */
export function openApp(appId: string, ws?: WorkspaceId): string {
  const id = useWorkspacesStore.getState().openInWorkspace(appId, ws);
  useWmStore.getState().open({ id, appId, title: defaultTitle(appId) });
  return id;
}

/** Closes a window in both stores; focus falls back in the owning workspace. */
export function closeWindow(id: string): void {
  // Order matters: wm.close reads the owning workspace for its promotion logic.
  useWmStore.getState().close(id);
  useWorkspacesStore.getState().closeWindow(id);
}

/**
 * Focuses a window in both stores (workspaces.focused + wm raise/restore).
 * Clicking a window/titlebar/handle calls this — NEVER a raw store action.
 * Cross-workspace focus is refused: only the ACTIVE workspace can raise.
 */
export function focusWindow(id: string): void {
  const workspaces = useWorkspacesStore.getState();
  const owner = workspaces.getWindowWs(id);
  if (owner === null) return; // not open anywhere — safe no-op
  if (owner !== workspaces.activeWs) return; // cross-workspace raise forbidden
  workspaces.setFocused(id, owner);
  useWmStore.getState().focus(id);
}

/** Moves a window to another workspace and re-clamps/raises it (visible only). */
export function moveWindowToWorkspace(id: string, ws: WorkspaceId): void {
  useWorkspacesStore.getState().moveWindow(id, ws);
  const wm = useWmStore.getState();
  const win = wm.windows[id];
  if (win !== undefined) {
    // Re-clamp the size to the current viewport (defensive against shrinks).
    wm.setBounds(id, { w: win.w, h: win.h });
  }
  // Raise only when the window ends up VISIBLE (target ws === active ws):
  // cross-workspace raising is forbidden — wm.focus() enforces it too.
  const workspaces = useWorkspacesStore.getState();
  if (workspaces.getWindowWs(id) === workspaces.activeWs) {
    wm.focus(id);
  }
}
