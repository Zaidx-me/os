import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AppId } from "@/components/ui/AppIcon";

const MAX_RECENT = 8;
const DEFAULT_PINNED: AppId[] = ["terminal", "browser", "files", "settings"];

export const LAUNCHER_PREFS_KEY = "zaidos-launcher";

interface LauncherPrefsState {
  pinned: AppId[];
  recent: AppId[];
  togglePin: (appId: AppId) => void;
  recordLaunch: (appId: AppId) => void;
}

function isAppId(value: unknown): value is AppId {
  return typeof value === "string";
}

export const useLauncherPrefsStore = create<LauncherPrefsState>()(
  persist(
    (set, get) => ({
      pinned: DEFAULT_PINNED,
      recent: [],
      togglePin: (appId) => {
        const { pinned } = get();
        set({
          pinned: pinned.includes(appId)
            ? pinned.filter((id) => id !== appId)
            : [...pinned, appId],
        });
      },
      recordLaunch: (appId) => {
        const next = [appId, ...get().recent.filter((id) => id !== appId)].slice(
          0,
          MAX_RECENT,
        );
        set({ recent: next });
      },
    }),
    {
      name: LAUNCHER_PREFS_KEY,
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const saved = persisted as Partial<LauncherPrefsState> | null;
        const pinned = Array.isArray(saved?.pinned)
          ? saved.pinned.filter(isAppId)
          : current.pinned;
        const recent = Array.isArray(saved?.recent)
          ? saved.recent.filter(isAppId).slice(0, MAX_RECENT)
          : current.recent;
        return { ...current, pinned, recent };
      },
    },
  ),
);

export function recordAppLaunch(appId: AppId): void {
  useLauncherPrefsStore.getState().recordLaunch(appId);
}

export const selectPinnedApps = (s: LauncherPrefsState) => s.pinned;
export const selectRecentApps = (s: LauncherPrefsState) => s.recent;
