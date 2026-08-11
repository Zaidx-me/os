import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import Launcher from "@/components/wm/Launcher";
import { setModalOpen, isModalOpen } from "@/lib/hotkeys";
import { useWmStore } from "@/store/wm";
import { useWallpaperStore } from "@/store/wallpaper";
import { createInitialWorkspaces, useWorkspacesStore } from "@/store/workspaces";

/** Toggles the launcher exactly like the waybar button / Mod+Space hotkey. */
function toggleLauncher() {
  act(() => {
    window.dispatchEvent(new CustomEvent("zaidos:toggle-launcher"));
  });
}

describe("Launcher", () => {
  beforeEach(() => {
    localStorage.clear();
    setModalOpen(false);
    useWmStore.setState({ windows: {}, nextZ: 0 });
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
    useWallpaperStore.setState({ type: "dark" });
  });

  it("is closed until the toggle event fires", () => {
    render(createElement(Launcher));
    expect(screen.queryByTestId("launcher")).not.toBeInTheDocument();
  });

  it("opens on the toggle event and focuses its input", () => {
    render(createElement(Launcher));
    toggleLauncher();

    expect(screen.getByTestId("launcher")).toBeInTheDocument();
    expect(screen.getByTestId("launcher-input")).toHaveFocus();
  });

  it("empty query renders every app as a grid", () => {
    render(createElement(Launcher));
    toggleLauncher();

    expect(screen.getByTestId("launcher-grid")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(11);
  });

  it("typing 'term' ranks Terminal first", () => {
    render(createElement(Launcher));
    toggleLauncher();

    fireEvent.change(screen.getByTestId("launcher-input"), {
      target: { value: "term" },
    });

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("data-testid", "launcher-result-terminal");
  });

  it("Enter runs the active result — 'chess' opens the chess window", () => {
    render(createElement(Launcher));
    toggleLauncher();

    fireEvent.change(screen.getByTestId("launcher-input"), {
      target: { value: "chess" },
    });
    fireEvent.keyDown(screen.getByTestId("launcher-input"), { key: "Enter" });

    const ids = Object.keys(useWmStore.getState().windows);
    expect(ids.length).toBe(1);
    expect(useWmStore.getState().windows[ids[0]].appId).toBe("chess");
    expect(screen.queryByTestId("launcher")).not.toBeInTheDocument();
  });

  it("ArrowDown/ArrowUp move the active option", () => {
    render(createElement(Launcher));
    toggleLauncher();

    fireEvent.change(screen.getByTestId("launcher-input"), {
      target: { value: "term" },
    });
    const input = screen.getByTestId("launcher-input");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute(
      "data-active",
      "true",
    );

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(screen.getAllByRole("option")[0]).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("'matrix' command switches the wallpaper", () => {
    expect(useWallpaperStore.getState().type).toBe("dark");
    render(createElement(Launcher));
    toggleLauncher();

    fireEvent.change(screen.getByTestId("launcher-input"), {
      target: { value: "matrix" },
    });
    fireEvent.keyDown(screen.getByTestId("launcher-input"), { key: "Enter" });

    expect(useWallpaperStore.getState().type).toBe("matrix");
    expect(screen.queryByTestId("launcher")).not.toBeInTheDocument();
  });

  it("Escape closes the launcher", () => {
    render(createElement(Launcher));
    toggleLauncher();
    expect(screen.getByTestId("launcher")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(screen.queryByTestId("launcher")).not.toBeInTheDocument();
  });

  it("click-away closes the launcher", () => {
    render(createElement(Launcher));
    toggleLauncher();

    fireEvent.click(screen.getByTestId("launcher-backdrop"));

    expect(screen.queryByTestId("launcher")).not.toBeInTheDocument();
  });

  it("blocks hotkeys while open (modal flag)", () => {
    render(createElement(Launcher));
    toggleLauncher();
    expect(isModalOpen()).toBe(true);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(isModalOpen()).toBe(false);
  });

  it("no matches renders the empty state", () => {
    render(createElement(Launcher));
    toggleLauncher();

    fireEvent.change(screen.getByTestId("launcher-input"), {
      target: { value: "zzzz" },
    });

    expect(screen.getByTestId("launcher-empty")).toBeInTheDocument();
  });
});
