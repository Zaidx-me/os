import { create } from "zustand";

/**
 * Workspace system — the SINGLE source of truth for workspace membership.
 *
 * Windows live in wm.ts (todo 12) as { id, appId, title, x, y, ... } and have
 * NO `workspace` field; this store owns all membership. A window id exists in
 * EXACTLY ONE workspace's ordered list at all times (or in none when closed).
 *
 * NEVER persisted (session-only): a persisted desktop session would restore
 * windows off-screen on smaller viewports. No persist middleware is wired here.
 */

/** Workspace ids are 1-5 (Hyprland-style virtual desktops). */
export const WORKSPACE_IDS = [1, 2, 3, 4, 5] as const;

export type WorkspaceId = (typeof WORKSPACE_IDS)[number];

/**
 * Ordered workspace labels for the waybar pills (todo 8) — index 0
 * corresponds to workspace 1. term / proj / web / soc / game.
 */
export const WORKSPACE_LABELS = ["term", "proj", "web", "soc", "game"] as const;

/** Human label for a workspace number ("term" for 1, ... "game" for 5). */
export function workspaceLabel(ws: WorkspaceId): string {
  return WORKSPACE_LABELS[ws - 1];
}

/** Type guard: valid workspace targets are exactly 1-5. */
export function isWorkspaceId(ws: number | undefined): ws is WorkspaceId {
  return ws !== undefined && Number.isInteger(ws) && ws >= 1 && ws <= 5;
}

/** Per-workspace state: ordered window ids + the focused window id (or null). */
export interface WorkspaceSlot {
  windows: string[];
  focused: string | null;
}

/** Fresh empty slots for all 5 workspaces (tests reset the store with this). */
export function createInitialWorkspaces(): Record<WorkspaceId, WorkspaceSlot> {
  return {
    1: { windows: [], focused: null },
    2: { windows: [], focused: null },
    3: { windows: [], focused: null },
    4: { windows: [], focused: null },
    5: { windows: [], focused: null },
  };
}

export interface WorkspacesStore {
  workspaces: Record<WorkspaceId, WorkspaceSlot>;
  /** The visible (active) workspace — 1-5. */
  activeWs: WorkspaceId;

  setActive(ws: WorkspaceId): void;
  /**
   * Opens an app in `ws` (defaults to activeWs), returns the new window id.
   * `appId` is part of the todo 12 orchestrator contract (`openApp(appId)`) —
   * membership tracks window ids only; app metadata lives in wm.ts.
   */
  openInWorkspace(appId: string, ws?: WorkspaceId): string;
  /** Closes a window, removing it ONLY from its owning workspace. */
  closeWindow(id: string): void;
  /** Moves a window to `ws` (removes from old, appends to new, focuses it). */
  moveWindow(id: string, ws: WorkspaceId): void;
  /** Cycles focus within `ws`'s ordered list. */
  focusNextInWs(ws: WorkspaceId): void;
  /** Marks `id` as focused in `ws` (defaults to activeWs); no-op if absent. */
  setFocused(id: string, ws?: WorkspaceId): void;
  /** Owning workspace of a window, or null if it isn't open anywhere. */
  getWindowWs(id: string): WorkspaceId | null;
}

/** Monotonic window-id counter — never resets, so ids stay globally unique. */
let windowCounter = 0;
function nextWindowId(): string {
  windowCounter += 1;
  return `win-${windowCounter}`;
}

/**
 * The window that should take focus after `removed` leaves `original`:
 * the window that followed it, or the last remaining one when it was last
 * in the stack (or null when nothing remains).
 */
function focusAfterRemove(
  original: readonly string[],
  removed: string,
): string | null {
  const remaining = original.filter((w) => w !== removed);
  if (remaining.length === 0) return null;
  const idx = Math.min(original.indexOf(removed), remaining.length - 1);
  return remaining[idx];
}

/** The workspace whose list contains `id` — the invariant guarantees at most one. */
function findOwningWorkspace(
  workspaces: Record<WorkspaceId, WorkspaceSlot>,
  id: string,
): WorkspaceId | null {
  for (const ws of WORKSPACE_IDS) {
    if (workspaces[ws].windows.includes(id)) return ws;
  }
  return null;
}

export const useWorkspacesStore = create<WorkspacesStore>((set, get) => ({
  workspaces: createInitialWorkspaces(),
  activeWs: 1,

  setActive: (ws) => {
    if (isWorkspaceId(ws)) set({ activeWs: ws });
  },

  openInWorkspace: (_appId, ws) => {
    const resolved = isWorkspaceId(ws) ? ws : get().activeWs;
    const id = nextWindowId();
    set((s) => ({
      workspaces: {
        ...s.workspaces,
        [resolved]: {
          windows: [...s.workspaces[resolved].windows, id],
          focused: id,
        },
      },
    }));
    return id;
  },

  closeWindow: (id) => {
    const owning = findOwningWorkspace(get().workspaces, id);
    if (owning === null) return; // unknown window — safe no-op
    set((s) => {
      const slot = s.workspaces[owning];
      const windows = slot.windows.filter((w) => w !== id);
      const focused =
        slot.focused === id ? focusAfterRemove(slot.windows, id) : slot.focused;
      return {
        workspaces: {
          ...s.workspaces,
          [owning]: { windows, focused },
        },
      };
    });
  },

  moveWindow: (id, ws) => {
    if (!isWorkspaceId(ws)) return;
    const owning = findOwningWorkspace(get().workspaces, id);
    if (owning === null) return; // unknown window — safe no-op
    set((s) => {
      const from = s.workspaces[owning];
      const fromWindows = from.windows.filter((w) => w !== id);
      const fromFocused =
        from.focused === id
          ? focusAfterRemove(from.windows, id)
          : from.focused;
      const targetWindows =
        owning === ws
          ? [...fromWindows, id] // same workspace: no duplicate
          : [...s.workspaces[ws].windows, id];
      return {
        workspaces: {
          ...s.workspaces,
          [owning]: { windows: fromWindows, focused: fromFocused },
          [ws]: { windows: targetWindows, focused: id },
        },
      };
    });
  },

  focusNextInWs: (ws) => {
    if (!isWorkspaceId(ws)) return;
    set((s) => {
      const slot = s.workspaces[ws];
      if (slot.windows.length === 0) return s; // nothing to focus
      const currentIdx = slot.windows.indexOf(slot.focused ?? "");
      const focused = slot.windows[(currentIdx + 1) % slot.windows.length];
      return {
        workspaces: {
          ...s.workspaces,
          [ws]: { ...slot, focused },
        },
      };
    });
  },

  setFocused: (id, ws) => {
    const resolved = isWorkspaceId(ws) ? ws : get().activeWs;
    const slot = get().workspaces[resolved];
    if (!slot.windows.includes(id)) return; // not a member here — safe no-op
    set((s) => ({
      workspaces: {
        ...s.workspaces,
        [resolved]: { ...slot, focused: id },
      },
    }));
  },

  getWindowWs: (id) => findOwningWorkspace(get().workspaces, id),
}));

/** Selector: window list + focused of a workspace (stable ref per workspace). */
export const selectWorkspace =
  (ws: WorkspaceId) =>
  (s: WorkspacesStore): WorkspaceSlot =>
    s.workspaces[ws];

/** Selector: the active workspace number. */
export const selectActiveWs = (s: WorkspacesStore): WorkspaceId => s.activeWs;
