import { buildPortfolioTree } from "./portfolio-tree.js";

export const HOME_PATH = "/home/zaid";

function dir(children) {
  return { type: "dir", children: new Map(Object.entries(children)) };
}

function file(content) {
  return { type: "file", content };
}

const TREE = buildPortfolioTree();

function normalize(parts, base) {
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

let sharedFs;

export function getSharedFs() {
  if (!sharedFs) sharedFs = new FakeFs();
  return sharedFs;
}

export class FakeFs {
  constructor() {
    this.cwd = HOME_PATH;
    this.overlays = new Map();
    this.created = new Map();
    this.removed = new Set();
  }

  pwd() {
    return this.cwd;
  }

  promptPath() {
    if (this.cwd === HOME_PATH) return "~";
    if (this.cwd.startsWith(HOME_PATH + "/")) {
      return "~" + this.cwd.slice(HOME_PATH.length);
    }
    return this.cwd;
  }

  resolve(path) {
    const absolute = path.startsWith("/");
    const base = absolute ? [] : this.cwd === "/" ? [] : this.cwd.split("/").filter(Boolean);
    return normalize(path.split("/"), base);
  }

  ls(target = "") {
    const abs = this.resolve(target === "" ? this.cwd : target);
    const node = this.nodeAt(abs);
    if (!node || node.type !== "dir") return null;
    const map = new Map();
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
      .map(([name, type]) => ({ name, type: type === "dir" ? "dir" : "file" }))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }

  cd(target) {
    const abs = this.resolve(target === "" ? "~" : target);
    const node = this.nodeAt(abs);
    if (!node) return `cd: no such file or directory: ${target}`;
    if (node.type !== "dir") return `cd: not a directory: ${target}`;
    this.cwd = abs;
    return null;
  }

  cat(target) {
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

  write(target, content) {
    const abs = this.resolve(target);
    const node = this.nodeAt(abs);
    if (!node) return `write: no such file: ${target}`;
    if (node.type === "dir") return `write: is a directory: ${target}`;
    this.overlays.set(abs, content);
    return null;
  }

  mkdir(name) {
    if (name.includes("/")) return `mkdir: cannot create directory '${name}': Invalid argument`;
    const abs = this.resolve(name);
    if (this.nodeAt(abs)) return `mkdir: cannot create directory '${name}': File exists`;
    const parentAbs = abs.substring(0, abs.lastIndexOf("/")) || "/";
    const parent = this.nodeAt(parentAbs);
    if (!parent || parent.type !== "dir") {
      return `mkdir: cannot create directory '${name}': No such file or directory`;
    }
    this.created.set(abs, dir({}));
    return null;
  }

  touch(name) {
    const abs = this.resolve(name);
    const existing = this.nodeAt(abs);
    if (existing) {
      if (existing.type === "dir") return `touch: cannot touch '${name}': Is a directory`;
      if (!this.overlays.has(abs)) this.overlays.set(abs, existing.content ?? "");
      return null;
    }
    const parentAbs = abs.substring(0, abs.lastIndexOf("/")) || "/";
    const parent = this.nodeAt(parentAbs);
    if (!parent || parent.type !== "dir") {
      return `touch: cannot touch '${name}': No such file or directory`;
    }
    this.created.set(abs, file(""));
    return null;
  }

  rm(name) {
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

  tree(target = "", maxDepth = 3) {
    const abs = this.resolve(target === "" ? this.cwd : target);
    const node = this.nodeAt(abs);
    if (!node) return null;
    if (node.type !== "dir") return [`${abs}`];
    const lines = [abs];
    this.walkTree(node, "", maxDepth, 0, lines);
    return lines;
  }

  walkTree(node, prefix, maxDepth, depth, lines) {
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

  nodeAt(abs) {
    if (this.removed.has(abs)) return undefined;
    if (this.created.has(abs)) return this.created.get(abs);
    if (abs === "/") return TREE;
    const parts = abs.split("/").filter(Boolean);
    let node = TREE;
    let built = "";
    for (const segment of parts) {
      built += `/${segment}`;
      if (this.removed.has(built)) return undefined;
      if (this.created.has(built)) {
        node = this.created.get(built);
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
