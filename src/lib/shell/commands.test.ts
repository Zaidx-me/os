import { describe, expect, it, vi } from "vitest";
import {
  articles,
  experience,
  projects,
  site,
  skillGroups,
  socials,
} from "@/content";
import { SUDO_RM_JOKE, SUDOERS_JOKE, sudoHandler } from "./commands";
import type { ShellContext } from "./registry";
import { createShell } from "./shell";
import { FakeFs } from "./fakefs";

function freshShell() {
  return createShell(new FakeFs());
}

function makeCtx(overrides: Partial<ShellContext> = {}): ShellContext {
  return {
    openApp: vi.fn(),
    data: { site, projects, skillGroups, experience, socials, articles },
    wallpaper: vi.fn(),
    launcher: vi.fn(),
    ...overrides,
  };
}

describe("content commands (todo 25)", () => {
  it("help lists every registered command", () => {
    const shell = freshShell();
    const out = shell.run("help", makeCtx());
    expect(out.length).toBeGreaterThan(0);
    for (const name of [
      "about",
      "projects",
      "skills",
      "experience",
      "contact",
      "socials",
      "whoami",
      "date",
      "echo",
      "clear",
      "exit",
      "open",
      "ls",
      "cd",
      "pwd",
      "cat",
      "history",
      "sudo",
      "help",
    ]) {
      expect(out.some((line) => line.startsWith(name))).toBe(true);
    }
  });

  it("projects output contains applicator, whatbot, and maktaba from the data layer", () => {
    const shell = freshShell();
    const out = shell.run("projects", makeCtx()).join("\n");
    expect(out).toContain("applicator");
    expect(out).toContain("whatbot");
    expect(out).toContain("maktaba");
    expect(out).toContain("[live]");
  });

  it("projects prints all 12 project ids", () => {
    const shell = freshShell();
    const out = shell.run("projects", makeCtx());
    expect(out).toHaveLength(12);
    for (const id of [
      "applicator",
      "whatbot",
      "maktaba",
      "media-cleaner",
      "pu-stacks",
      "zesho",
      "zenith-build",
      "tower-defense",
      "tank-arena",
      "movies-api",
      "kens-pk",
      "zaidtech",
    ]) {
      expect(out.some((line) => line.startsWith(id))).toBe(true);
    }
  });

  it("open('chess') calls ctx.openApp('chess')", () => {
    const shell = freshShell();
    const ctx = makeCtx();
    shell.run("open chess", ctx);
    expect(ctx.openApp).toHaveBeenCalledWith("chess");
  });

  it("QA failure: open nosuch prints an error line without throwing", () => {
    const shell = freshShell();
    const ctx = makeCtx();
    const out = shell.run("open nosuch", ctx);
    expect(out).toEqual(["open: unknown app 'nosuch'"]);
    expect(ctx.openApp).not.toHaveBeenCalled();
  });

  it("about prints bio from site data", () => {
    const shell = freshShell();
    const out = shell.run("about", makeCtx()).join("\n");
    expect(out).toContain(site.owner);
    expect(out).toContain(site.bio[0]!.slice(0, 20));
  });

  it("whoami prints the expected line", () => {
    const shell = freshShell();
    expect(shell.run("whoami", makeCtx())).toEqual([
      "zaid — developer who rices his desktop",
    ]);
  });

  it("echo joins arguments", () => {
    const shell = freshShell();
    expect(shell.run("echo hello world", makeCtx())).toEqual(["hello world"]);
    expect(shell.run("echo", makeCtx())).toEqual([""]);
  });

  it("socials lists URLs from the data layer", () => {
    const shell = freshShell();
    const out = shell.run("socials", makeCtx()).join("\n");
    expect(out).toContain("https://github.com/zaidx-me");
    expect(out).toContain("https://linktr.ee/zaidx.me");
  });

  it("contact shows email and handles", () => {
    const shell = freshShell();
    const out = shell.run("contact", makeCtx());
    expect(out[0]).toBe(site.contactEmail);
    expect(out.join("\n")).toContain("GitHub");
  });

  it("history prints numbered prior commands", () => {
    const shell = freshShell();
    const ctx = makeCtx();
    shell.run("ls", ctx);
    shell.run("pwd", ctx);
    const out = shell.run("history", ctx);
    expect(out.some((line) => line.includes("ls"))).toBe(true);
    expect(out.some((line) => line.includes("pwd"))).toBe(true);
  });

  it("exit calls ctx.close when wired", () => {
    const shell = freshShell();
    const close = vi.fn();
    shell.run("exit", makeCtx({ close }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("sudo rm -rf / returns the refusal joke", () => {
    expect(sudoHandler(["rm", "-rf", "/"])).toEqual([SUDO_RM_JOKE]);
    const shell = freshShell();
    expect(shell.run("sudo rm -rf /", makeCtx())).toEqual([SUDO_RM_JOKE]);
  });

  it("sudo with other args returns the sudoers joke", () => {
    expect(sudoHandler(["nope"])).toEqual([SUDOERS_JOKE]);
    const shell = freshShell();
    expect(shell.run("sudo nope", makeCtx())).toEqual([SUDOERS_JOKE]);
  });

  it("completes open with app ids", () => {
    const shell = freshShell();
    expect(shell.complete("open ch")).toEqual(["chat", "chess"]);
  });

  it("neofetch prints Hyprland.web from the shell", () => {
    const shell = freshShell();
    const out = shell.run("neofetch", makeCtx()).join("\n");
    expect(out).toContain("Hyprland.web");
    expect(out).toContain("zaid@zaidos");
  });
});
