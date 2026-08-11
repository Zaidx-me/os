import { beforeEach, describe, expect, it, vi } from "vitest";
import { openApp } from "@/lib/wm/actions";
import { toggleAppFromDock } from "@/lib/wm/dock-actions";
import { useWmStore } from "@/store/wm";
import { useWorkspacesStore } from "@/store/workspaces";

vi.mock("@/lib/wm/genie", () => ({
  playGenieMinimize: vi.fn(async () => undefined),
}));

describe("toggleAppFromDock", () => {
  beforeEach(() => {
    useWmStore.setState({ windows: {}, nextZ: 0 });
    useWorkspacesStore.setState(useWorkspacesStore.getInitialState());
  });

  it("opens the app when it is not running", () => {
    toggleAppFromDock("terminal");
    const ws = useWorkspacesStore.getState();
    expect(ws.workspaces[ws.activeWs].windows.length).toBe(1);
  });

  it("focuses a background window instead of opening a duplicate", () => {
    const a = openApp("terminal");
    openApp("browser");
    useWorkspacesStore.getState().setFocused(a);
    useWmStore.getState().focus(a);
    toggleAppFromDock("browser");
    expect(useWorkspacesStore.getState().workspaces[1].focused).not.toBe(a);
  });

  it("minimizes the frontmost visible window when clicked again", async () => {
    const id = openApp("music");
    useWorkspacesStore.getState().setFocused(id);
    useWmStore.getState().focus(id);
    await toggleAppFromDock("music");
    expect(useWmStore.getState().windows[id]?.minimized).toBe(true);
  });

  it("restores a minimized window", () => {
    const id = openApp("photos");
    useWmStore.getState().minimize(id);
    toggleAppFromDock("photos");
    expect(useWmStore.getState().windows[id]?.minimized).toBe(false);
  });
});
