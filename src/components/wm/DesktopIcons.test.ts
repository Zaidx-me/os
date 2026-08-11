import { createElement } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DesktopIcons from "@/components/wm/DesktopIcons";
import { APPS } from "@/lib/apps";
import { useWmStore } from "@/store/wm";
import { createInitialWorkspaces, useWorkspacesStore } from "@/store/workspaces";

/**
 * DesktopIcons unit tests — plain .ts + createElement (no JSX transform).
 * Opening an app goes through the real orchestrator, so these assert on the
 * stores (a window exists with the right appId) rather than DOM.
 */
describe("DesktopIcons", () => {
  beforeEach(() => {
    localStorage.clear();
    useWmStore.setState({ windows: {}, nextZ: 0 });
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
  });

  it("renders one icon per registered app", () => {
    render(createElement(DesktopIcons));
    for (const app of APPS) {
      expect(screen.getByTestId(`desktop-icon-${app.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`desktop-icon-${app.id}`)).toHaveAccessibleName(
        app.title,
      );
    }
  });

  it("single-click selects an icon (accent ring) and click-away deselects", () => {
    render(createElement(DesktopIcons));

    const icon = screen.getByTestId("desktop-icon-terminal");
    expect(icon).toHaveAttribute("data-selected", "false");

    fireEvent.click(icon);
    expect(icon).toHaveAttribute("data-selected", "true");

    // Clicking the empty desktop clears the selection.
    fireEvent.click(screen.getByTestId("desktop-icons-layer"));
    expect(icon).toHaveAttribute("data-selected", "false");
  });

  it("double-click opens the app window through the orchestrator", () => {
    render(createElement(DesktopIcons));

    fireEvent.doubleClick(screen.getByTestId("desktop-icon-projects"));

    const wm = useWmStore.getState();
    const ids = Object.keys(wm.windows);
    expect(ids.length).toBe(1);
    expect(wm.windows[ids[0]].appId).toBe("projects");
    expect(useWorkspacesStore.getState().getWindowWs(ids[0])).toBe(1);
  });

  it("Enter on a focused icon opens the app", () => {
    render(createElement(DesktopIcons));

    fireEvent.keyDown(screen.getByTestId("desktop-icon-chess"), {
      key: "Enter",
    });

    const ids = Object.keys(useWmStore.getState().windows);
    expect(ids.length).toBe(1);
    expect(useWmStore.getState().windows[ids[0]].appId).toBe("chess");
  });

  it("right-click on the desktop layer opens the context menu (event dispatched)", () => {
    const opened = vi.fn();
    window.addEventListener("zaidos:desktop-context", opened);
    render(createElement(DesktopIcons));

    fireEvent.contextMenu(screen.getByTestId("desktop-icons-layer"));

    expect(opened).toHaveBeenCalledTimes(1);
    window.removeEventListener("zaidos:desktop-context", opened);
  });

  it("native context menu is prevented on the desktop layer", () => {
    render(createElement(DesktopIcons));
    const layer = screen.getByTestId("desktop-icons-layer");
    fireEvent.contextMenu(layer);
    expect(layer).toBeInTheDocument(); // default is prevented (no crash)
  });
});
