/**
 * Fake filesystem for the simulated shell — a Linux-style home tree with
 * portfolio content as files. ls/cd/pwd/cat/tree semantics; read-only.
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
  "",
  "Quick start:",
  "  open files     — graphical file manager",
  "  browse         — in-OS web browser (Surf mode for GitHub, etc.)",
  "  neofetch       — system info",
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

/** The whole tree, rooted at `/`. */
const TREE: FsNode = dir({
  etc: dir({
    "os-release": file(
      [
        'NAME="ZaidOS"',
        'VERSION="0.1 (browser edition)"',
        'ID=zaidos',
        'PRETTY_NAME="ZaidOS 0.1 — Hyprland rice in a tab"',
      ].join("\n"),
    ),
    hostname: file("zaidos\n"),
  }),
  usr: dir({
    share: dir({
      zaidos: dir({
        "motd": file("Welcome to ZaidOS. Your dotfiles are imaginary but your skills are real.\n"),
      }),
    }),
  }),
  home: dir({
    zaid: dir({
      Desktop: dir({
        "ZaidOS.desktop": file(
          "[Desktop Entry]\nName=ZaidOS\nType=Application\nComment=Portfolio desktop environment\n",
        ),
      }),
      Documents: dir({
        "resume-notes.txt": file("Keep resume PDF in ~/Documents/resume.pdf — open Resume app to print.\n"),
        "stack.txt": file("Next.js · TypeScript · React · Node · PostgreSQL · Docker · Hyprland\n"),
      }),
      Downloads: dir({
        "readme.txt": file("Nothing here yet. Your F-Droid builds live in ~/projects/.\n"),
      }),
      Pictures: dir({
        "coast.jpg": file("[image] Big Sur coastline — open in Photos app.\n"),
        "forest.jpg": file("[image] Forest path — open in Photos app.\n"),
        "mountains.jpg": file("[image] Alpine ridge — open in Photos app.\n"),
        "portrait.jpg": file("[image] Golden hour portrait — open in Photos app.\n"),
        "river.jpg": file("[image] River valley — open in Photos app.\n"),
        "puppy.jpg": file("[image] Best friend — open in Photos app.\n"),
        "wallpapers.txt": file("Wallpapers are managed by Settings → Wallpaper.\n"),
      }),
      projects: dir({
        applicator: dir({
          "README.md": file("# Applicator\nAI job application assistant — live at applicator.netlify.app\n"),
        }),
        whatbot: dir({
          "README.md": file("# Whatbot\nWhatsApp gateway — live at whatbot.zaidx.me\n"),
        }),
        "pu-stacks": dir({}),
        "kens-pk": dir({}),
      }),
      dotfiles: dir({
        hypr: dir({
          "hyprland.conf": file(
            [
              "# Hyprland rice — simulated",
              "monitor=,preferred,auto,1",
              "exec-once = waybar &",
              "windowrule = float, class:zaidos-floating",
            ].join("\n"),
          ),
        }),
        niri: dir({
          "config.kdl": file("// Niri scroll config — also imaginary\n"),
        }),
        waybar: dir({
          "config.jsonc": file('{\n  "layer": "top",\n  "modules-left": ["custom/launcher", "hyprland/workspaces"]\n}\n'),
        }),
      }),
      games: dir({
        snake: dir({}),
        breakout: dir({}),
        chess: dir({
          "README.md": file("Open Chess from the launcher — London System included.\n"),
        }),
      }),
      ".config": dir({
        zaidos: dir({
          settings: file('{\n  "wallpaper": "matrix",\n  "animations": true,\n  "blur": true\n}\n'),
        }),
      }),
      "README.md": file(README_CONTENT),
    }),
  }),
});

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
  /** In-memory file edits (persist for session; synced with Editor). */
  private overlays = new Map<string, string>();
  /** Session-created nodes and deletions. */
  private created = new Map<string, FsNode>();
  private removed = new Set<string>();

  pwd(): string {
    return this.cwd;
  }

  promptPath(): string {
    if (this.cwd === HOME_PATH) return "~";
    if (this.cwd.startsWith(HOME_PATH + "/")) {
      return "~" + this.cwd.slice(HOME_PATH.length);
    }
    return this.cwd;
  }

  resolve(path: string): string {
    const absolute = path.startsWith("/");
    const base = absolute ? [] : this.cwd === "/" ? [] : this.cwd.split("/").filter(Boolean);
    return normalize(path.split("/"), base);
  }

  ls(target = ""): FsEntry[] | null {
    const abs = this.resolve(target === "" ? this.cwd : target);
    const node = this.nodeAt(abs);
    if (!node || node.type !== "dir") return null;
    const map = new Map<string, FsEntryType>();
    if (node.children) {
      for (const [name, child] of node.children) {
        const childAbs = abs === "/" ? `/${name}` : `${abs}/${name}`;
        if (!this.removed.has(childAbs) && !this.created.has(childAbs)) {
          map.set(name, child.type);
        }
      }
    }
    for (const [path, createdNode] of this.created) {
      const parent = path.substring(0, path.lastIndexOf("/")) || "/";
      if (parent === abs) {
        map.set(path.substring(path.lastIndexOf("/") + 1), createdNode.type);
      }
    }
    return [...map.entries()]
      .map(([name, type]) => ({ name, type }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  cd(target: string): string | null {
    const abs = this.resolve(target === "" ? "~" : target);
    const node = this.nodeAt(abs);
    if (!node) return `cd: no such file or directory: ${target}`;
    if (node.type !== "dir") return `cd: not a directory: ${target}`;
    this.cwd = abs;
    return null;
  }

  cat(target: string):
    | { ok: true; lines: string[] }
    | { ok: false; reason: "missing" | "isdir" } {
    const abs = this.resolve(target);
    const overlay = this.overlays.get(abs);
    if (overlay !== undefined) {
      return { ok: true, lines: overlay.split("\n") };
    }
    const node = this.nodeAt(abs);
    if (!node) return { ok: false, reason: "missing" };
    if (node.type === "dir") return { ok: false, reason: "isdir" };
    return { ok: true, lines: (node.content ?? "").split("\n") };
  }

  /** Write file content (overlay). Returns error string or null on success. */
  write(target: string, content: string): string | null {
    const abs = this.resolve(target);
    const node = this.nodeAt(abs);
    if (!node) return `write: no such file: ${target}`;
    if (node.type === "dir") return `write: is a directory: ${target}`;
    this.overlays.set(abs, content);
    return null;
  }

  /** Create directory in cwd (single segment name). */
  mkdir(name: string): string | null {
    if (name.includes("/")) return `mkdir: cannot create directory '${name}': Invalid argument`;
    const abs = this.resolve(name);
    if (this.nodeAt(abs)) return `mkdir: cannot create directory '${name}': File exists`;
    const parentAbs = abs.substring(0, abs.lastIndexOf("/")) || "/";
    const parent = this.nodeAt(parentAbs);
    if (!parent || parent.type !== "dir") return `mkdir: cannot create directory '${name}': No such file or directory`;
    this.created.set(abs, dir({}));
    return null;
  }

  /** Create empty file or update timestamp overlay. */
  touch(name: string): string | null {
    const abs = this.resolve(name);
    const existing = this.nodeAt(abs);
    if (existing) {
      if (existing.type === "dir") return `touch: cannot touch '${name}': Is a directory`;
      if (!this.overlays.has(abs)) this.overlays.set(abs, existing.content ?? "");
      return null;
    }
    const parentAbs = abs.substring(0, abs.lastIndexOf("/")) || "/";
    const parent = this.nodeAt(parentAbs);
    if (!parent || parent.type !== "dir") return `touch: cannot touch '${name}': No such file or directory`;
    this.created.set(abs, file(""));
    return null;
  }

  /** Remove file or empty directory in cwd. */
  rm(name: string): string | null {
    const abs = this.resolve(name);
    const node = this.nodeAt(abs);
    if (!node) return `rm: cannot remove '${name}': No such file or directory`;
    if (node.type === "dir") {
      const children = this.ls(abs);
      if (children && children.length > 0) {
        return `rm: cannot remove '${name}': Directory not empty`;
      }
    }
    this.created.delete(abs);
    this.overlays.delete(abs);
    if (!this.created.has(abs)) this.removed.add(abs);
    return null;
  }

  /** `tree`-style listing (depth-limited). */
  tree(target = "", maxDepth = 3): string[] | null {
    const abs = this.resolve(target === "" ? this.cwd : target);
    const node = this.nodeAt(abs);
    if (!node) return null;
    if (node.type !== "dir") return [`${abs}`];
    const lines: string[] = [abs];
    this.walkTree(node, "", maxDepth, 0, lines);
    return lines;
  }

  private walkTree(
    node: FsNode,
    prefix: string,
    maxDepth: number,
    depth: number,
    lines: string[],
  ): void {
    if (!node.children || depth >= maxDepth) return;
    const entries = [...node.children.entries()].sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([name, child], i) => {
      const isLast = i === entries.length - 1;
      const branch = isLast ? "└── " : "├── ";
      const suffix = child.type === "dir" ? "/" : "";
      lines.push(`${prefix}${branch}${name}${suffix}`);
      if (child.type === "dir" && child.children) {
        this.walkTree(child, prefix + (isLast ? "    " : "│   "), maxDepth, depth + 1, lines);
      }
    });
  }

  private nodeAt(abs: string): FsNode | undefined {
    if (this.removed.has(abs)) return undefined;
    if (this.created.has(abs)) return this.created.get(abs);
    if (abs === "/") return TREE;
    const parts = abs.split("/").filter(Boolean);
    let node: FsNode = TREE;
    let built = "";
    for (const segment of parts) {
      built += `/${segment}`;
      if (this.removed.has(built)) return undefined;
      if (this.created.has(built)) {
        node = this.created.get(built)!;
        continue;
      }
      if (node.type !== "dir" || !node.children) return undefined;
      const next = node.children.get(segment);
      if (!next) return undefined;
      node = next;
    }
    return node;
  }
}
