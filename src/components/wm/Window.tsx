"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { Copy, Minus, Square, X } from "lucide-react";
import { motion } from "motion/react";
import { AppIcon } from "@/components/ui/AppIcon";
import WindowHost from "@/components/wm/WindowHost";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { closeWindow, focusWindow, snapWindow } from "@/lib/wm/actions";
import {
  dragBounds,
  getViewport,
  maximizeBounds,
  resizeBounds,
  snapBounds,
  snapZoneAt,
  useWmStore,
  type ResizeDir,
  type SnapDir,
  type WindowState,
} from "@/store/wm";
import {
  selectActiveWs,
  selectWorkspace,
  useWorkspacesStore,
} from "@/store/workspaces";

/**
 * ZaidOS window chrome (todo 13): titlebar (AppIcon + title + minimize /
 * maximize / close controls) over an app content area. Windows render
 * absolutely inside WorkspaceView's layer, positioned from the wm store.
 *
 * Interactions are MANUAL pointer math — never framer-motion drag — so drag
 * and resize stay deterministic and the store is the single source of truth:
 *   - titlebar pointer drag  -> wm.setBounds via dragBounds (viewport-clamped,
 *     never above the waybar). Dragging is DISABLED while maximized — you
 *     must restore the window first (restore via Maximize button or
 *     double-clicking the titlebar).
 *   - drag into an edge zone  -> glass snap preview (left half / right half /
 *     full, via snapZoneAt + snapBounds); releasing inside the zone snaps the
 *     window (wm.snap remembers the pre-snap float bounds for Mod+F restore).
 *   - double-click titlebar  -> toggle maximize.
 *   - 8 invisible resize handles (cursor styles) -> wm.setBounds via
 *     resizeBounds (360x240 minimum, anchored edges). Also disabled while
 *     maximized.
 *   - pointerdown anywhere on the window focuses it (both stores).
 *   - minimize keeps the window mounted with aria-hidden + visibility hidden
 *     (the waybar task buttons that restore it land in todo 16).
 *   - close removes the window from both stores; focus falls back to the
 *     previous window (workspaces.closeWindow + wm.close promotion).
 *
 * Maximize renders computed bounds (workspace minus waybar + 8px gutter) and
 * leaves the store's float bounds untouched, so restoring is lossless.
 * AnimatePresence exit is supported via a snapshot: when the stores drop the
 * window, the last known state keeps the frame mounted for the close
 * animation.
 */

const TITLEBAR_H = "h-9"; // 2.25rem — matches the density of the waybar
const OPEN_MS = 0.2; // open/close scale+fade duration

type DragGesture = {
  kind: "drag";
  start: { x: number; y: number; w: number; h: number };
  origin: { x: number; y: number };
};

type ResizeGesture = {
  kind: "resize";
  dir: ResizeDir;
  start: { x: number; y: number; w: number; h: number };
  origin: { x: number; y: number };
};

type Gesture = DragGesture | ResizeGesture;

const RESIZE_HANDLES: { dir: ResizeDir; className: string }[] = [
  { dir: "n", className: "inset-x-2 -top-1.5 h-3 cursor-ns-resize" },
  { dir: "s", className: "inset-x-2 -bottom-1.5 h-3 cursor-ns-resize" },
  { dir: "e", className: "-right-1.5 inset-y-2 w-3 cursor-ew-resize" },
  { dir: "w", className: "-left-1.5 inset-y-2 w-3 cursor-ew-resize" },
  { dir: "ne", className: "-right-1.5 -top-1.5 h-3 w-3 cursor-nesw-resize" },
  { dir: "nw", className: "-left-1.5 -top-1.5 h-3 w-3 cursor-nwse-resize" },
  { dir: "se", className: "-bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize" },
  { dir: "sw", className: "-bottom-1.5 -left-1.5 h-3 w-3 cursor-nesw-resize" },
];

/** Best-effort pointer capture (jsdom has none — the window listener covers it). */
function capturePointer(e: ReactPointerEvent<HTMLElement>): void {
  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {
    /* jsdom: no pointer capture API */
  }
}

export interface WindowProps {
  windowId: string;
}

export default function Window({ windowId }: WindowProps) {
  const win = useWmStore((s) => s.windows[windowId]);
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { focused } = useWorkspacesStore(selectWorkspace(activeWs));
  const reducedMotion = usePrefersReducedMotion();
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [snapZone, setSnapZone] = useState<SnapDir | null>(null);
  const snapZoneRef = useRef<SnapDir | null>(null);

  // Last known state while closing: the stores drop the window synchronously,
  // but AnimatePresence keeps this child mounted to play the exit animation.
  // The snapshot is adjusted during render (React's derived-state pattern), so
  // when `win` becomes undefined the frame still renders the final state.
  const [snapshot, setSnapshot] = useState<WindowState | undefined>(win);
  if (win !== undefined && win !== snapshot) {
    setSnapshot(win);
  }

  // Active drag/resize: window-level listeners so the gesture survives the
  // pointer leaving the element (pointer capture is a best-effort bonus).
  useEffect(() => {
    if (gesture === null) return;
    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - gesture.origin.x;
      const dy = e.clientY - gesture.origin.y;
      const vp = getViewport();
      if (gesture.kind === "drag") {
        const zone = snapZoneAt({ x: e.clientX, y: e.clientY }, vp);
        if (snapZoneRef.current !== zone) {
          snapZoneRef.current = zone;
          setSnapZone(zone);
        }
        useWmStore.getState().setBounds(windowId, dragBounds(gesture.start, dx, dy, vp));
      } else {
        useWmStore.getState().setBounds(windowId, resizeBounds(gesture.start, gesture.dir, dx, dy, vp));
      }
    };
    const handleUp = () => {
      if (gesture.kind === "drag" && snapZoneRef.current !== null) {
        snapWindow(windowId, snapZoneRef.current);
      }
      snapZoneRef.current = null;
      setSnapZone(null);
      setGesture(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [gesture, windowId]);

  const current = win ?? snapshot;
  if (current === undefined) return null;

  const isFocused = focused === windowId;
  const bounds = current.maximized
    ? maximizeBounds(getViewport())
    : { x: current.x, y: current.y, w: current.w, h: current.h };

  const startGesture = (
    e: ReactPointerEvent<HTMLElement>,
    kind: Gesture["kind"],
    dir?: ResizeDir,
  ) => {
    if (current.maximized) return; // restore first — no drag/resize while maximized
    const start = { x: current.x, y: current.y, w: current.w, h: current.h };
    const origin = { x: e.clientX, y: e.clientY };
    setGesture(
      kind === "drag"
        ? { kind, start, origin }
        : { kind, dir: dir as ResizeDir, start, origin },
    );
    capturePointer(e);
  };

  const onTitlebarPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("button") !== null) return;
    startGesture(e, "drag");
  };

  const onTitlebarDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button") !== null) return;
    useWmStore.getState().toggleMaximize(windowId);
  };

  const previewBounds = snapZone !== null ? snapBounds(snapZone, getViewport()) : null;

  return (
    <motion.div
      data-testid={`window-${current.appId}`}
      data-window={current.id}
      data-app={current.appId}
      data-focused={isFocused ? "true" : "false"}
      data-minimized={current.minimized ? "true" : "false"}
      data-maximized={current.maximized ? "true" : "false"}
      data-mode={current.mode}
      role="dialog"
      aria-label={`${current.title} window`}
      aria-hidden={current.minimized}
      className="absolute select-none"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.w,
        height: bounds.h,
        zIndex: current.z,
        visibility: current.minimized ? "hidden" : "visible",
        pointerEvents: current.minimized ? "none" : "auto",
      }}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      transition={{ duration: reducedMotion ? 0 : OPEN_MS, ease: "easeOut" }}
      onPointerDown={() => focusWindow(windowId)}
    >
      <div
        className={`window-glass hairline flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-window)] border ${
          isFocused ? "border-zaid-accent/50" : ""
        }`}
      >
        <div
          data-testid="window-titlebar"
          onPointerDown={onTitlebarPointerDown}
          onDoubleClick={onTitlebarDoubleClick}
          className={`flex ${TITLEBAR_H} shrink-0 touch-none cursor-default items-center gap-2 border-b px-2 font-mono text-xs ${
            isFocused
              ? "border-zaid-accent/40 bg-zaid-surface2/80 text-zaid-text"
              : "border-zaid-border bg-zaid-surface2/40 text-zaid-muted"
          }`}
        >
          <AppIcon appId={current.appId} size={14} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate" title={current.title}>
            {current.title}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              data-testid="window-minimize"
              aria-label="Minimize window"
              title="Minimize"
              onClick={() => useWmStore.getState().minimize(windowId)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-surface hover:text-zaid-text"
            >
              <Minus size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              data-testid="window-maximize"
              aria-label={current.maximized ? "Restore window" : "Maximize window"}
              title={current.maximized ? "Restore" : "Maximize"}
              onClick={() => useWmStore.getState().toggleMaximize(windowId)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-surface hover:text-zaid-text"
            >
              {current.maximized ? (
                <Copy size={12} aria-hidden="true" />
              ) : (
                <Square size={12} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              data-testid="window-close"
              aria-label="Close window"
              title="Close"
              onClick={() => closeWindow(windowId)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-zaid-muted transition-colors hover:bg-zaid-danger hover:text-zaid-bg"
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          data-testid="window-content"
          className="relative flex-1 overflow-hidden"
        >
          <WindowHost windowId={windowId} appId={current.appId} />
        </div>
      </div>

      {!current.maximized && (
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.dir}
              data-testid={`window-resize-${handle.dir}`}
              onPointerDown={(e) => startGesture(e, "resize", handle.dir)}
              className={`pointer-events-auto absolute ${handle.className}`}
            />
          ))}
        </div>
      )}

      {previewBounds !== null &&
        createPortal(
          <div
            data-testid="snap-preview"
            aria-hidden="true"
            className="window-glass hairline pointer-events-none fixed z-30 rounded-[var(--radius-window)] border-2 border-zaid-accent/60"
            style={{
              left: previewBounds.x,
              top: previewBounds.y,
              width: previewBounds.w,
              height: previewBounds.h,
            }}
          />,
          document.body,
        )}
    </motion.div>
  );
}
