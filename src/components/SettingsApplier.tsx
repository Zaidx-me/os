"use client";

import { useEffect } from "react";

import {
  accentColorFor,
  selectAccent,
  selectAnimationsEnabled,
  selectBlurEnabled,
  useSettingsStore,
} from "@/store/settings";

/**
 * Applies persisted settings to the document root (accent CSS var, blur,
 * animations data attributes). Mounted once in the desktop shell.
 */
export default function SettingsApplier() {
  const accent = useSettingsStore(selectAccent);
  const blurEnabled = useSettingsStore(selectBlurEnabled);
  const animationsEnabled = useSettingsStore(selectAnimationsEnabled);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-zaid-accent", accentColorFor(accent));
    root.dataset.blur = blurEnabled ? "on" : "off";
    root.dataset.animations = animationsEnabled ? "on" : "off";
  }, [accent, blurEnabled, animationsEnabled]);

  return null;
}
