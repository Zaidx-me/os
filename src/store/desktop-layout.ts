import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppId } from "@/components/ui/AppIcon";

export const DESKTOP_LAYOUT_KEY = "zaidos-desktop-layout-v2";

/** Portfolio apps on the desktop — everything else lives in Launcher/Dock. */
export const DESKTOP_PINNED_APP_IDS: AppId[] = [
  "terminal",
  "browser",
  "files",
  "projects",
  "resume",
  "contact",
  "articles",
  "chat",
];

export interface IconPosition {
  x: number;
  y: number;
}

const COL_W = 84;
const ROW_H = 92;
const PAD_TOP = 20;
const PAD_RIGHT = 24;
const ROWS_PER_COL = 6;
/** Reference width for macOS-style right-column defaults. */
const REF_WIDTH = 1280;

/** Default positions: right-aligned columns like macOS desktop icons. */
export function defaultIconPositions(): Record<string, IconPosition> {
  const positions: Record<string, IconPosition> = {};
  DESKTOP_PINNED_APP_IDS.forEach((id, index) => {
    const col = Math.floor(index / ROWS_PER_COL);
    const row = index % ROWS_PER_COL;
    positions[id] = {
      x: REF_WIDTH - PAD_RIGHT - COL_W - col * COL_W,
      y: PAD_TOP + row * ROW_H,
    };
  });
  return positions;
}

export function snapIconPosition(pos: IconPosition): IconPosition {
  return {
    x: Math.max(8, Math.round((pos.x - 8) / COL_W) * COL_W + 8),
    y: Math.max(8, Math.round((pos.y - PAD_TOP) / ROW_H) * ROW_H + PAD_TOP),
  };
}

interface DesktopLayoutState {
  positions: Record<string, IconPosition>;
  setPosition: (appId: string, pos: IconPosition) => void;
  resetLayout: () => void;
}

export const useDesktopLayoutStore = create<DesktopLayoutState>()(
  persist(
    (set) => ({
      positions: defaultIconPositions(),
      setPosition: (appId, pos) =>
        set((s) => ({
          positions: { ...s.positions, [appId]: pos },
        })),
      resetLayout: () => set({ positions: defaultIconPositions() }),
    }),
    {
      name: DESKTOP_LAYOUT_KEY,
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<DesktopLayoutState> | null;
        const base = defaultIconPositions();
        const merged: Record<string, IconPosition> = { ...base };
        for (const id of DESKTOP_PINNED_APP_IDS) {
          if (saved?.positions?.[id]) merged[id] = saved.positions[id]!;
        }
        return { ...current, positions: merged };
      },
    },
  ),
);

export function getIconPosition(
  positions: Record<string, IconPosition>,
  appId: AppId | string,
): IconPosition {
  return positions[appId] ?? defaultIconPositions()[appId] ?? { x: PAD_RIGHT, y: PAD_TOP };
}

export { COL_W, ROW_H };
