"use client";

import { useCallback } from "react";
import { useMotionValue } from "motion/react";
import { AppIcon, type AppId } from "@/components/ui/AppIcon";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { APPS } from "@/lib/apps";
import { DOCK_BASE_ICON_PX } from "@/lib/motion/dock";
import { toggleAppFromDock } from "@/lib/wm/dock-actions";
import { useWmStore } from "@/store/wm";
import { isVisible } from "@/lib/wm/selectors";
import { selectPinnedApps, useLauncherPrefsStore } from "@/store/launcher-prefs";
import { useWorkspacesStore } from "@/store/workspaces";
import DockIcon from "@/components/wm/DockIcon";

const DEFAULT_DOCK: AppId[] = [
  "files",
  "browser",
  "terminal",
  "music",
  "photos",
  "chat",
  "settings",
];

function openLauncher() {
  window.dispatchEvent(new CustomEvent("zaidos:toggle-launcher"));
}

/** macOS Dock — Gaussian magnification, spring physics, transform-origin bottom. */
export default function Dock() {
  const pinned = useLauncherPrefsStore(selectPinnedApps);
  const reducedMotion = useReducedMotion();
  const cursorX = useMotionValue(Number.NaN);
  const windows = useWmStore((s) => s.windows);
  const slot = useWorkspacesStore((s) => s.workspaces[s.activeWs]);

  const uniqueIds = [...new Set([...DEFAULT_DOCK, ...pinned])].slice(0, 10);

  const onDockMove = (e: React.MouseEvent) => {
    if (reducedMotion) return;
    cursorX.set(e.clientX);
  };

  const onDockLeave = () => cursorX.set(Number.NaN);

  const launch = useCallback((appId: AppId, btn: HTMLButtonElement | null) => {
    void toggleAppFromDock(appId, btn);
  }, []);

  const isRunning = (appId: AppId) =>
    slot.windows.some((id) => windows[id]?.appId === appId && isVisible(id));

  const isBouncing = (appId: AppId) =>
    slot.windows.some((id) => windows[id]?.appId === appId);

  return (
    <nav
      data-testid="dock"
      aria-label="Dock"
      className="mac-dock pointer-events-none fixed inset-x-0 bottom-3 z-30 hidden justify-center md:flex"
    >
      <div
        onMouseMove={onDockMove}
        onMouseLeave={onDockLeave}
        className="mac-dock-inner pointer-events-auto flex items-end px-3 pb-2.5 pt-2"
      >
        {uniqueIds.map((appId) => {
          const meta = APPS.find((a) => a.id === appId);
          if (!meta) return null;
          return (
            <DockIcon
              key={appId}
              cursorX={cursorX}
              reducedMotion={reducedMotion}
              testId={`dock-app-${appId}`}
              dockAppId={appId}
              ariaLabel={meta.title}
              title={meta.title}
              running={isRunning(appId)}
              bounce={isBouncing(appId)}
              onClick={(el) => launch(appId, el)}
            >
              <span className="mac-dock-icon-wrap">
                <AppIcon appId={appId} size={DOCK_BASE_ICON_PX} className="mac-dock-icon shadow-lg" />
                <span className="mac-dock-reflection" aria-hidden="true" />
              </span>
              <span className="mac-dock-label">{meta.title}</span>
            </DockIcon>
          );
        })}

        <span className="mac-dock-divider" aria-hidden="true" />

        <DockIcon
          cursorX={cursorX}
          reducedMotion={reducedMotion}
          testId="dock-launchpad"
          ariaLabel="Launchpad"
          title="Launchpad (⌘Space)"
          className="mac-dock-launchpad active:scale-95"
          onClick={() => openLauncher()}
        >
          <span className="mac-dock-launchpad-grid" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} />
            ))}
          </span>
        </DockIcon>

        <span className="mac-dock-divider" aria-hidden="true" />

        <DockIcon
          cursorX={cursorX}
          reducedMotion={reducedMotion}
          testId="dock-trash"
          dockAppId="trash"
          ariaLabel="Trash"
          title="Trash"
          onClick={() => launch("files", null)}
        >
          <span className="mac-dock-icon-wrap">
            <svg
              width={DOCK_BASE_ICON_PX}
              height={DOCK_BASE_ICON_PX}
              viewBox="0 0 52 52"
              aria-hidden="true"
              className="mac-dock-icon"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))" }}
            >
              <defs>
                <linearGradient id="dock-trash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5f5f7" />
                  <stop offset="100%" stopColor="#d1d1d6" />
                </linearGradient>
              </defs>
              <path d="M8 14h36l-2 32H10L8 14z" fill="url(#dock-trash)" />
              <path d="M18 8h16l2 6H16l2-6z" fill="#c7c7cc" />
              <rect x="22" y="20" width="2.5" height="18" rx="1" fill="#8e8e93" />
              <rect x="29" y="20" width="2.5" height="18" rx="1" fill="#8e8e93" />
            </svg>
            <span className="mac-dock-reflection" aria-hidden="true" />
          </span>
          <span className="mac-dock-label">Trash</span>
        </DockIcon>
      </div>
    </nav>
  );
}
