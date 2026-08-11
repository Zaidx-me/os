"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon, iconShapeForApp } from "@/components/ui/AppIcon";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { APPS } from "@/lib/apps";
import { projects } from "@/content";
import { openApp } from "@/lib/wm/actions";
import { openBrowser } from "@/lib/wm/openBrowser";
import {
  getIconPosition,
  useDesktopLayoutStore,
} from "@/store/desktop-layout";

const SPIN_MS = 600;
const SPIN_CLASS = "animate-spin";
const DRAG_THRESHOLD = 4;

const LIVE_SHORTCUTS = projects.filter((p) => p.links.live).slice(0, 4);

/**
 * macOS desktop — draggable app icons over the wallpaper.
 * Drag to rearrange; positions persist in localStorage.
 */
export default function DesktopIcons() {
  const positions = useDesktopLayoutStore((s) => s.positions);
  const setPosition = useDesktopLayoutStore((s) => s.setPosition);
  const [selected, setSelected] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      drag.moved = true;
      setDraggingId(drag.id);
      setPosition(drag.id, {
        x: Math.max(8, drag.origX + dx),
        y: Math.max(8, drag.origY + dy),
      });
    };
    const onUp = () => {
      dragRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setPosition]);

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
      data-testid="desktop-icons-layer"
      role="application"
      aria-label="Desktop applications"
      onContextMenu={handleContextMenu}
      onClick={() => setSelected(null)}
      className="absolute inset-x-0 bottom-20 top-waybar z-10"
    >
      {APPS.map((app) => {
        const pos = getIconPosition(positions, app.id);
        const isSelected = selected === app.id;
        const isDragging = draggingId === app.id;
        return (
          <button
            key={app.id}
            type="button"
            data-testid={`desktop-icon-${app.id}`}
            data-selected={isSelected ? "true" : "false"}
            aria-label={app.title}
            aria-pressed={isSelected}
            style={{ left: pos.x, top: pos.y }}
            onPointerDown={(e) => {
              e.stopPropagation();
              startDrag(e, app.id, pos);
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (dragRef.current?.moved) return;
              setSelected(app.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (dragRef.current?.moved) return;
              open(app.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                open(app.id);
              }
            }}
            className={`absolute flex w-[4.5rem] touch-none select-none flex-col items-center gap-1.5 rounded-xl p-1.5 text-center text-[11px] leading-tight transition-shadow ${
              isSelected
                ? "desktop-icon-selected bg-[rgba(0,122,255,0.22)] shadow-lg ring-2 ring-[rgba(0,122,255,0.45)] backdrop-blur-sm"
                : "hover:bg-white/25"
            } ${isDragging ? "z-20 cursor-grabbing opacity-90" : "cursor-grab"} ${spinning ? SPIN_CLASS : ""}`}
          >
            <AppIcon appId={app.id} size={52} shape={iconShapeForApp(app.id)} className="drop-shadow-lg" />
            <span className={`desktop-icon-label font-medium ${isSelected ? "rounded px-1.5 py-0.5 text-zaid-text" : "text-zaid-text"}`}>
              {app.title}
            </span>
          </button>
        );
      })}
      {LIVE_SHORTCUTS.map((project, i) => {
        const pos = { x: 16 + Math.floor(APPS.length / 8 + 1) * 96, y: 16 + i * 96 };
        return (
          <button
            key={`web-${project.id}`}
            type="button"
            data-testid={`desktop-web-${project.id}`}
            aria-label={`Open ${project.title} live`}
            style={{ left: pos.x, top: pos.y }}
            onClick={(e) => {
              e.stopPropagation();
              openBrowser(project.links.live!);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              openBrowser(project.links.live!);
            }}
            className="absolute flex w-[4.5rem] select-none flex-col items-center gap-1.5 rounded-xl p-1.5 text-center text-[11px] leading-tight text-zaid-text hover:bg-white/30"
          >
            <AppIcon appId="browser" size={52} className="drop-shadow-lg" />
            <span className="line-clamp-2 font-medium">{project.title}</span>
          </button>
        );
      })}
    </div>
  );
}
