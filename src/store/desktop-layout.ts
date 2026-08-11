import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppId } from "@/components/ui/AppIcon";
import { APP_IDS } from "@/components/ui/AppIcon";

export const DESKTOP_LAYOUT_KEY = "zaidos-desktop-layout";

export interface IconPosition {
  x: number;
  y: number;
}

const COL_W = 96;
const ROW_H = 96;
const PAD = 16;
const TOP = 8;

/** Default grid positions for desktop icons (below menu bar). */
export function defaultIconPositions(): Record<string, IconPosition> {
  const positions: Record<string, IconPosition> = {};
  APP_IDS.forEach((id, index) => {
    const col = Math.floor(index / 8);
    const row = index % 8;
    positions[id] = {
      x: PAD + col * COL_W,
      y: TOP + row * ROW_H,
    };
  });
  return positions;
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
        const merged = { ...base, ...(saved?.positions ?? {}) };
        return { ...current, positions: merged };
      },
    },
  ),
);

export function getIconPosition(
  positions: Record<string, IconPosition>,
  appId: AppId | string,
): IconPosition {
  return positions[appId] ?? defaultIconPositions()[appId] ?? { x: PAD, y: TOP };
}
