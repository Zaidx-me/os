"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon, iconShapeForApp } from "@/components/ui/AppIcon";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getAppMeta } from "@/lib/apps";
import { openApp } from "@/lib/wm/actions";
import {
  COL_W,
  DESKTOP_PINNED_APP_IDS,
  getIconPosition,
  ROW_H,
  snapIconPosition,
  useDesktopLayoutStore,
} from "@/store/desktop-layout";

const SPIN_MS = 600;
const SPIN_CLASS = "animate-spin";
const DRAG_THRESHOLD = 4;

/**
 * macOS desktop — a small set of pinned icons on the right, draggable with snap.
 */
export default function DesktopIcons() {
  const positions = useDesktopLayoutStore((s) => s.positions);
  const setPosition = useDesktopLayoutStore((s) => s.setPosition);
  const [selected, setSelected] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const onRefresh = () => {
      if (reducedMotion) return;
      setSpinning(true);
      window.setTimeout(() => setSpinning(false), SPIN_MS);
    };
    window.addEventListener("zaidos:refresh-icons", onRefresh);
    return () => window.removeEventListener("zaidos:refresh-icons", onRefresh);
  }, [reducedMotion]);

  const open = useCallback((appId: string) => {
    setSelected(null);
    openApp(appId);
  }, []);

  const clampPosition = useCallback((pos: { x: number; y: number }) => {
    const layer = layerRef.current;
    const maxX = layer ? Math.max(8, layer.clientWidth - COL_W - 8) : pos.x;
    const maxY = layer ? Math.max(8, layer.clientHeight - ROW_H - 8) : pos.y;
    return {
      x: Math.min(Math.max(8, pos.x), maxX),
      y: Math.min(Math.max(8, pos.y), maxY),
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDraggingId(drag.id);
      setPosition(
        drag.id,
        clampPosition({
          x: drag.origX + dx,
          y: drag.origY + dy,
        }),
      );
    };
    const onUp = () => {
      const drag = dragRef.current;
      if (drag?.moved) {
        const pos = getIconPosition(useDesktopLayoutStore.getState().positions, drag.id);
        setPosition(drag.id, clampPosition(snapIconPosition(pos)));
      }
      dragRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [clampPosition, setPosition]);

  const startDrag = (
    e: React.PointerEvent,
    id: string,
    pos: { x: number; y: number },
  ) => {
    if (e.button !== 0) return;
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(
      new CustomEvent("zaidos:desktop-context", {
        detail: { x: e.clientX, y: e.clientY },
      }),
    );
  };

  return (
    <div
      ref={layerRef}
      data-testid="desktop-icons-layer"
      role="application"
      aria-label="Desktop applications"
      onContextMenu={handleContextMenu}
      onClick={() => setSelected(null)}
      className="absolute inset-x-0 bottom-20 top-waybar z-10"
    >
      {DESKTOP_PINNED_APP_IDS.map((appId) => {
        const meta = getAppMeta(appId);
        if (!meta) return null;
        const pos = getIconPosition(positions, appId);
        const isSelected = selected === appId;
        const isDragging = draggingId === appId;
        return (
          <button
            key={appId}
            type="button"
            data-testid={`desktop-icon-${appId}`}
            data-selected={isSelected ? "true" : "false"}
            aria-label={meta.title}
            aria-pressed={isSelected}
            style={{ left: pos.x, top: pos.y }}
            onPointerDown={(e) => {
              e.stopPropagation();
              startDrag(e, appId, pos);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (dragRef.current?.moved) return;
              setSelected(appId);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (dragRef.current?.moved) return;
              open(appId);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                open(appId);
              }
            }}
            className={`absolute flex w-[4.25rem] touch-none select-none flex-col items-center gap-1 rounded-xl p-1 text-center text-[10px] leading-tight transition-shadow ${
              isSelected
                ? "desktop-icon-selected bg-[rgba(0,122,255,0.22)] shadow-lg ring-2 ring-[rgba(0,122,255,0.45)] backdrop-blur-sm"
                : "hover:bg-white/20"
            } ${isDragging ? "z-20 cursor-grabbing opacity-90" : "cursor-grab"} ${spinning ? SPIN_CLASS : ""}`}
          >
            <AppIcon appId={appId} size={48} shape={iconShapeForApp(appId)} className="drop-shadow-md" />
            <span
              className={`desktop-icon-label line-clamp-2 max-w-[4.25rem] font-medium ${
                isSelected ? "rounded px-1 py-0.5 text-zaid-text" : "text-zaid-text"
              }`}
            >
              {meta.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}
