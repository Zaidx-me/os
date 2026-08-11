import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const ASSISTIVE_TOUCH_STORAGE_KEY = "zaidos-assistive-touch";

export type AssistiveDockSide = "left" | "right";

export interface AssistiveTouchState {
  side: AssistiveDockSide;
  /** Y offset from top of viewport (px). */
  y: number;
  setPosition: (side: AssistiveDockSide, y: number) => void;
}

export const ASSISTIVE_DEFAULT_Y = 420;

export const useAssistiveTouchStore = create<AssistiveTouchState>()(
  persist(
    (set) => ({
      side: "right",
      y: ASSISTIVE_DEFAULT_Y,
      setPosition: (side, y) => set({ side, y }),
    }),
    {
      name: ASSISTIVE_TOUCH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ side: s.side, y: s.y }),
    },
  ),
);

export function clampAssistiveY(y: number, viewportH: number): number {
  const top = 44;
  const bottom = 40;
  const ball = 48;
  const min = top;
  const max = Math.max(min, viewportH - bottom - ball);
  return Math.min(max, Math.max(min, y));
}
