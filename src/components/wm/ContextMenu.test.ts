import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import ContextMenu from "@/components/wm/ContextMenu";
import DesktopIcons from "@/components/wm/DesktopIcons";
import { WorkspaceView } from "@/components/wm/WorkspaceView";
import { openApp } from "@/lib/wm/actions";
import { useBootStore } from "@/store/boot";
import { useWmStore } from "@/store/wm";
import { useWallpaperStore } from "@/store/wallpaper";
import { createInitialWorkspaces, useWorkspacesStore } from "@/store/workspaces";

/** Opens the desktop context menu at a fixed position (client coords). */
function openMenu() {
  act(() => {
    window.dispatchEvent(
      new CustomEvent("zaidos:desktop-context", { detail: { x: 120, y: 140 } }),
    );
  });
}

describe("ContextMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    useWmStore.setState({ windows: {}, nextZ: 0 });
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
    useWallpaperStore.setState({ type: "matrix" });
    useBootStore.setState({ booted: true });
  });

  it("is closed until the desktop dispatches a context event", () => {
    render(createElement(ContextMenu));
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("opens on the desktop context event", () => {
    render(createElement(ContextMenu));
    openMenu();
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Desktop menu" })).toBeInTheDocument();
  });

  it("Open Terminal opens the terminal window and closes the menu", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.click(screen.getByTestId("context-menu-open-terminal"));

    const ids = Object.keys(useWmStore.getState().windows);
    expect(ids.length).toBe(1);
    expect(useWmStore.getState().windows[ids[0]].appId).toBe("terminal");
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("Change Wallpaper submenu switches the wallpaper and closes", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.click(screen.getByTestId("context-menu-wallpaper"));
    const submenu = screen.getByTestId("context-menu-wallpaper-submenu");
    expect(submenu).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("context-menu-wallpaper-dark"));

    expect(useWallpaperStore.getState().type).toBe("dark");
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("Escape closes the menu", () => {
    render(createElement(ContextMenu));
    openMenu();
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("click-away closes the menu", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.click(screen.getByTestId("context-menu-backdrop"));

    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("right-click-away closes the menu and never re-opens it", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.contextMenu(screen.getByTestId("context-menu-backdrop"));

    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });

  it("Reboot replays the boot sequence", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.click(screen.getByTestId("context-menu-reboot"));

    expect(useBootStore.getState().booted).toBe(false);
  });

  it("Shut down shows the joke dialog; Dismiss closes it", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.click(screen.getByTestId("context-menu-shutdown"));

    expect(screen.getByTestId("shutdown-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("shutdown-overlay")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("shutdown-dialog-dismiss"));
    expect(screen.queryByTestId("shutdown-dialog")).not.toBeInTheDocument();
  });

  it("Shut down dialog Reboot replays the boot sequence", () => {
    render(createElement(ContextMenu));
    openMenu();

    fireEvent.click(screen.getByTestId("context-menu-shutdown"));
    fireEvent.click(screen.getByTestId("shutdown-dialog-reboot"));

    expect(useBootStore.getState().booted).toBe(false);
  });

  it("right-click on an open window does NOT open the desktop menu", () => {
    render(
      createElement(
        "div",
        null,
        createElement(DesktopIcons),
        createElement(WorkspaceView),
        createElement(ContextMenu),
      ),
    );

    // Open a window so the workspace view renders a real window.
    act(() => {
      openApp("terminal");
    });
    const tile = screen.getByTestId("window-terminal");
    expect(tile).toHaveAttribute("data-app", "terminal");

    // Right-clicking the window tile must never surface the desktop menu.
    fireEvent.contextMenu(tile);
    expect(screen.queryByTestId("context-menu")).not.toBeInTheDocument();
  });
});
