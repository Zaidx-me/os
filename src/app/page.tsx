"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import SettingsApplier from "@/components/SettingsApplier";
import BootScreen from "@/components/wm/BootScreen";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getAppMeta } from "@/lib/apps";
import { initHotkeys } from "@/lib/hotkeys";
import { closeWindow, moveWindowToWorkspace, openApp, snapWindow } from "@/lib/wm/actions";
import { useBootStore } from "@/store/boot";
import { clamp, useWmStore } from "@/store/wm";
import {
  useWorkspacesStore,
  type WorkspaceId,
} from "@/store/workspaces";

const DesktopShell = dynamic(() => import("@/components/shell/DesktopShell"), {
  ssr: false,
});
const MobileShell = dynamic(() => import("@/components/wm/MobileShell"), {
  ssr: false,
});

/**
 * ZaidOS desktop shell root (replaces the create-next-app landing page).
 *
 * Hydration gate: before the client has hydrated, a static boot placeholder
 * renders (matching SSR) so the page is never a blank white screen while JS
 * loads. After hydration, browser-only reads (localStorage, matchMedia, etc.)
 * are safe and the real boot / desktop / mobile shell mounts.
 *
 * Flow: first visit -> booted=false -> full <BootScreen/> sequence, whose
 * completeBoot() flips the store -> desktop shell mounts. Returning visits
 * rehydrate booted=true immediately -> desktop mounts with a quick fade
 * overlay (no logs).
 */
export default function Home() {
  const booted = useBootStore((s) => s.booted);
  const hydrated = useIsHydrated();
  const isMobile = useIsMobile();
  const [wasBootedAtMount] = useState(() => useBootStore.getState().booted);
  const [flashDone, setFlashDone] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!(booted && wasBootedAtMount && !reducedMotion)) return;
    const t = setTimeout(() => setFlashDone(true), 1000);
    return () => clearTimeout(t);
  }, [booted, wasBootedAtMount, reducedMotion]);

  // Global hotkeys — desktop only; mobile uses touch shell.
  useEffect(() => {
    if (!booted || isMobile) return;
    const dispose = initHotkeys({
      openTerminal: () => openApp("terminal"),
      toggleLauncher: () =>
        window.dispatchEvent(new CustomEvent("zaidos:toggle-launcher")),
      selectWorkspace: (ws) => useWorkspacesStore.getState().setActive(ws),
      closeFocused: () => {
        const workspaces = useWorkspacesStore.getState();
        const id = workspaces.workspaces[workspaces.activeWs].focused;
        if (id !== null) closeWindow(id);
      },
      minimizeFocused: () => {
        const workspaces = useWorkspacesStore.getState();
        const id = workspaces.workspaces[workspaces.activeWs].focused;
        if (id !== null) useWmStore.getState().minimize(id);
      },
      moveToWorkspace: (dir) => {
        const workspaces = useWorkspacesStore.getState();
        const id = workspaces.workspaces[workspaces.activeWs].focused;
        if (id === null) return;
        const target = clamp(
          workspaces.activeWs + dir,
          1,
          5,
        ) as WorkspaceId;
        moveWindowToWorkspace(id, target);
      },
      tile: (dir) => {
        const workspaces = useWorkspacesStore.getState();
        const id = workspaces.workspaces[workspaces.activeWs].focused;
        if (id === null) return;
        snapWindow(id, dir);
      },
      toggleFloat: () => {
        const workspaces = useWorkspacesStore.getState();
        const id = workspaces.workspaces[workspaces.activeWs].focused;
        if (id === null) return;
        useWmStore.getState().toggleFloat(id);
      },
      cycleWindows: () => {
        window.dispatchEvent(new CustomEvent("zaidos:toggle-switcher"));
      },
    });
    return dispose;
  }, [booted, isMobile]);

  // Deep-link: /?app=<appId> — desktop opens a window; mobile shell handles its own.
  useEffect(() => {
    if (!booted || isMobile) return;
    const params = new URLSearchParams(window.location.search);
    const app = params.get("app");
    if (!app || !getAppMeta(app)) return;
    openApp(app);
    window.history.replaceState({}, "", "/");
  }, [booted, isMobile]);

  if (!hydrated) {
    return (
      <div
        className="boot-screen-bg fixed inset-0 z-50 flex flex-col items-center justify-center font-sans"
        aria-busy="true"
        aria-label="Loading ZaidOS"
      >
        <div className="flex select-none items-center gap-3">
          <span className="font-display text-4xl font-semibold tracking-tight text-zaid-text">
            Zaid<span className="text-zaid-accent">OS</span>
          </span>
        </div>
        <p className="mt-6 text-xs text-zaid-muted">Booting…</p>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zaid-bg">
      <a href="#main-content" className="skip-link">
        Skip to desktop
      </a>

      <AnimatePresence mode="wait">
        {!booted ? (
          <BootScreen key="boot" />
        ) : isMobile ? (
          <motion.div
            key="mobile"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.35, ease: "easeOut" }
            }
            className="relative h-dvh w-full overflow-hidden"
          >
            <SettingsApplier />
            <MobileShell />
          </motion.div>
        ) : (
          <motion.div
            key="desktop"
            data-testid="desktop"
            id="main-content"
            role="application"
            aria-label="ZaidOS desktop"
            className="relative h-full w-full overflow-hidden"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.35, ease: "easeOut" }
            }
          >
            <SettingsApplier />
            <DesktopShell />
          </motion.div>
        )}
      </AnimatePresence>

      {booted && wasBootedAtMount && !flashDone && !reducedMotion && (
        <motion.div
          data-testid="boot-flash"
          className="pointer-events-none absolute inset-0 z-50 bg-zaid-bg"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onAnimationComplete={() => setFlashDone(true)}
        />
      )}
    </div>
  );
}
