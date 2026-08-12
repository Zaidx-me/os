"use client";

import { useState } from "react";
import { site, wallpapers } from "@/content";
import {
  OsAppShell,
  OsPanel,
  OsSection,
  OsSwitch,
} from "@/components/os";
import {
  ACCENT_PRESETS,
  selectAccent,
  selectAiChatEnabled,
  selectAnimationsEnabled,
  selectBlurEnabled,
  useSettingsStore,
} from "@/store/settings";
import {
  WALLPAPER_TYPES,
  selectWallpaperType,
  useWallpaperStore,
  type WallpaperType,
} from "@/store/wallpaper";
import { pushNotification } from "@/store/notifications";

const WALLPAPER_LABELS: Record<WallpaperType, string> = {
  slate: "Midnight",
  teal: "Ocean",
  sky: "Sonoma",
  sand: "Linen",
};

const TABS = ["Appearance", "System", "About"] as const;

export function SettingsApp() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Appearance");
  const wallpaper = useWallpaperStore(selectWallpaperType);
  const setWallpaper = useWallpaperStore((s) => s.setWallpaper);
  const accent = useSettingsStore(selectAccent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const blurEnabled = useSettingsStore(selectBlurEnabled);
  const setBlurEnabled = useSettingsStore((s) => s.setBlurEnabled);
  const animationsEnabled = useSettingsStore(selectAnimationsEnabled);
  const setAnimationsEnabled = useSettingsStore((s) => s.setAnimationsEnabled);
  const aiChatEnabled = useSettingsStore(selectAiChatEnabled);
  const setAiChatEnabled = useSettingsStore((s) => s.setAiChatEnabled);

  return (
    <OsAppShell testId="app-content-settings">
      <div className="flex h-full min-h-0 flex-col">
        <nav
          aria-label="Settings sections"
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-zaid-border bg-zaid-surface2/50 p-2 sm:hidden"
        >
          {TABS.map((label) => (
            <button
              key={label}
              type="button"
              data-testid={`settings-tab-${label.toLowerCase()}-mobile`}
              onClick={() => setTab(label)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === label
                  ? "bg-zaid-accent text-white"
                  : "text-zaid-muted hover:bg-zaid-surface hover:text-zaid-text"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex min-h-0 flex-1">
        <aside className="hidden w-40 shrink-0 border-r border-zaid-border bg-zaid-surface2/50 p-3 sm:block">
          {TABS.map((label) => (
            <button
              key={label}
              type="button"
              data-testid={`settings-tab-${label.toLowerCase()}`}
              onClick={() => setTab(label)}
              className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                tab === label
                  ? "bg-zaid-accent font-medium text-white shadow-sm"
                  : "text-zaid-muted hover:bg-zaid-surface hover:text-zaid-text"
              }`}
            >
              {label}
            </button>
          ))}
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
          <h1 className="mb-1 hidden font-sans text-lg font-semibold text-zaid-text sm:block">
            Settings
          </h1>
          <p className="label-caps mb-4 sm:mb-6">System preferences</p>

          {tab === "Appearance" && (
            <>
              <OsSection title="Wallpaper">
                <div
                  data-testid="settings-wallpaper-picker"
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {WALLPAPER_TYPES.map((type) => {
                    const meta = wallpapers.find((w) => w.type === type);
                    return (
                      <button
                        key={type}
                        type="button"
                        data-testid={`settings-wallpaper-${type}`}
                        onClick={() => {
                          setWallpaper(type);
                          pushNotification("Wallpaper changed", meta?.name ?? type);
                        }}
                        className={`rounded-2xl border px-3 py-3 text-left text-xs transition-all ${
                          wallpaper === type
                            ? "border-zaid-accent bg-zaid-accent/10 text-zaid-accent ring-1 ring-zaid-accent/20"
                            : "border-zaid-border text-zaid-text hover:border-zaid-accent/30 hover:bg-zaid-surface2"
                        }`}
                      >
                        {meta?.name ?? WALLPAPER_LABELS[type]}
                      </button>
                    );
                  })}
                </div>
              </OsSection>

              <OsSection title="Accent color">
                <div data-testid="settings-accent-picker" className="flex flex-wrap gap-2">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`settings-accent-${preset.id}`}
                      onClick={() => {
                        setAccent(preset.id);
                        pushNotification("Accent updated", preset.label);
                      }}
                      className={`hairline flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] ${
                        accent === preset.id
                          ? "border-zaid-accent text-zaid-accent"
                          : "text-zaid-text"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: preset.value }}
                        aria-hidden
                      />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </OsSection>
            </>
          )}

          {tab === "System" && (
            <OsSection title="Effects & AI">
              <OsPanel className="flex flex-col gap-4">
                <OsSwitch
                  label="Menu & panel vibrancy"
                  checked={blurEnabled}
                  onChange={setBlurEnabled}
                  testId="settings-blur-toggle"
                />
                <OsSwitch
                  label="Animations"
                  checked={animationsEnabled}
                  onChange={setAnimationsEnabled}
                  testId="settings-animations-toggle"
                />
                <OsSwitch
                  label="ZaidGPT AI mode (requires LLM_API_KEY)"
                  checked={aiChatEnabled}
                  onChange={setAiChatEnabled}
                  testId="settings-ai-toggle"
                />
              </OsPanel>
            </OsSection>
          )}

          {tab === "About" && (
            <OsPanel>
              <h2
                data-testid="settings-about-heading"
                className="mb-2 text-sm font-semibold text-zaid-text"
              >
                About {site.name}
              </h2>
              <p className="text-xs leading-relaxed text-zaid-muted">
                {site.name} is a web desktop portfolio for {site.owner} — Hyprland
                rice cosplay in the browser. Boot it, open apps, run fake terminal
                commands, chat with ZaidGPT, play games. Not a real OS; just vibes.
              </p>
            </OsPanel>
          )}
        </div>
        </div>
      </div>
    </OsAppShell>
  );
}

export default SettingsApp;
