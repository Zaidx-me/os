"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import {
  dockGaussianScale,
  dockLiftPx,
  dockSlotWidthPx,
} from "@/lib/motion/dock";
import { motionTokens } from "@/lib/motion/spring";

interface DockIconProps {
  cursorX: MotionValue<number>;
  reducedMotion: boolean;
  testId?: string;
  dockAppId?: string;
  ariaLabel: string;
  title?: string;
  className?: string;
  onClick: (el: HTMLButtonElement) => void;
  running?: boolean;
  bounce?: boolean;
  children: ReactNode;
}

/** Single dock tile — Gaussian magnification with layout-aware slot width. */
export default function DockIcon({
  cursorX,
  reducedMotion,
  testId,
  dockAppId,
  ariaLabel,
  title,
  className = "",
  onClick,
  running = false,
  bounce = false,
  children,
}: DockIconProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [centerX, setCenterX] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      setCenterX(r.left + r.width / 2);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const targetScale = useTransform(cursorX, (x) => {
    if (reducedMotion || !Number.isFinite(x)) return 1;
    return dockGaussianScale(Math.abs(x - centerX));
  });

  const scale = useSpring(targetScale, motionTokens.spring.snappy);
  const slotWidth = useTransform(scale, (s) => dockSlotWidthPx(s));
  const liftY = useTransform(scale, (s) => dockLiftPx(s));

  return (
    <motion.button
      ref={ref}
      type="button"
      data-testid={testId}
      data-dock-app={dockAppId}
      aria-label={ariaLabel}
      title={title}
      onClick={() => ref.current && onClick(ref.current)}
      style={
        reducedMotion
          ? undefined
          : {
              width: slotWidth,
              y: liftY,
              transformOrigin: "bottom center",
            }
      }
      className={`mac-dock-item group relative flex flex-col items-center justify-end ${bounce ? "mac-dock-bounce" : ""} ${className}`}
    >
      <motion.div
        className="mac-dock-item-inner"
        style={
          reducedMotion
            ? undefined
            : {
                scale,
                transformOrigin: "bottom center",
              }
        }
      >
        {children}
      </motion.div>
      {running && <span className="mac-dock-dot" aria-hidden="true" />}
    </motion.button>
  );
}