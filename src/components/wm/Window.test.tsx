import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import Window from "@/components/wm/Window";
import { openApp } from "@/lib/wm/actions";
import {
  getViewport,
  MAXIMIZE_GAP,
  snapBounds,
  SNAP_EDGE_ZONE,
  useWmStore,
  WAYBAR_H,
} from "@/store/wm";
import {
  createInitialWorkspaces,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Window chrome (todo 13) unit tests — rendered via createElement so the
 * component file stays .tsx (JSX is only transformed in .tsx). Windows are
 * created through the openApp orchestrator so both stores stay coherent.
 */

const wm = () => useWmStore.getState();
const ws = () => useWorkspacesStore.getState();

/** Opens a terminal window and renders its Window chrome. Returns its id. */
function setup(): string {
  let id = "";
  act(() => {
    id = openApp("terminal");
  });
  render(createElement(Window, { windowId: id }));
  return id;
}

beforeEach(() => {
  useWmStore.setState({ windows: {}, nextZ: 0 });
  useWorkspacesStore.setState({
    workspaces: createInitialWorkspaces(),
    activeWs: 1,
  });
});

describe("Window (window chrome)", () => {
  it("renders the titlebar, content area, and the three controls", () => {
    setup();
    expect(screen.getByTestId("window-terminal")).toBeInTheDocument();
    expect(screen.getByTestId("window-titlebar")).toBeInTheDocument();
    expect(screen.getByTestId("window-content")).toBeInTheDocument();
    expect(screen.getByTestId("window-minimize")).toBeInTheDocument();
    expect(screen.getByTestId("window-maximize")).toBeInTheDocument();
    expect(screen.getByTestId("window-close")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Terminal window" }),
    ).toBeInTheDocument();
  });

  it("exposes all 8 resize handles while floating", () => {
    setup();
    for (const dir of ["n", "s", "e", "w", "ne", "nw", "se", "sw"]) {
      expect(screen.getByTestId(`window-resize-${dir}`)).toBeInTheDocument();
    }
  });

  it("minimize hides the window with aria-hidden but keeps it mounted", () => {
    const id = setup();
    fireEvent.click(screen.getByTestId("window-minimize"));
    expect(wm().windows[id].minimized).toBe(true);
    const frame = screen.getByTestId("window-terminal");
    expect(frame).toHaveAttribute("aria-hidden", "true");
    expect(frame).toHaveAttribute("data-minimized", "true");
  });

  it("maximize toggles the flag and renders full-workspace bounds", () => {
    const id = setup();
    fireEvent.click(screen.getByTestId("window-maximize"));
    expect(wm().windows[id].maximized).toBe(true);
    // the store keeps the float bounds so restoring is lossless
    expect(wm().windows[id].w).toBe(640);
    const frame = screen.getByTestId("window-terminal");
    expect(frame).toHaveAttribute("data-maximized", "true");
    expect(frame).toHaveStyle({
      left: `${MAXIMIZE_GAP}px`,
      top: `${WAYBAR_H + MAXIMIZE_GAP}px`,
      width: "1008px",
      height: "712px",
    });
  });

  it("double-clicking the titlebar toggles maximize", () => {
    const id = setup();
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.doubleClick(titlebar);
    expect(wm().windows[id].maximized).toBe(true);
    fireEvent.doubleClick(titlebar);
    expect(wm().windows[id].maximized).toBe(false);
  });

  it("close removes the window from both stores", () => {
    const id = setup();
    fireEvent.click(screen.getByTestId("window-close"));
    expect(wm().windows[id]).toBeUndefined();
    expect(ws().getWindowWs(id)).toBeNull();
  });

  it("dragging the titlebar moves the window through the store", () => {
    const id = setup();
    const before = wm().windows[id];
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.pointerDown(titlebar, {
      clientX: before.x + 10,
      clientY: before.y + 10,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      clientX: before.x + 110,
      clientY: before.y + 70,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(wm().windows[id]).toMatchObject({
      x: before.x + 100,
      y: before.y + 60,
    });
  });

  it("dragging up clamps at the waybar (no snap inside the 40px band)", () => {
    const id = setup();
    const before = wm().windows[id];
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.pointerDown(titlebar, {
      clientX: before.x + 10,
      clientY: before.y + 10,
      pointerId: 1,
      buttons: 1,
    });
    // drop at exactly the waybar bottom — NOT inside the top snap band (y<40)
    fireEvent.pointerMove(window, {
      clientX: before.x + 10,
      clientY: WAYBAR_H,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(wm().windows[id].y).toBe(WAYBAR_H);
    expect(wm().windows[id].mode).toBe("float");
  });

  it("dragging to the very top edge snaps full (top 40px band)", () => {
    const id = setup();
    const before = wm().windows[id];
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.pointerDown(titlebar, {
      clientX: before.x + 10,
      clientY: before.y + 10,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      clientX: before.x + 10,
      clientY: 0,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(wm().windows[id].mode).toBe("tile");
    expect(wm().windows[id]).toMatchObject(snapBounds("full", getViewport()));
  });

  it("dragging into the left edge shows the preview and snaps on drop", () => {
    const id = setup();
    const before = wm().windows[id];
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.pointerDown(titlebar, {
      clientX: before.x + 10,
      clientY: before.y + 10,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      clientX: SNAP_EDGE_ZONE - 1,
      clientY: 300,
      pointerId: 1,
      buttons: 1,
    });
    const preview = screen.getByTestId("snap-preview");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveStyle({
      left: `${snapBounds("left", getViewport()).x}px`,
      width: `${snapBounds("left", getViewport()).w}px`,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(screen.queryByTestId("snap-preview")).not.toBeInTheDocument();
    expect(wm().windows[id].mode).toBe("tile");
    expect(wm().windows[id]).toMatchObject(snapBounds("left", getViewport()));
  });

  it("dropping away from an edge keeps the drag position (no snap)", () => {
    const id = setup();
    const before = wm().windows[id];
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.pointerDown(titlebar, {
      clientX: before.x + 10,
      clientY: before.y + 10,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      clientX: before.x + 110,
      clientY: before.y + 70,
      pointerId: 1,
      buttons: 1,
    });
    expect(screen.queryByTestId("snap-preview")).not.toBeInTheDocument();
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(wm().windows[id]).toMatchObject({
      x: before.x + 100,
      y: before.y + 60,
      mode: "float",
    });
  });

  it("dragging while maximized does NOT move the window (restore first)", () => {
    const id = setup();
    fireEvent.click(screen.getByTestId("window-maximize"));
    const before = { ...wm().windows[id] };
    const titlebar = screen.getByTestId("window-titlebar");
    fireEvent.pointerDown(titlebar, {
      clientX: before.x + 10,
      clientY: before.y + 10,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      clientX: before.x + 210,
      clientY: before.y + 110,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(wm().windows[id]).toMatchObject({
      x: before.x,
      y: before.y,
      w: before.w,
      h: before.h,
    });
  });

  it("SE-resize grows width and height", () => {
    const id = setup();
    const before = wm().windows[id];
    const handle = screen.getByTestId("window-resize-se");
    fireEvent.pointerDown(handle, {
      clientX: before.x + before.w,
      clientY: before.y + before.h,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerMove(window, {
      clientX: before.x + before.w + 100,
      clientY: before.y + before.h + 80,
      pointerId: 1,
      buttons: 1,
    });
    fireEvent.pointerUp(window, { pointerId: 1 });
    expect(wm().windows[id]).toMatchObject({
      x: before.x,
      y: before.y,
      w: before.w + 100,
      h: before.h + 80,
    });
  });

  it("clicking the window focuses it in both stores", () => {
    let a = "";
    let b = "";
    act(() => {
      a = openApp("terminal");
      b = openApp("chess");
    });
    render(createElement(Window, { windowId: a }));
    render(createElement(Window, { windowId: b }));

    const zBefore = wm().windows[a].z;
    fireEvent.pointerDown(screen.getByTestId("window-terminal"));
    expect(ws().workspaces[1].focused).toBe(a);
    expect(wm().windows[a].z).toBeGreaterThan(zBefore);
    expect(wm().windows[a].z).toBeGreaterThan(wm().windows[b].z);
  });
});
