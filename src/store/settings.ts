import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** localStorage key for appearance + chat preferences. */
export const SETTINGS_STORAGE_KEY = "zaidos-settings";

/** Preset accent colors (macOS / One UI inspired). */
export const ACCENT_PRESETS = [
  { id: "classic", label: "Blue", value: "#007aff" },
  { id: "navy", label: "Violet", value: "#5856d6" },
  { id: "teal", label: "Teal", value: "#32ade6" },
  { id: "gray", label: "Graphite", value: "#636366" },
  { id: "olive", label: "Orange", value: "#ff9500" },
] as const;

export type AccentPresetId = (typeof ACCENT_PRESETS)[number]["id"];

export function isAccentPresetId(value: unknown): value is AccentPresetId {
  return ACCENT_PRESETS.some((p) => p.id === value);
}

function normalizeAccent(value: unknown): AccentPresetId {
  if (isAccentPresetId(value)) return value;
  if (value === "matrix" || value === "cyan" || value === "purple" || value === "orange" || value === "pink") {
    return "classic";
  }
  return "classic";
}

export interface SettingsState {
  accent: AccentPresetId;
  blurEnabled: boolean;
  animationsEnabled: boolean;
  /** When true, ChatApp tries POST /api/chat before falling back to KB. */
  aiChatEnabled: boolean;
  setAccent: (accent: AccentPresetId) => void;
  setBlurEnabled: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setAiChatEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      accent: "classic",
      blurEnabled: false,
      animationsEnabled: true,
      aiChatEnabled: false,
      setAccent: (accent) => set({ accent }),
      setBlurEnabled: (blurEnabled) => set({ blurEnabled }),
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setAiChatEnabled: (aiChatEnabled) => set({ aiChatEnabled }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accent: state.accent,
        blurEnabled: state.blurEnabled,
        animationsEnabled: state.animationsEnabled,
        aiChatEnabled: state.aiChatEnabled,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<SettingsState> | null;
        return {
          ...current,
          accent: normalizeAccent(saved?.accent),
          blurEnabled:
            typeof saved?.blurEnabled === "boolean"
              ? saved.blurEnabled
              : current.blurEnabled,
          animationsEnabled:
            typeof saved?.animationsEnabled === "boolean"
              ? saved.animationsEnabled
              : current.animationsEnabled,
          aiChatEnabled:
            typeof saved?.aiChatEnabled === "boolean"
              ? saved.aiChatEnabled
              : current.aiChatEnabled,
        };
      },
    },
  ),
);

export function accentColorFor(id: AccentPresetId | "matrix"): string {
  if (id === "matrix") return "#007aff";
  return ACCENT_PRESETS.find((p) => p.id === id)?.value ?? "#007aff";
}

export const selectAiChatEnabled = (s: SettingsState) => s.aiChatEnabled;
export const selectAccent = (s: SettingsState) => s.accent;
export const selectBlurEnabled = (s: SettingsState) => s.blurEnabled;
export const selectAnimationsEnabled = (s: SettingsState) => s.animationsEnabled;
