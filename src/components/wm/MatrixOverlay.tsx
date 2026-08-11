"use client";

import { useCallback, useEffect } from "react";
import MatrixRain from "@/components/wm/MatrixRain";

/** Full-screen matrix rain overlay (todo 27) — dismiss on Esc, click, or key. */
export function MatrixOverlay({ onClose }: { onClose: () => void }) {
  const dismiss = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <div
      data-testid="matrix-overlay"
      className="fixed inset-0 z-[9999] cursor-pointer bg-zaid-bg"
      onClick={dismiss}
      role="presentation"
    >
      <MatrixRain />
      <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center font-mono text-xs text-zaid-muted">
        Press Esc or click to exit
      </p>
    </div>
  );
}
