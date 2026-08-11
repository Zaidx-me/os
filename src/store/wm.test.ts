import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  closeWindow,
  moveWindowToWorkspace,
  openApp,
} from "@/lib/wm/actions";
import {
  clampWindowBounds,
  dragBounds,
  maximizeBounds,
  MAXIMIZE_GAP,
  resizeBounds,
  useWmStore,
  VIEWPORT_MARGIN,
  WAYBAR_H,
} from "./wm";
import {
  createInitialWorkspaces,
  useWorkspacesStore,
  type WorkspaceId,
} from "./workspaces";

/**
 * Invariant tests for the window manager store (todo 12).
 *
 * Windows are created through the openApp orchestrator (workspaces + wm in one
 * synchronous handler — the real integration path), and the two stores are
 * reset together between tests (workspaces.test.ts pattern).
 *
 * KEY INVARIANTS PROVEN HERE:
 *  1. wm windows have NO workspace field — membership lives in workspaces only.
 *  2. z is monotonic; focus twice does NOT grow z unbounded.
 *  3. focus() refuses windows not in the ACTIVE workspace (no cross-ws raising).
 *  4. Closing the top window promotes the next-highest in the same workspace.
 *  5. setBounds clamps are viewport-capped (200x200 viewport -> 184x144).
 *  6. wm is session-only: no persist middleware (.persist key undefined).
 */

const wm = () => useWmStore.getState();
const ws = () => useWorkspacesStore.getState();

/** jsdom's default client viewport (restored between tests). */
const JSDOM_VIEWPORT = { vw: 1024, vh: 768 };

function setViewport(vw: number, vh: number): void {
  Object.defineProperty(window, "innerWidth", {
    value: vw,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, "innerHeight", {
    value: vh,
    configurable: true,
    writable: true,
  });
}

/** Window ids open in ANY workspace, in order (invariant helper). */
function allWindowIds(): string[] {
  const slots = useWorkspacesStore.getState().workspaces;
  return [1, 2, 3, 4, 5].flatMap((n) => slots[n as WorkspaceId].windows);
}

/** Invariant: every wm window has a workspace owner and vice versa (no orphans). */
function expectStoresCoherent(): void {
  const windows = wm().windows;
  for (const id of allWindowIds()) {
    expect(windows[id]).toBeDefined(); // membership always has geometry
    expect(ws().getWindowWs(id)).not.toBeNull();
  }
  for (const id of Object.keys(windows)) {
    expect(ws().getWindowWs(id)).not.toBeNull(); // geometry never dangles
  }
}

beforeEach(() => {
  useWmStore.setState({ windows: {}, nextZ: 0 });
  useWorkspacesStore.setState({
    workspaces: createInitialWorkspaces(),
    activeWs: 1,
  });
  setViewport(JSDOM_VIEWPORT.vw, JSDOM_VIEWPORT.vh);
});

afterEach(() => {
  setViewport(JSDOM_VIEWPORT.vw, JSDOM_VIEWPORT.vh);
});

describe("wm store — open", () => {
  it("creates a window with defaults and the next monotonic z", () => {
    const id = openApp("terminal");
    expect(wm().windows[id]).toEqual({
      id,
      appId: "terminal",
      title: "Terminal",
      x: Math.round((JSDOM_VIEWPORT.vw - 640) / 2),
      y: WAYBAR_H + Math.round((JSDOM_VIEWPORT.vh - WAYBAR_H - 480) / 2),
      w: 640,
      h: 480,
      z: 1,
      minimized: false,
      maximized: false,
      mode: "float",
    });
    expect(wm().nextZ).toBe(1);
  });

  it("assigns strictly increasing z and never persists", () => {
    const a = openApp("terminal");
    const b = openApp("files");
    expect(wm().windows[b].z).toBeGreaterThan(wm().windows[a].z);
    expect(wm().nextZ).toBe(2);
    // session-only by construction: plain store has no persist key
    expect(
      (useWmStore as unknown as { persist?: unknown }).persist,
    ).toBeUndefined();
  });

  it("clamps the default size on a small viewport", () => {
    setViewport(200, 200);
    const id = openApp("terminal");
    expect(wm().windows[id].w).toBe(184); // Math.min(360, 200-16)
    expect(wm().windows[id].h).toBe(144); // Math.min(240, 200-40-16)
    expectStoresCoherent();
  });
});

describe("wm store — focus", () => {
  it("raises z above the other windows", () => {
    const a = openApp("terminal");
    const b = openApp("files"); // b is top (z 2)
    wm().focus(a);
    expect(wm().windows[a].z).toBeGreaterThan(wm().windows[b].z);
    expect(wm().nextZ).toBe(3);
  });

  it("focus twice does NOT grow z unbounded", () => {
    const a = openApp("terminal");
    openApp("files");
    wm().focus(a); // raise a to the top
    const zAfterRaise = wm().windows[a].z;
    wm().focus(a); // already top -> no-op
    expect(wm().windows[a].z).toBe(zAfterRaise);
    expect(wm().nextZ).toBe(zAfterRaise);
  });

  it("refuses windows not in the active workspace", () => {
    const a = openApp("terminal", 1);
    const b = openApp("chess", 2); // active ws is 1
    const zBefore = wm().windows[b].z;
    const nextZBefore = wm().nextZ;
    wm().focus(b); // b lives in ws 2 -> must be refused
    expect(wm().windows[b].z).toBe(zBefore);
    expect(wm().nextZ).toBe(nextZBefore);
    expect(wm().windows[a].z).toBeLessThan(zBefore);
  });

  it("restores a minimized window and raises it", () => {
    const id = openApp("terminal");
    wm().minimize(id);
    expect(wm().windows[id].minimized).toBe(true);
    wm().focus(id);
    expect(wm().windows[id].minimized).toBe(false);
    expect(wm().windows[id].z).toBe(wm().nextZ);
  });
});

describe("wm store — minimize", () => {
  it("preserves all window state while hiding it", () => {
    const id = openApp("terminal");
    wm().setBounds(id, { x: 12, y: 88, w: 500, h: 300 });
    wm().minimize(id);
    expect(wm().windows[id]).toMatchObject({
      minimized: true,
      id,
      appId: "terminal",
      title: "Terminal",
      x: 12,
      y: 88,
      w: 500,
      h: 300,
      mode: "float",
      maximized: false,
    });
  });
});

describe("wm store — toggleMaximize", () => {
  it("toggles the maximized flag", () => {
    const id = openApp("terminal");
    expect(wm().windows[id].maximized).toBe(false);
    wm().toggleMaximize(id);
    expect(wm().windows[id].maximized).toBe(true);
    wm().toggleMaximize(id);
    expect(wm().windows[id].maximized).toBe(false);
  });
});

describe("wm store — setBounds / clampWindowBounds", () => {
  it("clamps to the 360x240 minimum on a normal viewport", () => {
    expect(clampWindowBounds({ w: 50, h: 50 }, { vw: 1280, vh: 800 })).toEqual({
      w: 360,
      h: 240,
    });
  });

  it("viewport-caps the minimum on a 200x200 viewport (184x144, not 360x240)", () => {
    expect(clampWindowBounds({ w: 100, h: 100 }, { vw: 200, vh: 200 })).toEqual({
      w: 184, // Math.min(360, 200-16)
      h: 144, // Math.min(240, 200-40-16)
    });
  });

  it("setBounds(100,100) on a 200x200 viewport yields a fitting rect", () => {
    const id = openApp("terminal");
    setViewport(200, 200);
    wm().setBounds(id, { w: 100, h: 100 });
    expect(wm().windows[id].w).toBe(184);
    expect(wm().windows[id].h).toBe(144);
  });

  it("setBounds keeps position when only size is given", () => {
    const id = openApp("terminal");
    wm().setBounds(id, { x: 20, y: 60 });
    expect(wm().windows[id]).toMatchObject({ x: 20, y: 60 });
    wm().setBounds(id, { w: 800, h: 600 });
    expect(wm().windows[id]).toMatchObject({ x: 20, y: 60 });
  });

  it("reclampToViewport shrinks oversized windows after a viewport change", () => {
    const id = openApp("terminal"); // 640x480
    setViewport(200, 200);
    wm().reclampToViewport();
    expect(wm().windows[id].w).toBe(184);
    expect(wm().windows[id].h).toBe(144);
  });

  it("reclampToViewport is a no-op on an unchanged viewport", () => {
    const id = openApp("terminal");
    const before = wm().windows[id];
    wm().reclampToViewport();
    expect(wm().windows[id]).toEqual(before);
    expect(wm().nextZ).toBe(1); // no state churn at all
  });
});

describe("wm geometry helpers — maximize/drag/resize (todo 13)", () => {
  const VP = { vw: 1440, vh: 900 };
  const FLOAT = { x: 120, y: 120, w: 640, h: 480 };

  it("maximizeBounds fills the workspace minus waybar and 8px gutter", () => {
    expect(maximizeBounds(VP)).toEqual({
      x: MAXIMIZE_GAP,
      y: WAYBAR_H + MAXIMIZE_GAP,
      w: VP.vw - MAXIMIZE_GAP * 2,
      h: VP.vh - WAYBAR_H - MAXIMIZE_GAP * 2,
    });
  });

  it("dragBounds translates freely inside the viewport", () => {
    expect(dragBounds(FLOAT, 50, 30, VP)).toEqual({ x: 170, y: 150 });
  });

  it("dragBounds clamps above the waybar and inside the viewport", () => {
    expect(dragBounds(FLOAT, -200, -500, VP)).toEqual({ x: 0, y: WAYBAR_H });
    expect(dragBounds(FLOAT, 10_000, 10_000, VP)).toEqual({
      x: VP.vw - FLOAT.w,
      y: VP.vh - FLOAT.h,
    });
  });

  it("SE resize grows width and height", () => {
    expect(resizeBounds(FLOAT, "se", 100, 80, VP)).toEqual({
      x: 120,
      y: 120,
      w: 740,
      h: 560,
    });
  });

  it("NW resize keeps the SE corner anchored", () => {
    expect(resizeBounds(FLOAT, "nw", -100, -80, VP)).toEqual({
      x: 20,
      y: 40,
      w: 740,
      h: 560,
    });
  });

  it("resize clamps to the 360x240 minimum", () => {
    const result = resizeBounds(FLOAT, "nw", 400, 400, VP);
    expect(result.w).toBe(360);
    expect(result.h).toBe(240);
    expect(result.x).toBe(FLOAT.x + (FLOAT.w - 360));
    expect(result.y).toBe(FLOAT.y + (FLOAT.h - 240));
  });
});

describe("wm store — setMode", () => {
  it("switches tile <-> float", () => {
    const id = openApp("terminal");
    expect(wm().windows[id].mode).toBe("float");
    wm().setMode(id, "tile");
    expect(wm().windows[id].mode).toBe("tile");
    wm().setMode(id, "float");
    expect(wm().windows[id].mode).toBe("float");
  });
});

describe("wm store — close", () => {
  it("removes the window; unknown ids are a safe no-op", () => {
    const id = openApp("terminal");
    wm().close(id);
    expect(wm().windows[id]).toBeUndefined();
    wm().close("win-999");
    expect(wm().windows).toEqual({});
  });

  it("closing the top window promotes the next-highest in the same workspace", () => {
    const a = openApp("terminal");
    const b = openApp("files");
    const c = openApp("chess"); // top: z 3
    closeWindow(c);
    expect(wm().windows[c]).toBeUndefined();
    // b becomes top — no dangling focus, no z gap
    expect(wm().windows[b].z).toBe(wm().nextZ);
    expect(wm().windows[b].z).toBeGreaterThan(wm().windows[a].z);
    expect(ws().workspaces[1].focused).toBe(b);
    expectStoresCoherent();
  });

  it("closing a non-top window leaves the top untouched", () => {
    const a = openApp("terminal");
    const b = openApp("files"); // top: z 2
    closeWindow(a);
    expect(wm().windows[a]).toBeUndefined();
    expect(wm().windows[b].z).toBe(wm().nextZ);
    expect(wm().windows[b].z).toBe(2);
  });
});

describe("lib/wm/actions — orchestrators (both stores, same synchronous handler)", () => {
  it("openApp registers the SAME win-<n> id in both stores", () => {
    const id = openApp("files");
    expect(id).toMatch(/^win-\d+$/);
    expect(ws().getWindowWs(id)).toBe(1);
    expect(wm().windows[id].id).toBe(id);
    expect(wm().windows[id].appId).toBe("files");
    expect(wm().windows[id].title).toBe("Files");
    expectStoresCoherent();
  });

  it("closeWindow removes the window from BOTH stores", () => {
    const [a, b, c] = [openApp("terminal"), openApp("files"), openApp("chess")];
    closeWindow(b);
    expect(ws().getWindowWs(b)).toBeNull();
    expect(wm().windows[b]).toBeUndefined();
    expect(ws().getWindowWs(a)).toBe(1);
    expect(wm().windows[a]).toBeDefined();
    expect(ws().getWindowWs(c)).toBe(1);
    expect(wm().windows[c]).toBeDefined();
    expectStoresCoherent();
  });

  it("moveWindowToWorkspace relocates membership and re-clamps bounds", () => {
    const id = openApp("terminal", 1);
    const other = openApp("files", 1); // second window stays in ws 1 (top)
    setViewport(200, 200);
    moveWindowToWorkspace(id, 2); // active ws stays 1
    expect(ws().getWindowWs(id)).toBe(2);
    expect(ws().workspaces[2].windows).toEqual([id]);
    expect(ws().workspaces[1].windows).toEqual([other]);
    // bounds re-clamped to the 200x200 viewport
    expect(wm().windows[id].w).toBe(184);
    expect(wm().windows[id].h).toBe(144);
    // NOT raised: window ended up in an inactive workspace, so it stays below top
    expect(wm().windows[id].z).toBeLessThan(wm().nextZ);
    expectStoresCoherent();
  });

  it("moveWindowToWorkspace raises when the target workspace is active", () => {
    const a = openApp("terminal", 1);
    const b = openApp("files", 1); // top: z 2
    moveWindowToWorkspace(a, 2); // target ws 2 != active 1 -> stays unraised
    const zAfterMove = wm().windows[a].z;
    expect(zAfterMove).toBeLessThan(wm().nextZ);
    // b keeps the top of the active workspace through the move
    expect(wm().windows[b].z).toBe(wm().nextZ);
    // focus a while ws 2 is active raises it to the top
    ws().setActive(2);
    wm().focus(a);
    expect(wm().windows[a].z).toBe(wm().nextZ);
    expect(wm().windows[a].z).toBeGreaterThan(zAfterMove);
    expectStoresCoherent();
  });

  it("keeps the stores coherent through a mixed open/move/close sequence", () => {
    const a = openApp("terminal", 1);
    const b = openApp("chess", 3);
    const c = openApp("files", 2);
    moveWindowToWorkspace(b, 1);
    moveWindowToWorkspace(c, 5);
    closeWindow(a);
    expectStoresCoherent();
    const remaining = Object.keys(wm().windows);
    expect(remaining.sort()).toEqual([b, c].sort());
    expect(ws().getWindowWs(b)).toBe(1);
    expect(ws().getWindowWs(c)).toBe(5);
    // every open window stays within its viewport-capped size
    for (const id of remaining) {
      expect(wm().windows[id].w).toBeLessThanOrEqual(JSDOM_VIEWPORT.vw - VIEWPORT_MARGIN);
      expect(wm().windows[id].h).toBeLessThanOrEqual(JSDOM_VIEWPORT.vh - WAYBAR_H - VIEWPORT_MARGIN);
    }
  });
});
