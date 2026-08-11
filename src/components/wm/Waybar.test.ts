import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Waybar from "@/components/wm/Waybar";
import { useBootStore } from "@/store/boot";
import { createInitialWmState, useWmStore } from "@/store/wm";
import { createInitialWorkspaces, useWorkspacesStore } from "@/store/workspaces";

describe("Waybar", () => {
  beforeEach(() => {
    localStorage.clear();
    useBootStore.setState({ booted: true });
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
    useWmStore.setState(createInitialWmState());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders brand, menus, Spotlight icon, clock, and systray", () => {
    render(createElement(Waybar));
    expect(screen.getByTestId("waybar-brand")).toBeInTheDocument();
    expect(screen.getByTestId("waybar-menus")).toBeInTheDocument();
    expect(screen.getByTestId("waybar-spotlight")).toBeInTheDocument();
    expect(screen.getByTestId("waybar-clock")).toBeInTheDocument();
    expect(screen.getByTestId("waybar-systray")).toBeInTheDocument();
    expect(screen.getByTestId("waybar-control-center")).toBeInTheDocument();
  });

  it("opens About when the brand is clicked", () => {
    render(createElement(Waybar));
    fireEvent.click(screen.getByTestId("waybar-brand"));
    const ids = Object.values(useWmStore.getState().windows);
    expect(ids.some((w) => w.appId === "about")).toBe(true);
  });

  it("shows the clock in HH:MM plus the date", () => {
    vi.setSystemTime(new Date(2026, 7, 10, 14, 5, 0));
    render(createElement(Waybar));

    expect(screen.getByTestId("waybar-clock")).toHaveTextContent("14:05");
    expect(screen.getByTestId("waybar-date")).toHaveTextContent(/Aug 10/);
  });

  it("opens the power menu and closes it with Cancel", () => {
    render(createElement(Waybar));
    fireEvent.click(screen.getByTestId("power-button"));
    expect(screen.getByTestId("power-menu")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("power-menu-cancel"));
    expect(screen.queryByTestId("power-menu")).not.toBeInTheDocument();
  });

  it("renders a task per open window on the active workspace", () => {
    const id = useWorkspacesStore.getState().openInWorkspace("terminal", 1);
    useWmStore.getState().open({ id, appId: "terminal", title: "Terminal" });
    render(createElement(Waybar));

    expect(screen.getByTestId("waybar-task-terminal")).toHaveAttribute("data-window", id);
  });

  it("clears its intervals on unmount", () => {
    const clearSpy = vi.spyOn(window, "clearInterval");
    const { unmount } = render(createElement(Waybar));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });
});
