import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TerminalApp from "@/components/apps/TerminalApp";

/**
 * Terminal (terminal) UI tests (todo 24 acceptance): the boot banner types
 * out with green [ OK ] markers; typing ls + Enter lists the fake-fs home
 * entries (QA happy); sudo nope returns the sudoers joke (QA failure);
 * unknown commands get the zsh not-found line; history walks with
 * ArrowUp/ArrowDown; clear wipes the screen; Tab completes; the whole
 * typewriter is instant under prefers-reduced-motion.
 */
describe("TerminalApp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Drains the typewriter queue (12ms per line) inside an act. */
  async function advance(ms: number) {
    await act(async () => {
      vi.advanceTimersByTime(ms);
    });
  }

  /** Type a line into the hidden input and press Enter. */
  function typeLine(input: HTMLElement, text: string) {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter" });
  }

  it("renders the boot banner with green [ OK ] markers and the prompt", async () => {
    render(<TerminalApp />);
    await advance(500);
    const root = screen.getByTestId("app-content-terminal");
    expect(root).toHaveTextContent("[ OK ] ZaidOS shell v0.1");
    expect(root).toHaveTextContent("Shell ready.");
    expect(root).toHaveTextContent("zaid@zaidos:~$");
    const greens = screen.getAllByText("[ OK ]");
    expect(greens.length).toBe(2);
    for (const green of greens) {
      expect(green).toHaveClass("text-zaid-accent");
    }
  });

  it("QA happy: typing ls and Enter lists the ~ entries", async () => {
    render(<TerminalApp />);
    await advance(500); // drain boot banner
    typeLine(screen.getByTestId("terminal-input"), "ls");
    await advance(500);
    const root = screen.getByTestId("app-content-terminal");
    expect(root).toHaveTextContent("README.md");
    expect(root).toHaveTextContent("dotfiles/");
    expect(root).toHaveTextContent("games/");
    expect(root).toHaveTextContent("projects/");
  });

  it("QA failure: sudo nope returns the sudoers joke", async () => {
    render(<TerminalApp />);
    await advance(500);
    typeLine(screen.getByTestId("terminal-input"), "sudo nope");
    await advance(500);
    expect(screen.getByTestId("app-content-terminal")).toHaveTextContent(
      "zaid is not in the sudoers file",
    );
  });

  it("unknown commands get the zsh not-found line and the help hint", async () => {
    render(<TerminalApp />);
    await advance(500);
    typeLine(screen.getByTestId("terminal-input"), "nosuchcmd");
    await advance(500);
    const root = screen.getByTestId("app-content-terminal");
    expect(root).toHaveTextContent("zsh: command not found: nosuchcmd");
    expect(root).toHaveTextContent("Type 'help' to see what I can do");
  });

  it("ArrowUp/ArrowDown walks the history in order", async () => {
    render(<TerminalApp />);
    await advance(500);
    const input = screen.getByTestId("terminal-input");
    typeLine(input, "ls");
    typeLine(input, "pwd");
    await advance(500);

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("pwd");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveValue("ls");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("pwd");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveValue("");
  });

  it("clear wipes every line and leaves a fresh prompt", async () => {
    render(<TerminalApp />);
    await advance(500);
    const input = screen.getByTestId("terminal-input");
    typeLine(input, "ls");
    await advance(500);
    const root = screen.getByTestId("app-content-terminal");
    expect(root).toHaveTextContent("projects/");

    typeLine(input, "clear");
    await advance(500);
    expect(root).not.toHaveTextContent("projects/");
    expect(root).not.toHaveTextContent("README.md");
    expect(root).toHaveTextContent("zaid@zaidos:~$");
  });

  it("Tab completes a unique command name", async () => {
    render(<TerminalApp />);
    await advance(500);
    const input = screen.getByTestId("terminal-input");
    fireEvent.change(input, { target: { value: "su" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input).toHaveValue("sudo ");
  });

  it("clicking the terminal focuses the hidden input", () => {
    render(<TerminalApp />);
    const input = screen.getByTestId("terminal-input");
    input.blur();
    expect(input).not.toHaveFocus();
    fireEvent.mouseDown(screen.getByTestId("app-content-terminal"));
    expect(input).toHaveFocus();
  });

  it("renders boot lines instantly under prefers-reduced-motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    render(<TerminalApp />);
    act(() => {
      vi.runAllTimers();
    });
    expect(screen.getByTestId("app-content-terminal")).toHaveTextContent(
      "[ OK ] ZaidOS shell v0.1",
    );
  });
});
