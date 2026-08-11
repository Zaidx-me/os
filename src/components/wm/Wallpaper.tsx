"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  selectWallpaperType,
  useWallpaperStore,
  type WallpaperType,
} from "@/store/wallpaper";

/** Premium static wallpapers — soft mesh gradients, no animation. */
const STATIC_WALLPAPERS: Record<
  WallpaperType,
  { background: string; label: string }
> = {
  slate: {
    label: "Midnight",
    background:
      "radial-gradient(ellipse 120% 80% at 20% 10%, #4a4a5e 0%, transparent 50%), radial-gradient(ellipse 100% 70% at 80% 90%, #2d2d3a 0%, transparent 45%), linear-gradient(165deg, #1c1c22 0%, #2a2a32 50%, #1a1a20 100%)",
  },
  teal: {
    label: "Ocean",
    background:
      "radial-gradient(ellipse 90% 60% at 15% 20%, #5ac8fa 0%, transparent 55%), radial-gradient(ellipse 80% 50% at 85% 80%, #007aff 0%, transparent 50%), linear-gradient(180deg, #e8f4fc 0%, #b8dff5 40%, #7ec8e8 100%)",
  },
  sky: {
    label: "Sonoma",
    background:
      "radial-gradient(ellipse 100% 80% at 70% 0%, #ffd6e8 0%, transparent 50%), radial-gradient(ellipse 90% 70% at 10% 100%, #c8e6ff 0%, transparent 45%), linear-gradient(180deg, #dbeafe 0%, #bfdbfe 35%, #93c5fd 70%, #7dd3fc 100%)",
  },
  sand: {
    label: "Linen",
    background:
      "radial-gradient(ellipse 80% 60% at 30% 20%, #fff5eb 0%, transparent 50%), radial-gradient(ellipse 70% 50% at 80% 80%, #f5e6d3 0%, transparent 45%), linear-gradient(180deg, #faf6f0 0%, #f0e6d8 50%, #e8dcc8 100%)",
  },
};

export default function Wallpaper() {
  const type = useWallpaperStore(selectWallpaperType);
  const reducedMotion = useReducedMotion();
  const wp = STATIC_WALLPAPERS[type];

  return (
    <div
      data-testid="wallpaper"
      data-theme={type}
      aria-hidden="true"
      className="absolute inset-0 z-0 overflow-hidden"
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={type}
          data-testid={`${type}-wallpaper`}
          className="absolute inset-0"
          style={{ background: wp.background }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeInOut" }}
        />
      </AnimatePresence>
    </div>
  );
}
