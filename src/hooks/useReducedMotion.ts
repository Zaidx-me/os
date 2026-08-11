"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { selectAnimationsEnabled, useSettingsStore } from "@/store/settings";

/**
 * Effective reduced-motion flag: system preference OR Settings animations off.
 * Used by shell animations; MotionConfig uses `user` when animations are on.
 */
export function useReducedMotion(): boolean {
  const system = usePrefersReducedMotion();
  const animationsEnabled = useSettingsStore(selectAnimationsEnabled);
  return !animationsEnabled || system;
}
