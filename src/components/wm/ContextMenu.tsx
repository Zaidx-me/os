"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Image as ImageIcon,
  LayoutGrid,
  MonitorCog,
  Power,
  RefreshCw,
  RotateCcw,
  Terminal,
} from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { openApp } from "@/lib/wm/actions";
import { setModalOpen } from "@/lib/hotkeys";
import { useBootStore } from "@/store/boot";
import { useDesktopLayoutStore } from "@/store/desktop-layout";
import {
  WALLPAPER_TYPES,
  selectWallpaperType,
  useWallpaperStore,
  type WallpaperType,
} from "@/store/wallpaper";

/**
 * Desktop right-click context menu.
 *
 * Opens in response to `zaidos:desktop-context` (dispatched by the desktop
 * icon layer's context handler — never from inside a window). Items:
 *   Open Terminal          — opens the terminal app
 *   Change Wallpaper ▸     — 4 static variants (slate/teal/sky/sand)
 *   Refresh                — spins the desktop icons
 *   About ZaidOS           — opens the Settings app
 *   Reboot                 — replays the boot sequence
 *   Shut down              — joke dialog + power-off fade (there is no real OS)
 *
 * While the menu (or the shutdown dialog) is open, `setModalOpen(true)` blocks
 * the global hotkeys; Escape closes the menu, click-away closes it, and the
 * backdrop intercepts right-clicks so they can never re-open the menu.
 */

const WALLPAPER_LABELS: Record<WallpaperType, string> = {
  slate: "Midnight",
  teal: "Ocean",
  sky: "Sonoma",
  sand: "Linen",
};

const MENU_W = 200;
const MENU_H = 232;
const EDGE = 8;

/** Clamps the menu to the viewport so it never renders off-screen. */
function clampMenu(x: number, y: number): { x: number; y: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: Math.min(Math.max(EDGE, x), Math.max(EDGE, vw - MENU_W - EDGE)),
    y: Math.min(Math.max(EDGE, y), Math.max(EDGE, vh - MENU_H - EDGE)),
  };
}

interface MenuPos {
  x: number;
  y: number;
}

export default function ContextMenu() {
  const [menu, setMenu] = useState<MenuPos | null>(null);
  const [submenu, setSubmenu] = useState<"wallpaper" | null>(null);
  const [shutdown, setShutdown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const wallpaper = useWallpaperStore(selectWallpaperType);

  useFocusTrap(menuRef, menu !== null);

  // Block hotkeys while any modal is up.
  useEffect(() => {
    setModalOpen(menu !== null || shutdown);
    return () => setModalOpen(false);
  }, [menu, shutdown]);

  // Open on desktop right-click.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
      setMenu(clampMenu(detail.x, detail.y));
      setSubmenu(null);
    };
    window.addEventListener("zaidos:desktop-context", onOpen);
    return () => window.removeEventListener("zaidos:desktop-context", onOpen);
  }, []);

  // Escape closes the menu (and any submenu).
  useEffect(() => {
    if (menu === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSubmenu(null);
        setMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menu]);

  const close = useCallback(() => {
    setSubmenu(null);
    setMenu(null);
  }, []);

  const setWallpaper = useCallback((type: WallpaperType) => {
    useWallpaperStore.getState().setWallpaper(type);
    close();
  }, [close]);

  /** Shut down: joke dialog after a brief power-off fade. */
  const shutdownClick = useCallback(() => {
    close();
    setShutdown(true);
  }, [close]);

  return (
    <>
      {menu !== null && (
        <>
          {/* click-away + right-click-away backdrop (never re-opens the menu) */}
          <div
            data-testid="context-menu-backdrop"
            className="fixed inset-0 z-40"
            onClick={close}
            onContextMenu={(e) => {
              e.preventDefault();
              close();
            }}
          />
          <motion.div
            ref={menuRef}
            data-testid="context-menu"
            role="menu"
            aria-label="Desktop menu"
            className="window-glass hairline fixed z-50 w-[200px] p-1 font-mono text-xs text-zaid-text"
            style={{ left: menu.x, top: menu.y }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12 }}
          >
              <MenuItem
                testId="context-menu-open-terminal"
                icon={<Terminal size={13} aria-hidden="true" />}
                onClick={() => {
                  openApp("terminal");
                  close();
                }}
              >
                Open Terminal
              </MenuItem>

              <MenuItem
                testId="context-menu-wallpaper"
                icon={<ImageIcon size={13} aria-hidden="true" />}
                onClick={() => setSubmenu(submenu === "wallpaper" ? null : "wallpaper")}
              >
                Change Wallpaper
                <span className="ml-auto text-zaid-muted">▸</span>
              </MenuItem>
              {submenu === "wallpaper" && (
                <div
                  data-testid="context-menu-wallpaper-submenu"
                  role="menu"
                  aria-label="Change Wallpaper"
                  className="window-glass hairline absolute left-full top-0 z-50 w-40 -ml-1 p-1"
                >
                  {WALLPAPER_TYPES.map((type) => (
                    <MenuItem
                      key={type}
                      testId={`context-menu-wallpaper-${type}`}
                      active={wallpaper === type}
                      onClick={() => setWallpaper(type)}
                    >
                      {WALLPAPER_LABELS[type]}
                    </MenuItem>
                  ))}
                </div>
              )}

              <div className="my-1 border-t border-zaid-border" />

              <MenuItem
                testId="context-menu-refresh"
                icon={<RefreshCw size={13} aria-hidden="true" />}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("zaidos:refresh-icons"));
                  close();
                }}
              >
                Refresh
              </MenuItem>
              <MenuItem
                testId="context-menu-reset-layout"
                icon={<LayoutGrid size={13} aria-hidden="true" />}
                onClick={() => {
                  useDesktopLayoutStore.getState().resetLayout();
                  close();
                }}
              >
                Reset icon layout
              </MenuItem>
              <MenuItem
                testId="context-menu-about"
                icon={<MonitorCog size={13} aria-hidden="true" />}
                onClick={() => {
                  openApp("settings");
                  close();
                }}
              >
                About ZaidOS
              </MenuItem>

              <div className="my-1 border-t border-zaid-border" />

              <MenuItem
                testId="context-menu-reboot"
                icon={<RotateCcw size={13} aria-hidden="true" />}
                onClick={() => {
                  useBootStore.getState().resetBoot();
                  close();
                }}
              >
                Reboot
              </MenuItem>
              <MenuItem
                testId="context-menu-shutdown"
                icon={<Power size={13} aria-hidden="true" />}
                danger
                onClick={shutdownClick}
              >
                Shut down
              </MenuItem>
            </motion.div>
          </>
        )}

      <ShutdownDialog
        open={shutdown}
        onDismiss={() => setShutdown(false)}
      />
    </>
  );
}

/** One menu row (role=menuitem) — shared styling + a11y. */
function MenuItem({
  testId,
  icon,
  active,
  danger,
  onClick,
  children,
}: {
  testId: string;
  icon?: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-testid={testId}
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
        danger
          ? "text-zaid-danger hover:bg-zaid-danger/10"
          : active
            ? "bg-zaid-accent/10 text-zaid-accent"
            : "text-zaid-text hover:bg-zaid-surface2"
      }`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

/** Power-off joke dialog — ZaidOS can't actually shut down (it's a website). */
function ShutdownDialog({ open, onDismiss }: { open: boolean; onDismiss: () => void }) {
  if (!open) return null;
  return (
    <div
      data-testid="shutdown-dialog"
      role="dialog"
      aria-label="Shut down"
      className="fixed inset-0 z-[70] flex items-center justify-center"
    >
      {/* power-off fade: screen dims like a monitor losing signal */}
      <motion.div
        data-testid="shutdown-overlay"
        className="absolute inset-0 bg-zaid-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeIn" }}
      />
      <motion.div
        className="window-glass hairline relative z-10 w-80 p-5 font-mono text-xs text-zaid-text"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zaid-danger">
              <Power size={14} aria-hidden="true" /> Powering down…
            </h2>
            <p className="mt-3 leading-relaxed text-zaid-muted">
              Nice try — ZaidOS is a website, not an operating system. There is
              no kernel, no init, and definitely no shutdown. Reboot instead?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                data-testid="shutdown-dialog-dismiss"
                onClick={onDismiss}
                className="rounded-md border border-zaid-border px-3 py-1.5 text-zaid-muted transition-colors hover:bg-zaid-surface2 hover:text-zaid-text"
              >
                Dismiss
              </button>
              <button
                type="button"
                data-testid="shutdown-dialog-reboot"
                onClick={() => useBootStore.getState().resetBoot()}
                className="rounded-md bg-zaid-accent px-3 py-1.5 font-semibold text-zaid-bg transition-colors hover:brightness-110"
              >
                Reboot
              </button>
            </div>
          </motion.div>
        </div>
    );
}
