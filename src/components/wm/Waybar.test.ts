import { createElement } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Waybar from "@/components/wm/Waybar";
import { useBootStore } from "@/store/boot";
import { createInitialWmState, useWmStore } from "@/store/wm";
import { createInitialWorkspaces, useWorkspacesStore } from "@/store/workspaces";

/**
 * Waybar unit tests — plain .ts (JSX does not transform in .ts files), so
 * every component render goes through `render(createElement(Waybar))`.
 *
 * jsdom setup: no Canvas 2D context (getContext returns null) and no
 * matchMedia. The canvas is stubbed with the no-op Proxy so the sparkline
 * runs its real lifecycle; usePrefersReducedMotion already guards matchMedia.
 */
let originalMatchMedia: typeof window.matchMedia | undefined;

/** jsdom has no Canvas 2D context — this Proxy answers any method call with
 *  a no-op and accepts any property set, so drawSparkline initializes (and
 *  its interval cleanups run) exactly like in a browser. */
function createCtxStub(): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = {};
  return new Proxy(target, {
    get: (_t, prop) => {
      if (prop in target) return target[prop];
      return () => undefined;
    },
    set: (t, prop, value) => {
      t[prop] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe("Waybar", () => {
  beforeEach(() => {
    localStorage.clear();
    useBootStore.setState({ booted: true });
    useWorkspacesStore.setState({
      workspaces: createInitialWorkspaces(),
      activeWs: 1,
    });
    useWmStore.setState(createInitialWmState());
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => createCtxStub(),
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalMatchMedia !== undefined || typeof window.matchMedia === "function") {
      if (originalMatchMedia === undefined) {
        delete (window as { matchMedia?: unknown }).matchMedia;
      } else {
        window.matchMedia = originalMatchMedia;
      }
      originalMatchMedia = undefined;
    }
  });

  it("renders 5 workspace pills with the term/proj/web/soc/game labels", () => {
    render(createElement(Waybar));
    const labels = ["term", "proj", "web", "soc", "game"];
    labels.forEach((label, i) => {
      const pill = screen.getByTestId(`waybar-pill-${i + 1}`);
      expect(pill).toHaveTextContent(label);
      expect(pill).toHaveAttribute("title", label);
    });
    expect(screen.queryByTestId("waybar-pill-6")).not.toBeInTheDocument();
  });

  it("marks the pill of the active workspace (and only that one)", () => {
    useWorkspacesStore.setState({ activeWs: 4 });
    render(createElement(Waybar));
    expect(screen.getByTestId("waybar-pill-4")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("waybar-pill-4")).toHaveAttribute("aria-pressed", "true");
    for (const ws of [1, 2, 3, 5]) {
      expect(screen.getByTestId(`waybar-pill-${ws}`)).toHaveAttribute(
        "data-active",
        "false",
      );
      expect(screen.getByTestId(`waybar-pill-${ws}`)).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    }
  });

  it("switches the active workspace when a pill is clicked", () => {
    render(createElement(Waybar));
    expect(useWorkspacesStore.getState().activeWs).toBe(1);

    fireEvent.click(screen.getByTestId("waybar-pill-3"));

    expect(useWorkspacesStore.getState().activeWs).toBe(3);
    expect(screen.getByTestId("waybar-pill-3")).toHaveAttribute("data-active", "true");
    expect(screen.getByTestId("waybar-pill-1")).toHaveAttribute("data-active", "false");
  });

  it("shows the clock in HH:MM plus the date", () => {
    vi.setSystemTime(new Date(2026, 7, 10, 14, 5, 0)); // Aug 10 2026, 14:05
    render(createElement(Waybar));

    expect(screen.getByTestId("waybar-clock")).toHaveTextContent("14:05");
    expect(screen.getByTestId("waybar-date")).toHaveTextContent(/Aug 10/);
  });

  it("tray values stay in [0,100] and keep oscillating (never stuck)", () => {
    render(createElement(Waybar));
    const tray = screen.getByTestId("waybar-tray");

    const sampleCpu = (): number => {
      const text = tray.textContent ?? "";
      const cpu = Number(text.match(/CPU (\d+)%/)?.[1]);
      const ram = Number(text.match(/RAM (\d+)%/)?.[1]);
      expect(Number.isInteger(cpu)).toBe(true);
      expect(Number.isInteger(ram)).toBe(true);
      expect(cpu).toBeGreaterThanOrEqual(0);
      expect(cpu).toBeLessThanOrEqual(100);
      expect(ram).toBeGreaterThanOrEqual(0);
      expect(ram).toBeLessThanOrEqual(100);
      return cpu;
    };

    const samples = [sampleCpu()];
    for (let i = 0; i < 2; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      samples.push(sampleCpu());
    }

    // demo values, not real metrics — they must move, not sit frozen.
    expect(new Set(samples).size).toBeGreaterThan(1);
  });

  it("ticks the uptime clock every second", () => {
    render(createElement(Waybar));
    expect(screen.getByTestId("waybar-uptime")).toHaveTextContent(/^up 0:00:0\d$/);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByTestId("waybar-uptime")).toHaveTextContent("up 0:00:05");
  });

  it("opens the power menu and closes it with Cancel", () => {
    render(createElement(Waybar));
    expect(screen.queryByTestId("power-menu")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("power-button"));
    expect(screen.getByTestId("power-menu")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("power-menu-cancel"));
    expect(screen.queryByTestId("power-menu")).not.toBeInTheDocument();
  });

  it("Reboot flips the boot store back to false", () => {
    useBootStore.setState({ booted: true });
    render(createElement(Waybar));

    fireEvent.click(screen.getByTestId("power-button"));
    fireEvent.click(screen.getByTestId("power-menu-reboot"));

    expect(useBootStore.getState().booted).toBe(false);
  });

  it("clears its intervals on unmount", () => {
    const clearSpy = vi.spyOn(window, "clearInterval");
    const { unmount } = render(createElement(Waybar));

    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
    // Advancing timers after unmount must not throw (intervals were cleared).
    act(() => {
      vi.advanceTimersByTime(3000);
    });
  });

  it("renders a task per open window on the active workspace (icon + title)", () => {
    const id = useWorkspacesStore.getState().openInWorkspace("terminal", 1);
    useWmStore.getState().open({ id, appId: "terminal", title: "Terminal" });
    render(createElement(Waybar));

    const task = screen.getByTestId("waybar-task-terminal");
    expect(task).toHaveAttribute("data-window", id);
    expect(task).toHaveAttribute("data-active", "true");
    expect(task).toHaveAttribute("data-minimized", "false");
    expect(task).toHaveTextContent("Terminal");
  });

  it("clicking the focused task minimizes the window (toggle) and dims the task", () => {
    const id = useWorkspacesStore.getState().openInWorkspace("terminal", 1);
    useWmStore.getState().open({ id, appId: "terminal", title: "Terminal" });
    render(createElement(Waybar));

    fireEvent.click(screen.getByTestId("waybar-task-terminal"));

    expect(useWmStore.getState().windows[id].minimized).toBe(true);
    expect(screen.getByTestId("waybar-task-terminal")).toHaveAttribute(
      "data-minimized",
      "true",
    );
  });

  it("clicking a background (non-focused) task focuses that window", () => {
    const termId = useWorkspacesStore.getState().openInWorkspace("terminal", 1);
    useWmStore.getState().open({ id: termId, appId: "terminal", title: "Terminal" });
    const chessId = useWorkspacesStore.getState().openInWorkspace("chess", 1);
    useWmStore.getState().open({ id: chessId, appId: "chess", title: "Chess" });
    render(createElement(Waybar));

    fireEvent.click(screen.getByTestId("waybar-task-terminal"));

    expect(useWorkspacesStore.getState().workspaces[1].focused).toBe(termId);
    expect(useWmStore.getState().windows[chessId].minimized).toBe(false);
  });
});
