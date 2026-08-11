import type { AppId } from "@/components/ui/AppIcon";
import { openApp, focusWindow } from "@/lib/wm/actions";
import { playGenieMinimize } from "@/lib/wm/genie";
import { isVisible } from "@/lib/wm/selectors";
import { useWmStore } from "@/store/wm";
import { useWorkspacesStore } from "@/store/workspaces";

function appWindowsInActiveWs(appId: string): string[] {
  const ws = useWorkspacesStore.getState();
  const slot = ws.workspaces[ws.activeWs];
  const wm = useWmStore.getState().windows;
  return slot.windows.filter((id) => wm[id]?.appId === appId);
}

function findDockButton(appId: string): HTMLElement | null {
  return document.querySelector(`[data-dock-app="${appId}"]`);
}

function findWindowEl(windowId: string): HTMLElement | null {
  return document.querySelector(`[data-window="${windowId}"]`);
}

/**
 * macOS dock click semantics:
 * - not running → open
 * - running, background → focus
 * - running, frontmost → genie minimize
 * - all minimized → restore + focus
 */
export async function toggleAppFromDock(
  appId: AppId,
  dockButton?: HTMLElement | null,
): Promise<void> {
  const ids = appWindowsInActiveWs(appId);
  if (ids.length === 0) {
    openApp(appId);
    return;
  }

  const ws = useWorkspacesStore.getState();
  const slot = ws.workspaces[ws.activeWs];
  const visibleId = ids.find((id) => isVisible(id));

  if (visibleId !== undefined && slot.focused === visibleId) {
    const winEl = findWindowEl(visibleId);
    const dockEl = dockButton ?? findDockButton(appId);
    if (winEl && dockEl) {
      await playGenieMinimize(winEl, dockEl);
    }
    useWmStore.getState().minimize(visibleId);
    return;
  }

  if (visibleId !== undefined) {
    focusWindow(visibleId);
    return;
  }

  focusWindow(ids[0]!);
}
