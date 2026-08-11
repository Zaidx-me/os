import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const SYSTRAY_STORAGE_KEY = "zaidos-systray";

interface SystrayState {
  volume: number;
  muted: boolean;
  wifi: boolean;
  battery: number;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleWifi: () => void;
}

export const useSystrayStore = create<SystrayState>()(
  persist(
    (set, get) => ({
      volume: 72,
      muted: false,
      wifi: true,
      battery: 86,
      setVolume: (volume) =>
        set({ volume: Math.min(100, Math.max(0, volume)), muted: false }),
      toggleMute: () => set({ muted: !get().muted }),
      toggleWifi: () => set({ wifi: !get().wifi }),
    }),
    {
      name: SYSTRAY_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        volume: s.volume,
        muted: s.muted,
        wifi: s.wifi,
      }),
    },
  ),
);

export const selectVolume = (s: SystrayState) => s.volume;
export const selectMuted = (s: SystrayState) => s.muted;
export const selectWifi = (s: SystrayState) => s.wifi;
export const selectBattery = (s: SystrayState) => s.battery;
