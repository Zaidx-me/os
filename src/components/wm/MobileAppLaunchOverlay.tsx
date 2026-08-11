"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { AppIcon, type AppId } from "@/components/ui/AppIcon";
import { motionTokens } from "@/lib/motion/spring";
import type { LocalRect } from "@/lib/wm/mobile-open";
import { squircleRadiusPx } from "@/lib/wm/mobile-open";

interface MobileAppLaunchOverlayProps {
  appId: AppId;
  startRect: LocalRect;
  containerSize: { width: number; height: number };
  onComplete: () => void;
}

/**
 * iOS app open: anchor animation to the tapped icon's DOM rect,
 * scale to full screen while border-radius eases from squircle → 0.
 */
export default function MobileAppLaunchOverlay({
  appId,
  startRect,
  containerSize,
  onComplete,
}: MobileAppLaunchOverlayProps) {
  const startRadius = squircleRadiusPx(startRect.width);
  const targetWidth = containerSize.width || startRect.width;
  const targetHeight = containerSize.height || startRect.height;

  useEffect(() => {
    const id = window.setTimeout(onComplete, 400);
    return () => window.clearTimeout(id);
  }, [onComplete]);

  return (
    <motion.div
      data-testid="mobile-app-launch-overlay"
      className="pointer-events-none absolute z-50 overflow-hidden bg-zaid-surface"
      initial={{
        left: startRect.x,
        top: startRect.y,
        width: startRect.width,
        height: startRect.height,
        borderRadius: startRadius,
        opacity: 1,
      }}
      animate={{
        left: 0,
        top: 0,
        width: targetWidth,
        height: targetHeight,
        borderRadius: 0,
        opacity: 1,
      }}
      transition={motionTokens.spring.hero}
    >
      <div className="flex h-full w-full items-center justify-center bg-zaid-surface/90">
        <AppIcon appId={appId} size={Math.min(startRect.width, 72)} />
      </div>
    </motion.div>
  );
}
