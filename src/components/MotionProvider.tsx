"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

import { selectAnimationsEnabled, useSettingsStore } from "@/store/settings";

/**
 * Global Motion reduced-motion policy: respect system when animations are
 * enabled in Settings; force instant motion when the toggle is off.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  const animationsEnabled = useSettingsStore(selectAnimationsEnabled);
  return (
    <MotionConfig reducedMotion={animationsEnabled ? "user" : "always"}>
      {children}
    </MotionConfig>
  );
}
