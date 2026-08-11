"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Power, Search, SlidersHorizontal, Volume2, Wifi } from "lucide-react";
import { motion } from "motion/react";
import { AppIcon } from "@/components/ui/AppIcon";
import ControlCenter from "@/components/wm/ControlCenter";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getAppMeta } from "@/lib/apps";
import { focusWindow, openApp } from "@/lib/wm/actions";
import { isVisible } from "@/lib/wm/selectors";
import { useBootStore } from "@/store/boot";
import {
  selectNotifications,
  selectUnreadCount,
  useNotificationStore,
} from "@/store/notifications";
import {
  selectBattery,
  selectMuted,
  selectVolume,
  selectWifi,
  useSystrayStore,
} from "@/store/systray";
import { useWmStore } from "@/store/wm";
import { selectActiveWs, selectWorkspace, useWorkspacesStore } from "@/store/workspaces";

const MENU_ITEMS = ["File", "Edit", "View", "Window", "Help"] as const;
const CLOCK_MS = 60_000;
const LOGOUT_MS = 400;

function formatClock(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Waybar() {
  const activeWs = useWorkspacesStore(selectActiveWs);
  const { windows: wsWindows, focused } = useWorkspacesStore(
    selectWorkspace(activeWs),
  );
  const wmWindows = useWmStore((s) => s.windows);
  const reducedMotion = useReducedMotion();

  const [now, setNow] = useState(() => new Date());
  const [powerOpen, setPowerOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [ccOpen, setCcOpen] = useState(false);

  const volume = useSystrayStore(selectVolume);
  const muted = useSystrayStore(selectMuted);
  const wifi = useSystrayStore(selectWifi);
  const battery = useSystrayStore(selectBattery);
  const toggleMute = useSystrayStore((s) => s.toggleMute);
  const toggleWifi = useSystrayStore((s) => s.toggleWifi);
  const notifications = useNotificationStore(selectNotifications);
  const unread = useNotificationStore(selectUnreadCount);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const frontApp = useMemo(() => {
    if (focused === null) return "Finder";
    const win = wmWindows[focused];
    if (!win || !isVisible(focused)) return "Finder";
    return getAppMeta(win.appId)?.title ?? win.title;
  }, [focused, wmWindows]);

  useEffect(() => {
    const clockId = window.setInterval(() => setNow(new Date()), CLOCK_MS);
    return () => window.clearInterval(clockId);
  }, []);

  useEffect(() => {
    if (!powerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPowerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [powerOpen]);

  const openLauncher = () => {
    window.dispatchEvent(new CustomEvent("zaidos:toggle-launcher"));
  };

  const onTaskClick = (id: string, minimized: boolean) => {
    const workspaces = useWorkspacesStore.getState();
    const slot = workspaces.workspaces[workspaces.activeWs];
    if (slot.focused === id && !minimized) {
      useWmStore.getState().minimize(id);
    } else {
      focusWindow(id);
    }
  };

  const logout = () => {
    setPowerOpen(false);
    if (reducedMotion) {
      useBootStore.getState().resetBoot();
      return;
    }
    setLoggingOut(true);
    window.setTimeout(() => useBootStore.getState().resetBoot(), LOGOUT_MS);
  };

  return (
    <header
      data-testid="waybar"
      role="banner"
      aria-label="ZaidOS menu bar"
      className="waybar-tahoe fixed inset-x-0 top-0 z-40 hidden h-waybar items-center gap-1 px-3 font-sans text-xs text-zaid-muted md:flex"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <button
          type="button"
          data-testid="waybar-brand"
          title="ZaidOS — interactive portfolio desktop"
          aria-label="About ZaidOS"
          onClick={() => openApp("about")}
          className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-black/5"
        >
          <AppIcon appId="about" size={16} />
          <span className="text-sm font-semibold text-zaid-text">ZaidOS</span>
        </button>

        <span
          data-testid="waybar-front-app"
          className="hidden truncate pl-1 text-sm font-semibold text-zaid-text sm:inline"
        >
          {frontApp}
        </span>

        <nav
          role="menubar"
          aria-label="Application menus"
          data-testid="waybar-menus"
          className="hidden items-center gap-0.5 lg:flex"
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              role="menuitem"
              data-testid={`waybar-menu-${item.toLowerCase()}`}
              className="rounded-md px-2 py-1 text-zaid-text/85 hover:bg-black/5"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div
        role="toolbar"
        aria-label="Windows"
        data-testid="waybar-tasks"
        className="hidden min-w-0 max-w-[24rem] items-center gap-1 overflow-hidden xl:flex"
      >
        {wsWindows.map((id) => {
          const win = wmWindows[id];
          if (win === undefined) return null;
          const active = focused === id;
          const visible = isVisible(id);
          return (
            <button
              key={id}
              type="button"
              data-testid={`waybar-task-${win.appId}`}
              data-window={id}
              data-app={win.appId}
              data-active={active ? "true" : "false"}
              data-minimized={visible ? "false" : "true"}
              aria-label={win.title}
              title={win.title}
              onClick={() => onTaskClick(id, !visible)}
              className={`flex h-7 min-w-0 max-w-40 items-center gap-1.5 rounded-full px-2.5 text-xs transition-colors ${
                active
                  ? "bg-black/8 text-zaid-text"
                  : "text-zaid-muted hover:bg-black/5 hover:text-zaid-text"
              } ${visible ? "opacity-100" : "opacity-45"}`}
            >
              <AppIcon appId={win.appId} size={14} variant="glyph" className="shrink-0" />
              <span className="truncate">{win.title}</span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 pl-1">
        <div data-testid="waybar-systray" className="flex items-center">
          <button
            type="button"
            data-testid="waybar-volume"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => toggleMute()}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5"
          >
            <Volume2 size={14} className={muted ? "opacity-40" : ""} />
          </button>
          <button
            type="button"
            data-testid="waybar-wifi"
            aria-label={wifi ? "Wi-Fi connected" : "Wi-Fi disconnected"}
            onClick={() => toggleWifi()}
            className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5 ${
              wifi ? "text-zaid-text" : "text-zaid-muted"
            }`}
          >
            <Wifi size={14} />
          </button>
          <span
            data-testid="waybar-battery"
            className="hidden px-1 text-[10px] tabular-nums xl:inline"
          >
            {battery}%
          </span>
          <button
            type="button"
            data-testid="waybar-control-center"
            aria-label="Control Center"
            onClick={() => {
              setCcOpen((o) => !o);
              setNotifyOpen(false);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5"
          >
            <SlidersHorizontal size={14} />
          </button>
          <button
            type="button"
            data-testid="waybar-notifications"
            aria-label="Notifications"
            onClick={() => {
              setNotifyOpen((o) => !o);
              setCcOpen(false);
            }}
            className="relative flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5"
          >
            <Bell size={14} />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        <div className="mx-1 flex items-center gap-1.5 border-l border-black/10 pl-2">
          <span data-testid="waybar-clock" className="text-sm font-semibold text-zaid-text tabular-nums">
            {formatClock(now)}
          </span>
          <span data-testid="waybar-date" className="hidden text-[10px] xl:inline">
            {formatDate(now)}
          </span>
        </div>

        <button
          type="button"
          data-testid="waybar-spotlight"
          aria-label="Spotlight Search"
          title="Spotlight (⌘Space)"
          onClick={openLauncher}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-black/5"
        >
          <Search size={15} aria-hidden="true" />
        </button>

        <button
          type="button"
          data-testid="waybar-launcher"
          aria-label="Open Spotlight"
          onClick={openLauncher}
          className="sr-only"
        >
          Spotlight
        </button>

        <button
          type="button"
          data-testid="power-button"
          aria-label="Power menu"
          onClick={() => setPowerOpen(true)}
          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/90 hover:text-white"
        >
          <Power size={14} aria-hidden="true" />
        </button>
      </div>

      <ControlCenter open={ccOpen} onClose={() => setCcOpen(false)} />

      {powerOpen && (
        <>
          <div
            data-testid="power-menu-backdrop"
            className="fixed inset-0 z-40"
            onClick={() => setPowerOpen(false)}
          />
          <div
            data-testid="power-menu"
            role="dialog"
            aria-label="Power menu"
            className="window-glass hairline fixed right-3 top-[calc(var(--waybar-h)+0.5rem)] z-50 flex w-40 flex-col gap-0.5 rounded-lg p-1 font-mono text-xs"
          >
            <button
              type="button"
              data-testid="power-menu-reboot"
              onClick={() => useBootStore.getState().resetBoot()}
              className="flex items-center rounded px-2 py-1.5 text-left text-zaid-text hover:bg-zaid-surface2"
            >
              Reboot
            </button>
            <button
              type="button"
              data-testid="power-menu-logout"
              onClick={logout}
              className="flex items-center rounded px-2 py-1.5 text-left text-zaid-text hover:bg-zaid-surface2"
            >
              Log out
            </button>
            <button
              type="button"
              data-testid="power-menu-cancel"
              onClick={() => setPowerOpen(false)}
              className="flex items-center rounded px-2 py-1.5 text-left text-zaid-muted hover:bg-zaid-surface2"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {notifyOpen && (
        <>
          <div
            data-testid="notifications-backdrop"
            className="fixed inset-0 z-40"
            onClick={() => setNotifyOpen(false)}
          />
          <div
            data-testid="notifications-panel"
            role="dialog"
            aria-label="Notifications"
            className="window-glass hairline fixed right-3 top-[calc(var(--waybar-h)+0.5rem)] z-50 w-72 rounded-lg p-2 font-mono text-xs"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-semibold text-zaid-text">Notifications</span>
              {notifications.length > 0 && (
                <button
                  type="button"
                  data-testid="notifications-mark-all"
                  onClick={markAllRead}
                  className="text-[10px] text-zaid-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-2 py-4 text-center text-zaid-muted">No notifications</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto">
                {notifications.slice(0, 12).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      data-testid={`notification-${n.id}`}
                      onClick={() => markRead(n.id)}
                      className={`mb-1 w-full rounded-md px-2 py-2 text-left ${
                        n.read ? "opacity-60" : "bg-zaid-accent/15"
                      }`}
                    >
                      <p className="text-zaid-text">{n.title}</p>
                      {n.body && <p className="text-[10px] text-zaid-muted">{n.body}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {loggingOut && !reducedMotion && (
        <motion.div
          data-testid="logout-overlay"
          className="fixed inset-0 z-[60] bg-zaid-bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: LOGOUT_MS / 1000, ease: "easeIn" }}
        />
      )}
    </header>
  );
}
