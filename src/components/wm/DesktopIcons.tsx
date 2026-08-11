"use client";

import { useCallback, useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { APPS } from "@/lib/apps";
import { openApp } from "@/lib/wm/actions";

/**
 * Desktop icon grid — the ZaidOS analog of the Arch/Hyprland desktop.
 *
 * Renders one selectable icon per app. Single-click selects (accent ring),
 * double-click opens the app window, Enter opens the selected icon. The grid
 * layer also owns the DESKTOP right-click surface: right-clicking the empty
 * desktop dispatches `zaidos:desktop-context` (the ContextMenu component
 * listens) and suppresses the native menu. Right-clicks that happen on the
 * window layer above are stopped by the window tiles/chrome, so they never
 * reach this handler.
 *
 * The layer spans the area below the waybar at z-10 — the window layer
 * (WorkspaceView, z-20) floats above it, so open windows cover the icons just
 * like a real desktop.
 *
 * "Refresh" (context menu) dispatches `zaidos:refresh-icons`; this component
 * plays a brief spin. Under reduced motion the spin is skipped entirely.
 */

const SPIN_MS = 600;
const SPIN_CLASS = "animate-spin";

export default function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // "Refresh" from the context menu: play a short spin on the icons.
  useEffect(() => {
    const onRefresh = () => {
      if (reducedMotion) return; // no spin under reduced motion
      setSpinning(true);
      window.setTimeout(() => setSpinning(false), SPIN_MS);
    };
    window.addEventListener("zaidos:refresh-icons", onRefresh);
    return () => window.removeEventListener("zaidos:refresh-icons", onRefresh);
  }, [reducedMotion]);

  /** Opens an app via the WM orchestrator and clears the selection. */
  const open = useCallback((appId: string) => {
    setSelected(null);
    openApp(appId);
  }, []);

  /** Desktop right-click surface — never shows the native menu. */
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
      aria-label="Desktop"
      onContextMenu={handleContextMenu}
      onClick={() => setSelected(null)}
      className="absolute inset-x-0 bottom-0 top-[var(--waybar-h)] z-10"
    >
      <div
        aria-label="Applications"
        className="flex h-full flex-col flex-wrap content-start items-start gap-1 p-2"
      >
        {APPS.map((app) => {
          const isSelected = selected === app.id;
          return (
            <button
              key={app.id}
              type="button"
              data-testid={`desktop-icon-${app.id}`}
              data-selected={isSelected ? "true" : "false"}
              aria-label={app.title}
              aria-pressed={isSelected}
              onClick={(e) => {
                e.stopPropagation();
                setSelected(app.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                open(app.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  open(app.id);
                }
              }}
              className={`flex w-20 select-none flex-col items-center gap-1 rounded-lg border p-2 text-center font-mono text-[11px] leading-tight transition-colors ${
                isSelected
                  ? "border-zaid-accent bg-zaid-accent/10 text-zaid-text"
                  : "border-transparent text-zaid-muted hover:text-zaid-text"
              } ${spinning ? SPIN_CLASS : ""}`}
            >
              <AppIcon appId={app.id} size={40} className="drop-shadow" />
              <span>{app.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
