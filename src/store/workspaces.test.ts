import {
  act,
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { WorkspaceView } from "@/components/wm/WorkspaceView";
import { openApp } from "@/lib/wm/actions";
import { useWmStore } from "./wm";
import {
  createInitialWorkspaces,
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
  WORKSPACE_IDS,
  WORKSPACE_LABELS,
  workspaceLabel,
  type WorkspaceId,
} from "./workspaces";

/**
 * Invariant tests for the workspaces store (todo 9). Tests drive the store
 * through plain action calls on `useWorkspacesStore.getState()` — no hooks —
 * and reset state between tests with setState + createInitialWorkspaces().
 *
 * CRITICAL INVARIANTS PROVEN HERE:
 *  1. A window exists in EXACTLY ONE workspace at all times.
 *  2. closeWindow removes only from the owning workspace.
 *  3. Closing the focused window moves focus to the next remaining window.
 *  4. moveWindow relocates without duplication and updates focus.
 *  5. Empty workspace renders the launcher hint.
 */

const state = () => useWorkspacesStore.getState();

/** Opens `count` windows in `ws` (default: the current active workspace). */
function open(ws?: WorkspaceId, count = 1): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(state().openInWorkspace("terminal", ws));
  }
  return ids;
}

/** Every window id across all workspaces, in order. */
function allWindows(): string[] {
  return WORKSPACE_IDS.flatMap(
    (ws) => useWorkspacesStore.getState().workspaces[ws].windows,
  );
}

/** Asserts invariant #1: no duplicates, every listed id resolves to an owner. */
function expectExactlyOneWorkspace(): void {
  const ids = allWindows();
  const unique = new Set(ids);
  expect(unique.size).toBe(ids.length); // no window in 2+ workspaces
  for (const id of ids) {
    expect(state().getWindowWs(id)).not.toBeNull(); // no window in zero workspaces
  }
}

beforeEach(() => {
  useWorkspacesStore.setState({
    workspaces: createInitialWorkspaces(),
    activeWs: 1,
  });
});

describe("workspaces store — workspace constants", () => {
  it("defines 5 workspaces 1-5 with term/proj/web/soc/game labels", () => {
    expect(WORKSPACE_IDS).toEqual([1, 2, 3, 4, 5]);
    expect(WORKSPACE_LABELS).toEqual(["term", "proj", "web", "soc", "game"]);
    expect(workspaceLabel(1)).toBe("term");
    expect(workspaceLabel(2)).toBe("proj");
    expect(workspaceLabel(3)).toBe("web");
    expect(workspaceLabel(4)).toBe("soc");
    expect(workspaceLabel(5)).toBe("game");
  });

  it("starts with empty slots, activeWs=1, and is never persisted", () => {
    for (const ws of WORKSPACE_IDS) {
      expect(state().workspaces[ws]).toEqual({ windows: [], focused: null });
    }
    expect(state().activeWs).toBe(1);
    // session-only by construction: no persist middleware wired (the plain
    // store type has no `persist` key — the cast proves it at runtime too)
    expect(
      (useWorkspacesStore as unknown as { persist?: unknown }).persist,
    ).toBeUndefined();
  });
});

describe("workspaces store — openInWorkspace", () => {
  it("returns monotonic unique win-<n> ids in the active workspace by default", () => {
    const ids = open(undefined, 3);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    for (const id of ids) {
      expect(id).toMatch(/^win-\d+$/);
      expect(state().getWindowWs(id)).toBe(1); // activeWs is 1
    }
    expect(state().workspaces[1].windows).toEqual(ids);
    expectExactlyOneWorkspace();
  });

  it("opens into an explicit workspace and keeps ids globally unique", () => {
    const a = open(1)[0];
    const b = open(4)[0];
    const c = open(5)[0];
    expect(state().getWindowWs(a)).toBe(1);
    expect(state().getWindowWs(b)).toBe(4);
    expect(state().getWindowWs(c)).toBe(5);
    expect(state().workspaces[1].windows).toEqual([a]);
    expectExactlyOneWorkspace();
  });

  it("sets the newly opened window focused", () => {
    const [a, b] = open(2, 2);
    expect(state().workspaces[2].focused).toBe(b);
    expect(state().workspaces[2].focused).not.toBe(a);
  });

  it("setActive switches the active workspace and openInWorkspace follows it", () => {
    state().setActive(3);
    expect(state().activeWs).toBe(3);
    expect(selectActiveWs(state())).toBe(3);
    const id = open()[0];
    expect(state().getWindowWs(id)).toBe(3);
  });

  it("setActive ignores invalid workspace numbers", () => {
    state().setActive(7 as WorkspaceId);
    expect(state().activeWs).toBe(1);
  });
});

describe("workspaces store — closeWindow", () => {
  it("removes the window only from its owning workspace", () => {
    const [a] = open(1);
    const [b] = open(2);
    const [c] = open(3);
    state().closeWindow(b);
    expect(state().getWindowWs(b)).toBeNull();
    expect(state().workspaces[2].windows).not.toContain(b);
    expect(state().workspaces[2]).toEqual({ windows: [], focused: null });
    expect(state().workspaces[1].windows).toEqual([a]);
    expect(state().workspaces[3].windows).toEqual([c]);
    expectExactlyOneWorkspace();
  });

  it("closing the focused window moves focus to the next remaining window", () => {
    const [a, b, c] = open(1, 3);
    expect(state().workspaces[1].focused).toBe(c);
    state().closeWindow(b); // middle, non-focused: focus untouched
    expect(state().workspaces[1].focused).toBe(c);
    state().closeWindow(c); // focused, was last -> focus falls to last remaining
    expect(state().workspaces[1].windows).toEqual([a]);
    expect(state().workspaces[1].focused).toBe(a);
    state().closeWindow(a); // last window -> focus null
    expect(state().workspaces[1].windows).toEqual([]);
    expect(state().workspaces[1].focused).toBeNull();
  });

  it("focus falls to the window that followed the closed one", () => {
    const [a, b, c] = open(1, 3);
    state().closeWindow(b);
    // b was in the middle: the next window c becomes focused
    expect(state().workspaces[1].windows).toEqual([a, c]);
    expect(state().workspaces[1].focused).toBe(c);
    state().closeWindow(a);
    // closing the focused (a) with one left: focus falls to the remaining c
    expect(state().workspaces[1].focused).toBe(c);
  });

  it("is a safe no-op for unknown window ids", () => {
    const before = allWindows();
    state().closeWindow("win-999");
    expect(allWindows()).toEqual(before);
    expectExactlyOneWorkspace();
  });
});

describe("workspaces store — moveWindow", () => {
  it("relocates without duplication and updates focus in both workspaces", () => {
    const [a, b] = open(1, 2);
    state().moveWindow(b, 3);
    expect(state().workspaces[1].windows).toEqual([a]);
    expect(state().workspaces[3].windows).toEqual([b]);
    expect(state().getWindowWs(b)).toBe(3);
    // focus: new workspace -> b; old workspace's focused b falls back to a
    expect(state().workspaces[3].focused).toBe(b);
    expect(state().workspaces[1].focused).toBe(a);
    // globally unique, exactly one occurrence
    expect(allWindows().filter((w) => w === b)).toHaveLength(1);
    expectExactlyOneWorkspace();
  });

  it("moving a non-focused window leaves the source focus untouched", () => {
    const [a, b] = open(1, 2); // focused = b
    state().moveWindow(a, 2);
    expect(state().workspaces[1].focused).toBe(b);
    expect(state().workspaces[2].windows).toEqual([a]);
    expectExactlyOneWorkspace();
  });

  it("moving into the same workspace does not duplicate the window", () => {
    const [a] = open(1);
    state().moveWindow(a, 1);
    expect(state().workspaces[1].windows).toEqual([a]);
    expect(state().workspaces[1].focused).toBe(a);
    expectExactlyOneWorkspace();
  });

  it("appends to the target list and ignores invalid target workspaces", () => {
    const [a, b] = open(1, 2);
    state().moveWindow(a, 3);
    state().moveWindow(b, 3);
    expect(state().workspaces[3].windows).toEqual([a, b]);
    expect(state().workspaces[3].focused).toBe(b);
    state().moveWindow(a, 7 as WorkspaceId); // invalid -> no-op
    expect(state().workspaces[3].windows).toEqual([a, b]);
    expectExactlyOneWorkspace();
  });
});

describe("workspaces store — focusNextInWs", () => {
  it("cycles focus within the workspace's ordered list", () => {
    const [a, b, c] = open(1, 3); // focused = c
    state().focusNextInWs(1);
    expect(state().workspaces[1].focused).toBe(a); // wraps c -> a
    state().focusNextInWs(1);
    expect(state().workspaces[1].focused).toBe(b);
    state().focusNextInWs(1);
    expect(state().workspaces[1].focused).toBe(c);
  });

  it("is a safe no-op on an empty workspace", () => {
    state().focusNextInWs(2);
    expect(state().workspaces[2].focused).toBeNull();
  });
});

describe("workspaces store — setFocused", () => {
  it("marks a member window as focused in its workspace", () => {
    const [a, b] = open(1, 2); // focused = b
    state().setFocused(a);
    expect(state().workspaces[1].focused).toBe(a);
    state().setFocused(b, 1);
    expect(state().workspaces[1].focused).toBe(b);
  });

  it("is a safe no-op for ids that are not members of the target workspace", () => {
    const [a] = open(1, 1);
    state().setFocused(a, 2); // a lives in ws 1
    expect(state().workspaces[2].focused).toBeNull();
    state().setFocused("win-999");
    expect(state().workspaces[1].focused).toBe(a);
  });
});

describe("workspaces store — getWindowWs / selectors", () => {
  it("returns null for ids that are not open anywhere", () => {
    expect(state().getWindowWs("win-999")).toBeNull();
    expect(state().getWindowWs("nope")).toBeNull();
  });

  it("selectWorkspace(ws) returns the workspace's window list + focused", () => {
    const [a, b] = open(2, 2);
    const slot = selectWorkspace(2)(state());
    expect(slot.windows).toEqual([a, b]);
    expect(slot.focused).toBe(b);
  });
});

describe("workspaces store — invariant: exactly one workspace", () => {
  it("holds through a mixed sequence of open/close/move/focus operations", () => {
    const [a, b] = open(1);
    const [c] = open(2);
    const [d] = open(5);
    expectExactlyOneWorkspace();

    state().moveWindow(b, 4);
    expectExactlyOneWorkspace();

    state().closeWindow(c);
    expectExactlyOneWorkspace();

    state().closeWindow(a);
    expectExactlyOneWorkspace();

    state().moveWindow(d, 1);
    expectExactlyOneWorkspace();

    state().focusNextInWs(4);
    state().focusNextInWs(1);
    expectExactlyOneWorkspace();

    state().setActive(3);
    open(undefined, 2);
    expectExactlyOneWorkspace();
  });
});

describe("WorkspaceView (window chrome)", () => {
  beforeEach(() => {
    useWmStore.setState({ windows: {}, nextZ: 0 });
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
  });

  it("renders the launcher hint on an empty active workspace", () => {
    render(createElement(WorkspaceView));
    expect(screen.getByTestId("ws-empty-hint")).toHaveTextContent(
      "Nothing here yet. Press ⌘Space",
    );
  });

  it("renders only the active workspace's windows as real chrome", async () => {
    act(() => {
      openApp("terminal", 1);
      openApp("chess", 1);
      openApp("chat", 2); // other workspace: must NOT render
    });
    const { rerender } = render(createElement(WorkspaceView));
    expect(screen.getByTestId("window-terminal")).toBeInTheDocument();
    expect(screen.getByTestId("window-chess")).toBeInTheDocument();
    expect(screen.queryByTestId("window-chat")).toBeNull();

    // switching the active workspace swaps which windows render
    act(() => state().setActive(2));
    rerender(createElement(WorkspaceView));
    expect(screen.getByTestId("window-chat")).toBeInTheDocument();
    await waitForElementToBeRemoved(() => screen.getByTestId("window-terminal"));

    // empty workspace shows the hint again
    act(() => state().setActive(3));
    rerender(createElement(WorkspaceView));
    await waitForElementToBeRemoved(() => screen.getByTestId("window-chat"));
    expect(screen.getByTestId("ws-empty-hint")).toBeInTheDocument();
  });
});
