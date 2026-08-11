import { useWmStore } from "@/store/wm";
import { useWorkspacesStore } from "@/store/workspaces";

/**
 * The ONE visibility rule for window ids — the single source of truth for "is
 * this window on screen right now?". Everything that decides what a window's
 * on-screen presence looks like imports THIS selector instead of recomputing
 * membership + minimized on its own:
 *
 *   - WorkspaceView       renders only visible windows of the active workspace
 *   - Waybar task section dims tasks that are not visible (minimized)
 *   - Switcher (Mod+Tab)  lists only visible windows
 *   - close-focus-fallback (actions.ts) never leaves focus on a hidden window
 *
 * A window is visible iff it belongs to the ACTIVE workspace's ordered list
 * and its wm state exists and is not minimized. Closed windows, windows on
 * another workspace, and minimized windows are all invisible.
 */
export function isVisible(winId: string): boolean {
  const workspaces = useWorkspacesStore.getState();
  const slot = workspaces.workspaces[workspaces.activeWs];
  if (!slot.windows.includes(winId)) return false;
  const win = useWmStore.getState().windows[winId];
  return win !== undefined && !win.minimized;
}
