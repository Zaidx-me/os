import { create } from "zustand";
import { useWorkspacesStore } from "./workspaces";

/**
 * Window manager store — per-window geometry, mode, and z-order.
 *
 * Workspace MEMBERSHIP is NOT stored here: a window's workspace lives ONLY in
 * workspaces.ts (todo 9). Window objects have no `workspace` field — the join
 * key between the two stores is the `win-<n>` id returned by
 * workspaces.openInWorkspace.
 *
 * z-order semantics: `z` is a monotonic raise counter driven by `nextZ`. The
 * top window of the ACTIVE workspace always satisfies z === nextZ. Focus/raise
 * only ever applies within the ACTIVE workspace: focus() refuses windows whose
 * owning workspace (read from the workspaces store) differs from `activeWs`.
 * No cross-workspace raising — Mod+Tab cycling is therefore confined to the
 * active workspace.
 *
 * Session-only: NEVER persisted (same rationale as workspaces.ts — a restored
 * desktop session would place windows off-screen on smaller viewports). No
 * persist middleware is wired here.
 */

/** Waybar height in px — the --waybar-h token from globals.css (2.5rem). */
export const WAYBAR_H = 40;

/** Minimum window size before viewport-capping (todo 13 resize handles). */
export const MIN_WINDOW_W = 360;
export const MIN_WINDOW_H = 240;

/** Margin kept between a window and the viewport edges. */
export const VIEWPORT_MARGIN = 16;

/**
 * Gutter a fullscreen (maximized) window keeps around itself — 8px, matching
 * the --gap-window token (todo 13 maximize / todo 14 tile math).
 */
export const MAXIMIZE_GAP = 8;

/**
 * Resize handle directions (todo 13). Each name is the edge/corner the handle
 * sits on; `dir.includes("e")` etc. drives the resize math in resizeBounds.
 */
export type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/**
 * Edge-snap zones (todo 14): a pointer within this many px of a viewport edge
 * (while dragging a titlebar) shows the snap preview and snaps on drop.
 */
export const SNAP_EDGE_ZONE = 40;

/** Snap targets for edge-snap tiling + keyboard tiling (todo 14). */
export type SnapDir = "left" | "right" | "full";

/** Floating geometry remembered when a window snaps, so Mod+F can restore it. */
export interface FloatBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Default open size until the app registry (todo 15) supplies defaultSize. */
export const DEFAULT_WINDOW_SIZE = { w: 640, h: 480 } as const;

/** SSR fallback viewport (window is undefined on the server). */
export const DEFAULT_VIEWPORT = { vw: 1280, vh: 800 } as const;

export type WindowMode = "tile" | "float";

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  mode: WindowMode;
  floatBounds: FloatBounds | null;
}

/** Partial bounds update accepted by setBounds (undefined fields are kept). */
export interface WindowBounds {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export interface OpenWindowInput {
  id: string;
  appId: string;
  title: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  mode?: WindowMode;
}

export interface Viewport {
  vw: number;
  vh: number;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Viewport-capped size clamp, applied by setBounds/open/reclampToViewport and
 * (later) by the tile/snap math:
 *   w = clamp(w, Math.min(360, vw-16), vw-16)
 *   h = clamp(h, Math.min(240, vh-WAYBAR_H-16), vh-WAYBAR_H-16)
 * On small viewports the MINIMUM itself is capped so a 200x200 viewport yields
 * a 184x144 window (not 360x240).
 */
export function clampWindowBounds(
  bounds: { w: number; h: number },
  viewport: Viewport,
): { w: number; h: number } {
  const maxW = viewport.vw - VIEWPORT_MARGIN;
  const maxH = viewport.vh - WAYBAR_H - VIEWPORT_MARGIN;
  return {
    w: clamp(bounds.w, Math.min(MIN_WINDOW_W, maxW), maxW),
    h: clamp(bounds.h, Math.min(MIN_WINDOW_H, maxH), maxH),
  };
}

/** Bounds a maximized window fills: workspace minus the waybar and gutter. */
export function maximizeBounds(vp: Viewport): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  return {
    x: MAXIMIZE_GAP,
    y: WAYBAR_H + MAXIMIZE_GAP,
    w: vp.vw - MAXIMIZE_GAP * 2,
    h: vp.vh - WAYBAR_H - MAXIMIZE_GAP * 2,
  };
}

/**
 * Exact bounds a snapped window takes for `dir` (todo 14):
 *   left : x=8, y=48, w=50%-12px (8px gutter + 8px gap to the right pane)
 *   right: x=vw/2+4, y=48, w=50%-12px (sits beside a left-snapped window)
 *   full : the maximize rect (workspace minus waybar + gutter)
 */
export function snapBounds(dir: SnapDir, vp: Viewport): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (dir === "full") return maximizeBounds(vp);
  const halfW = vp.vw / 2 - 12;
  return {
    x: dir === "left" ? MAXIMIZE_GAP : vp.vw / 2 + 4,
    y: WAYBAR_H + MAXIMIZE_GAP,
    w: halfW,
    h: vp.vh - WAYBAR_H - MAXIMIZE_GAP * 2,
  };
}

/** Snap zone under a pointer: within SNAP_EDGE_ZONE of an edge, else null. */
export function snapZoneAt(
  point: { x: number; y: number },
  vp: Viewport,
): SnapDir | null {
  if (point.x < SNAP_EDGE_ZONE) return "left";
  if (point.x > vp.vw - SNAP_EDGE_ZONE) return "right";
  if (point.y < SNAP_EDGE_ZONE) return "full";
  return null;
}

/** Drag position: clamped to the viewport, never above the waybar (todo 13). */
export function dragBounds(
  start: { x: number; y: number; w: number; h: number },
  dx: number,
  dy: number,
  vp: Viewport,
): { x: number; y: number } {
  return {
    x: clamp(start.x + dx, 0, vp.vw - start.w),
    y: clamp(start.y + dy, WAYBAR_H, vp.vh - start.h),
  };
}

/**
 * Resize position/size for `dir` with dx/dy pointer deltas. West/north edges
 * stay anchored (the opposite edge is fixed) and the size is clamped through
 * clampWindowBounds before the anchored position is recomputed.
 */
export function resizeBounds(
  start: { x: number; y: number; w: number; h: number },
  dir: ResizeDir,
  dx: number,
  dy: number,
  vp: Viewport,
): { x: number; y: number; w: number; h: number } {
  const raw = { w: start.w, h: start.h };
  if (dir.includes("e")) raw.w = start.w + dx;
  if (dir.includes("w")) raw.w = start.w - dx;
  if (dir.includes("s")) raw.h = start.h + dy;
  if (dir.includes("n")) raw.h = start.h - dy;
  const { w, h } = clampWindowBounds(raw, vp);
  let x = start.x;
  let y = start.y;
  if (dir.includes("w")) x = start.x + (start.w - w);
  if (dir.includes("n")) y = start.y + (start.h - h);
  return {
    x: clamp(x, 0, vp.vw - w),
    y: clamp(y, WAYBAR_H, vp.vh - h),
    w,
    h,
  };
}

/** Current client viewport; SSR-safe fallback (never undefined). */
export function getViewport(): Viewport {
  if (typeof window === "undefined") return DEFAULT_VIEWPORT;
  return { vw: window.innerWidth, vh: window.innerHeight };
}

export interface WmStore {
  windows: Record<string, WindowState>;
  /** Next z to hand out — monotonic across the whole session. */
  nextZ: number;

  /** Opens a window (assumes workspaces.openInWorkspace already ran). */
  open(input: OpenWindowInput): void;
  /** Closes a window and, if it was on top, promotes the next-highest in its workspace. */
  close(id: string): void;
  /** Raises a window to the top of the ACTIVE workspace (restores it if minimized). */
  focus(id: string): void;
  /** Minimizes a window (state preserved; restore happens via focus()). */
  minimize(id: string): void;
  toggleMaximize(id: string): void;
  /** Live window title, updated by the window's app content (WindowHost). */
  setTitle(id: string, title: string): void;
  setBounds(id: string, bounds: WindowBounds): void;
  setMode(id: string, mode: WindowMode): void;
  /** Tiles a window to a snap region; the pre-snap float bounds are remembered. */
  snap(id: string, dir: SnapDir): void;
  /** Restores a tiled window to its remembered float bounds (Mod+F). */
  toggleFloat(id: string): void;
  /** Re-clamps every window to the current viewport (ResizeObserver wiring, later todo). */
  reclampToViewport(): void;
}

export function createInitialWmState(): {
  windows: Record<string, WindowState>;
  nextZ: number;
} {
  return { windows: {}, nextZ: 0 };
}

/** The next-highest-z window in `ws`, or null when the workspace is empty. */
function topWindowInWs(
  windows: Record<string, WindowState>,
  ws: number | null,
): WindowState | null {
  let top: WindowState | null = null;
  for (const win of Object.values(windows)) {
    if (useWorkspacesStore.getState().getWindowWs(win.id) !== ws) continue;
    if (top === null || win.z > top.z) top = win;
  }
  return top;
}

export const useWmStore = create<WmStore>((set) => ({
  ...createInitialWmState(),

  open: (input) => {
    const vp = getViewport();
    const { w, h } = clampWindowBounds(
      { w: input.w ?? DEFAULT_WINDOW_SIZE.w, h: input.h ?? DEFAULT_WINDOW_SIZE.h },
      vp,
    );
    // Center in the area below the waybar, keeping the viewport margin.
    const x = input.x ?? Math.max(VIEWPORT_MARGIN, Math.round((vp.vw - w) / 2));
    const y =
      input.y ??
      Math.max(
        WAYBAR_H + VIEWPORT_MARGIN,
        WAYBAR_H + Math.round((vp.vh - WAYBAR_H - h) / 2),
      );
    set((s) => ({
      windows: {
        ...s.windows,
        [input.id]: {
          id: input.id,
          appId: input.appId,
          title: input.title,
          x,
          y,
          w,
          h,
          z: s.nextZ + 1,
          minimized: false,
          maximized: false,
          mode: input.mode ?? "float",
          floatBounds: null,
        },
      },
      nextZ: s.nextZ + 1,
    }));
  },

  close: (id) => {
    set((s) => {
      const removed = s.windows[id];
      if (removed === undefined) return s; // unknown window — safe no-op
      const windows = { ...s.windows };
      delete windows[id];
      let nextZ = s.nextZ;
      if (removed.z === s.nextZ) {
        // The top window closed: promote the next-highest window in the same
        // workspace so the top-z invariant (top window has z === nextZ) holds.
        // Read the owning workspace BEFORE workspaces.closeWindow removes the
        // id — the orchestrator must call wm.close first.
        const owner = useWorkspacesStore.getState().getWindowWs(id);
        const top = topWindowInWs(windows, owner);
        if (top !== null) {
          windows[top.id] = { ...top, z: s.nextZ + 1 };
          nextZ = s.nextZ + 1;
        }
      }
      return { windows, nextZ };
    });
  },

  focus: (id) => {
    const workspaces = useWorkspacesStore.getState();
    if (workspaces.getWindowWs(id) !== workspaces.activeWs) {
      return; // cross-workspace raise is forbidden
    }
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      if (win.z === s.nextZ) {
        // Already on top: restoring a minimized top window needs no re-raise.
        return win.minimized
          ? {
              windows: {
                ...s.windows,
                [id]: { ...win, minimized: false },
              },
            }
          : s;
      }
      return {
        windows: {
          ...s.windows,
          [id]: { ...win, minimized: false, z: s.nextZ + 1 },
        },
        nextZ: s.nextZ + 1,
      };
    });
  },

  minimize: (id) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      return { windows: { ...s.windows, [id]: { ...win, minimized: true } } };
    });
  },

  toggleMaximize: (id) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      return {
        windows: {
          ...s.windows,
          [id]: { ...win, maximized: !win.maximized },
        },
      };
    });
  },

  setTitle: (id, title) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      return { windows: { ...s.windows, [id]: { ...win, title } } };
    });
  },

  setBounds: (id, bounds) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      const next = { ...win };
      if (bounds.x !== undefined) next.x = bounds.x;
      if (bounds.y !== undefined) next.y = bounds.y;
      if (bounds.w !== undefined || bounds.h !== undefined) {
        const { w, h } = clampWindowBounds(
          { w: bounds.w ?? win.w, h: bounds.h ?? win.h },
          getViewport(),
        );
        next.w = w;
        next.h = h;
      }
      return { windows: { ...s.windows, [id]: next } };
    });
  },

  setMode: (id, mode) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      return { windows: { ...s.windows, [id]: { ...win, mode } } };
    });
  },

  snap: (id, dir) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined) return s;
      const floatBounds =
        win.mode === "float"
          ? (win.floatBounds ?? { x: win.x, y: win.y, w: win.w, h: win.h })
          : win.floatBounds;
      return {
        windows: { ...s.windows, [id]: { ...win, mode: "tile", floatBounds, ...snapBounds(dir, getViewport()) } },
      };
    });
  },

  toggleFloat: (id) => {
    set((s) => {
      const win = s.windows[id];
      if (win === undefined || win.mode !== "tile") return s;
      if (win.floatBounds === null) {
        return { windows: { ...s.windows, [id]: { ...win, mode: "float" } } };
      }
      const { x, y, w, h } = win.floatBounds;
      return {
        windows: { ...s.windows, [id]: { ...win, mode: "float", floatBounds: null, x, y, w, h } },
      };
    });
  },

  reclampToViewport: () => {
    set((s) => {
      const vp = getViewport();
      const windows: Record<string, WindowState> = {};
      let changed = false;
      for (const [id, win] of Object.entries(s.windows)) {
        const { w, h } = clampWindowBounds({ w: win.w, h: win.h }, vp);
        if (w !== win.w || h !== win.h) {
          changed = true;
          windows[id] = { ...win, w, h };
        } else {
          windows[id] = win;
        }
      }
      return changed ? { windows } : s;
    });
  },
}));
