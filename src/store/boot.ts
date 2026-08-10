import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** localStorage key under which the booted flag is persisted. */
export const BOOT_STORAGE_KEY = "zaidos-booted";

export interface BootState {
  /**
   * true once the boot sequence has completed at least once in this browser.
   * First visit: false -> full boot sequence. Returning visits rehydrate
   * true -> desktop shell directly (quick fade only).
   */
  booted: boolean;
  /** Marks the OS as booted. Persists to localStorage via the middleware. */
  completeBoot: () => void;
  /**
   * Flips booted back to false, replaying the boot sequence (waybar
   * Reboot / Log out). Persists like any other flag change.
   */
  resetBoot: () => void;
}

/**
 * Boot persistence.
 *
 * SSR note: `createJSONStorage(() => localStorage)` defers the localStorage
 * read into the storage factory, which zustand wraps in try/catch — on the
 * server the reference throws, storage becomes undefined, and hydration is
 * skipped, so the store keeps its initial `booted: false` for the SSR
 * render. With sync localStorage the rehydration is synchronous, so by the
 * time the mount gate in page.tsx flips, the persisted value is already
 * applied — no hydration mismatch, no flicker.
 */
export const useBootStore = create<BootState>()(
  persist(
    (set) => ({
      booted: false,
      completeBoot: () => set({ booted: true }),
      resetBoot: () => set({ booted: false }),
    }),
    {
      name: BOOT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only the flag is worth persisting; actions are recreated on rehydrate.
      partialize: (state) => ({ booted: state.booted }),
    },
  ),
);
