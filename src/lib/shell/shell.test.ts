import { describe, expect, it } from "vitest";
import {
  articles,
  experience,
  projects,
  site,
  skillGroups,
  socials,
} from "@/content";
import { README_CONTENT } from "./fakefs";
import type { ShellContext } from "./registry";
import { SUDOERS_JOKE, createShell } from "./shell";

/** A real wired context (content data layer + no-op actions). */
function makeCtx(): ShellContext {
  return {
    openApp: () => {},
    data: { site, projects, skillGroups, experience, socials, articles },
    wallpaper: () => {},
    launcher: () => {},
  };
}

describe("shell run (todo 24)", () => {
  it("QA happy: run('ls') lists the ~ entries", () => {
    const shell = createShell();
    expect(shell.run("ls", makeCtx())).toEqual([
      "README.md",
      "dotfiles/",
      "games/",
      "projects/",
    ]);
  });

  it("QA failure: run('sudo nope') returns the sudoers joke", () => {
    const shell = createShell();
    expect(shell.run("sudo nope", makeCtx())).toEqual([SUDOERS_JOKE]);
  });

  it("unknown command returns the not-found line plus the help hint", () => {
    const shell = createShell();
    expect(shell.run("nosuchcmd --flag", makeCtx())).toEqual([
      "zsh: command not found: nosuchcmd",
      "Type 'help' to see what I can do",
    ]);
  });

  it("empty and whitespace-only input produce no output", () => {
    const shell = createShell();
    expect(shell.run("", makeCtx())).toEqual([]);
    expect(shell.run("   ", makeCtx())).toEqual([]);
  });

  it("cd changes the directory for later commands (state persists)", () => {
    const shell = createShell();
    expect(shell.run("cd projects", makeCtx())).toEqual([]);
    expect(shell.run("pwd", makeCtx())).toEqual(["/home/zaid/projects"]);
    expect(shell.run("ls", makeCtx())).toEqual(["applicator/", "whatbot/"]);
    expect(shell.run("cd ..", makeCtx())).toEqual([]);
    expect(shell.run("pwd", makeCtx())).toEqual(["/home/zaid"]);
  });

  it("cd reports the zsh-style error for missing paths", () => {
    const shell = createShell();
    expect(shell.run("cd nosuch", makeCtx())).toEqual([
      "cd: no such file or directory: nosuch",
    ]);
  });

  it("cat reads the home README through the fake fs", () => {
    const shell = createShell();
    expect(shell.run("cat README.md", makeCtx())).toEqual(
      README_CONTENT.split("\n"),
    );
  });

  it("cat errors for directories and missing files", () => {
    const shell = createShell();
    expect(shell.run("cat projects", makeCtx())).toEqual([
      "cat: projects: Is a directory",
    ]);
    expect(shell.run("cat nope.txt", makeCtx())).toEqual([
      "cat: nope.txt: No such file or directory",
    ]);
  });

  it("clear emits the ANSI clear-screen escape", () => {
    const shell = createShell();
    expect(shell.run("clear", makeCtx())).toEqual(["\x1b[2J"]);
  });

  it("help lists the registered commands", () => {
    const shell = createShell();
    const out = shell.run("help", makeCtx());
    expect(out.length).toBeGreaterThan(0);
    for (const name of ["help", "clear", "ls", "cd", "pwd", "cat", "sudo"]) {
      expect(out.some((line) => line.startsWith(name))).toBe(true);
    }
  });

  it("records every non-empty input in history, in order", () => {
    const shell = createShell();
    shell.run("ls", makeCtx());
    shell.run("cd projects", makeCtx());
    shell.run("pwd", makeCtx());
    shell.run("   ", makeCtx());
    expect([...shell.history]).toEqual(["ls", "cd projects", "pwd"]);
  });

  it("completes command names by prefix", () => {
    const shell = createShell();
    expect(shell.complete("c")).toEqual(["cat", "cd", "clear"]);
    expect(shell.complete("l")).toEqual(["ls"]);
    expect(shell.complete("su")).toEqual(["sudo"]);
  });

  it("completes fs paths for ls/cd/cat", () => {
    const shell = createShell();
    expect(shell.complete("ls pro")).toEqual(["projects/"]);
    expect(shell.complete("cd g")).toEqual(["games/"]);
    expect(shell.complete("cat READ")).toEqual(["README.md"]);
    expect(shell.complete("cd ")).toEqual([
      "README.md",
      "dotfiles/",
      "games/",
      "projects/",
    ]);
  });

  it("completes nothing for a command without a completer", () => {
    const shell = createShell();
    expect(shell.complete("sudo ro")).toEqual([]);
  });
});
