import { describe, expect, it } from "vitest";
import { FakeFs, HOME_PATH, README_CONTENT } from "./fakefs";

describe("FakeFs (todo 24 acceptance: ls/cd/pwd/cat)", () => {
  it("starts at home and shows ~ in the prompt", () => {
    const fs = new FakeFs();
    expect(fs.pwd()).toBe(HOME_PATH);
    expect(fs.promptPath()).toBe("~");
  });

  it("ls lists the home entries in deterministic order", () => {
    const fs = new FakeFs();
    expect(fs.ls()).toEqual([
      { name: ".config", type: "dir" },
      { name: "Desktop", type: "dir" },
      { name: "Documents", type: "dir" },
      { name: "Downloads", type: "dir" },
      { name: "Pictures", type: "dir" },
      { name: "README.md", type: "file" },
      { name: "dotfiles", type: "dir" },
      { name: "games", type: "dir" },
      { name: "projects", type: "dir" },
    ]);
  });

  it("cd descends, pwd follows, and promptPath shortens to ~/", () => {
    const fs = new FakeFs();
    expect(fs.cd("projects")).toBeNull();
    expect(fs.pwd()).toBe(`${HOME_PATH}/projects`);
    expect(fs.promptPath()).toBe("~/projects");
    expect(fs.ls()).toEqual([
      { name: "applicator", type: "dir" },
      { name: "kens-pk", type: "dir" },
      { name: "pu-stacks", type: "dir" },
      { name: "whatbot", type: "dir" },
    ]);
  });

  it("cd .. returns to the parent", () => {
    const fs = new FakeFs();
    fs.cd("projects");
    expect(fs.cd("..")).toBeNull();
    expect(fs.pwd()).toBe(HOME_PATH);
  });

  it("a bare cd and cd ~ both go home", () => {
    const fs = new FakeFs();
    fs.cd("projects");
    expect(fs.cd("~")).toBeNull();
    expect(fs.pwd()).toBe(HOME_PATH);
    fs.cd("games");
    expect(fs.cd("")).toBeNull();
    expect(fs.pwd()).toBe(HOME_PATH);
  });

  it("accepts absolute paths", () => {
    const fs = new FakeFs();
    expect(fs.cd("/home/zaid/games")).toBeNull();
    expect(fs.pwd()).toBe(`${HOME_PATH}/games`);
  });

  it("cd into a missing path reports the zsh-style error", () => {
    const fs = new FakeFs();
    expect(fs.cd("nosuch")).toBe("cd: no such file or directory: nosuch");
    expect(fs.pwd()).toBe(HOME_PATH);
  });

  it("cd into a file reports not a directory", () => {
    const fs = new FakeFs();
    expect(fs.cd("README.md")).toBe("cd: not a directory: README.md");
  });

  it("cd .. above the root stays at /", () => {
    const fs = new FakeFs();
    fs.cd("/");
    expect(fs.pwd()).toBe("/");
    expect(fs.cd("../../..")).toBeNull();
    expect(fs.pwd()).toBe("/");
    expect(fs.ls("/")).toEqual([
      { name: "etc", type: "dir" },
      { name: "home", type: "dir" },
      { name: "usr", type: "dir" },
    ]);
  });

  it("cat reads the home README", () => {
    const fs = new FakeFs();
    const res = fs.cat("README.md");
    expect(res).toEqual({ ok: true, lines: README_CONTENT.split("\n") });
    expect(res.ok && res.lines[0]).toBe("# ZaidOS");
  });

  it("cat with a relative path after cd works", () => {
    const fs = new FakeFs();
    fs.cd("dotfiles/hypr");
    const res = fs.cat("hyprland.conf");
    expect(res.ok).toBe(true);
    expect(res.ok && res.lines[0]).toContain("Hyprland rice");
  });

  it("cat on a directory reports Is a directory", () => {
    const fs = new FakeFs();
    expect(fs.cat("projects")).toEqual({ ok: false, reason: "isdir" });
  });

  it("cat on a missing path reports missing", () => {
    const fs = new FakeFs();
    expect(fs.cat("nosuch.txt")).toEqual({ ok: false, reason: "missing" });
  });

  it("ls on a missing path returns null", () => {
    const fs = new FakeFs();
    expect(fs.ls("nosuch")).toBeNull();
    expect(fs.ls("README.md")).toBeNull();
  });
});
