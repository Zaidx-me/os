import { beforeEach, describe, expect, it } from "vitest";
import { isVisible } from "@/lib/wm/selectors";
import { createInitialWmState, useWmStore } from "@/store/wm";
import {
  createInitialWorkspaces,
  useWorkspacesStore,
  type WorkspaceId,
} from "@/store/workspaces";

/** Opens a window through both stores (the orchestrator contract). */
function seedWindow(appId: string, ws: WorkspaceId = 1, title?: string): string {
  const id = useWorkspacesStore.getState().openInWorkspace(appId, ws);
  useWmStore.getState().open({ id, appId, title: title ?? appId });
  return id;
}

describe("isVisible (lib/wm/selectors.ts)", () => {
  beforeEach(() => {
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
    useWmStore.setState(createInitialWmState());
  });

  it("is false for a window id that is not open anywhere", () => {
    expect(isVisible("win-999")).toBe(false);
  });

  it("is true for a normal window in the active workspace", () => {
    const id = seedWindow("terminal");
    expect(isVisible(id)).toBe(true);
  });

  it("is false once the window is minimized", () => {
    const id = seedWindow("terminal");
    useWmStore.getState().minimize(id);
    expect(isVisible(id)).toBe(false);
  });

  it("is false for a window on a non-active workspace", () => {
    const id = seedWindow("chess", 2);
    expect(isVisible(id)).toBe(false);
  });

  it("tracks the ACTIVE workspace: switching makes the window visible", () => {
    const id = seedWindow("chess", 2);
    expect(isVisible(id)).toBe(false);
    useWorkspacesStore.getState().setActive(2);
    expect(isVisible(id)).toBe(true);
  });
});
