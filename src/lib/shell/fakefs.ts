/**
 * Fake filesystem for the simulated shell — `~` with a handful of
 * directories and one README. ls/cd/pwd/cat semantics only; nothing here is
 * ever mounted, executed, or written. All content is original.
 */
export type FsEntryType = "dir" | "file";

export interface FsEntry {
  name: string;
  type: FsEntryType;
}

export const HOME_PATH = "/home/zaid";

export const README_CONTENT = [
  "# ZaidOS",
  "",
  "A desktop OS in your browser — a portfolio pretending to be an operating system.",
  "",
  "Everything here is simulated. There is nothing to install, and no kernel to blame.",
  "Type 'help' in the terminal to see what ZaidOS can do.",
].join("\n");

interface FsNode {
  type: FsEntryType;
  children?: Map<string, FsNode>;
  content?: string;
}

function dir(children: Record<string, FsNode>): FsNode {
  return { type: "dir", children: new Map(Object.entries(children)) };
}

function file(content: string): FsNode {
  return { type: "file", content };
}

/** The whole tree, rooted at `/` so absolute paths resolve cleanly. */
const TREE: FsNode = dir({
  home: dir({
    zaid: dir({
      projects: dir({
        applicator: dir({}),
        whatbot: dir({}),
      }),
      dotfiles: dir({
        hypr: dir({ "hyprland.conf": file("# Imaginary config. Adjust nothing; it will change nothing.") }),
        niri: dir({ "config.kdl": file("# Also imaginary. Pretend it is elegant.") }),
      }),
      games: dir({
        snake: dir({}),
        breakout: dir({}),
      }),
      "README.md": file(README_CONTENT),
    }),
  }),
});

/**
 * Shell-style path resolution: `~` expands to home, `.` and `..` collapse,
 * leading `/` makes the path absolute, everything else is relative to cwd.
 * `..` above the root stays at the root.
 */
function normalize(parts: readonly string[], base: readonly string[]): string {
  const segments = [...base];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "~") {
      segments.splice(0, segments.length, "home", "zaid");
      continue;
    }
    if (part === "..") {
      segments.pop();
      continue;
    }
    segments.push(part);
  }
  return "/" + segments.join("/");
}

export class FakeFs {
  private cwd = HOME_PATH;

  /** Absolute path of the current directory. */
  pwd(): string {
    return this.cwd;
  }

  /** Path as shown in the prompt: `~`, `~/projects`, or the bare path. */
  promptPath(): string {
    if (this.cwd === HOME_PATH) return "~";
    if (this.cwd.startsWith(HOME_PATH + "/")) {
      return "~" + this.cwd.slice(HOME_PATH.length);
    }
    return this.cwd;
  }

  /** Normalize any path form (relative, `~`, absolute, `..`) to absolute. */
  resolve(path: string): string {
    const absolute = path.startsWith("/");
    const base = absolute ? [] : this.cwd === "/" ? [] : this.cwd.split("/").filter(Boolean);
    return normalize(path.split("/"), base);
  }

  /**
   * Entries of a directory (sorted by name, code-unit order so results are
   * deterministic in any locale). `null` = path missing or not a directory.
   * Defaults to the current directory.
   */
  ls(target = ""): FsEntry[] | null {
    const node = this.nodeAt(this.resolve(target === "" ? this.cwd : target));
    if (!node || node.type !== "dir" || !node.children) return null;
    return [...node.children.entries()]
      .map(([name, child]) => ({ name, type: child.type }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  /**
   * Change directory. `null` on success; an error line on failure (missing
   * path vs. path that is a file). No argument goes home, like a bare `cd`.
   */
  cd(target: string): string | null {
    const abs = this.resolve(target === "" ? "~" : target);
    const node = this.nodeAt(abs);
    if (!node) return `cd: no such file or directory: ${target}`;
    if (node.type !== "dir") return `cd: not a directory: ${target}`;
    this.cwd = abs;
    return null;
  }

  /**
   * Read a file. Distinguishes "missing" from "is a directory" so the `cat`
   * command can print the right error.
   */
  cat(target: string):
    | { ok: true; lines: string[] }
    | { ok: false; reason: "missing" | "isdir" } {
    const node = this.nodeAt(this.resolve(target));
    if (!node) return { ok: false, reason: "missing" };
    if (node.type === "dir") return { ok: false, reason: "isdir" };
    return { ok: true, lines: (node.content ?? "").split("\n") };
  }

  private nodeAt(abs: string): FsNode | undefined {
    if (abs === "/") return TREE;
    let node: FsNode = TREE;
    for (const segment of abs.split("/").filter(Boolean)) {
      if (node.type !== "dir" || !node.children) return undefined;
      const next = node.children.get(segment);
      if (!next) return undefined;
      node = next;
    }
    return node;
  }
}
