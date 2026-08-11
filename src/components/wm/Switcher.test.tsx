import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import Switcher from "@/components/wm/Switcher";
import { createInitialWmState, useWmStore } from "@/store/wm";
import {
  createInitialWorkspaces,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * Switcher unit tests — plain .tsx renders go through `render(<Switcher />)`
 * (JSX transforms fine in .tsx). The component is always mounted but returns
 * null until the `zaidos:toggle-switcher` event fires.
 */

/** Opens two windows on workspace 1 (terminal first, then chess on top). */
function seedTwoWindows(): { terminalId: string; chessId: string } {
  const terminalId = useWorkspacesStore
    .getState()
    .openInWorkspace("terminal", 1);
  useWmStore.getState().open({ id: terminalId, appId: "terminal", title: "Terminal" });
  const chessId = useWorkspacesStore.getState().openInWorkspace("chess", 1);
  useWmStore.getState().open({ id: chessId, appId: "chess", title: "Chess" });
  return { terminalId, chessId };
}

/** Dispatches the toggle event the Mod+Tab hotkey handler sends. */
function toggle() {
  act(() => {
    window.dispatchEvent(new CustomEvent("zaidos:toggle-switcher"));
  });
}

describe("Switcher (Mod+Tab overlay)", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
    useWmStore.setState(createInitialWmState());
  });

  it("renders nothing until the toggle event fires", () => {
    render(createElement(Switcher));
    expect(screen.queryByTestId("switcher")).not.toBeInTheDocument();
  });

  it("lists visible active-workspace windows topmost-first", () => {
    seedTwoWindows();
    render(createElement(Switcher));
    toggle();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveAttribute("data-testid", "switcher-option-chess");
    expect(options[1]).toHaveAttribute("data-testid", "switcher-option-terminal");
    expect(screen.getByTestId("switcher-option-chess")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("excludes minimized windows", () => {
    const { terminalId } = seedTwoWindows();
    act(() => useWmStore.getState().minimize(terminalId));
    render(createElement(Switcher));
    toggle();
    expect(screen.getByTestId("switcher-option-chess")).toBeInTheDocument();
    expect(screen.queryByTestId("switcher-option-terminal")).not.toBeInTheDocument();
  });

  it("Arrows move the active row; Enter focuses the chosen window and closes", () => {
    const { terminalId } = seedTwoWindows();
    render(createElement(Switcher));
    toggle();
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.getByTestId("switcher-option-terminal")).toHaveAttribute(
      "data-active",
      "true",
    );
    fireEvent.keyDown(window, { key: "Enter" });
    expect(useWorkspacesStore.getState().workspaces[1].focused).toBe(terminalId);
    expect(screen.queryByTestId("switcher")).not.toBeInTheDocument();
  });

  it("Escape dismisses without changing focus", () => {
    const { chessId } = seedTwoWindows();
    render(createElement(Switcher));
    toggle();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("switcher")).not.toBeInTheDocument();
    expect(useWorkspacesStore.getState().workspaces[1].focused).toBe(chessId);
  });

  it("never opens an empty overlay (no visible windows)", () => {
    render(createElement(Switcher));
    toggle();
    expect(screen.queryByTestId("switcher")).not.toBeInTheDocument();
  });
});
