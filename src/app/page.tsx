"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import BootScreen from "@/components/wm/BootScreen";
import ContextMenu from "@/components/wm/ContextMenu";
import DesktopIcons from "@/components/wm/DesktopIcons";
import Launcher from "@/components/wm/Launcher";
import Wallpaper from "@/components/wm/Wallpaper";
import Waybar from "@/components/wm/Waybar";
import { WorkspaceView } from "@/components/wm/WorkspaceView";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { initHotkeys } from "@/lib/hotkeys";
import { closeWindow, moveWindowToWorkspace, openApp, snapWindow } from "@/lib/wm/actions";
import { useBootStore } from "@/store/boot";
import { clamp, useWmStore } from "@/store/wm";
import {
  useWorkspacesStore,
  type WorkspaceId,
} from "@/store/workspaces";

/**
 * ZaidOS desktop shell root (replaces the create-next-app landing page).
 *
 * Hydration gate: the ENTIRE shell (boot screen + desktop) renders behind
 * `useIsHydrated()` — every browser-only read (localStorage via the
 * persisted boot store, matchMedia, innerWidth, ResizeObserver) happens only
 * after the client has hydrated, so SSR output and the first client render
 * both emit nothing and persisted-store rehydration can never cause a
 * hydration mismatch.
 *
 * Flow: first visit -> booted=false -> full <BootScreen/> sequence, whose
 * completeBoot() flips the store -> desktop shell mounts. Returning visits
 * rehydrate booted=true immediately -> desktop mounts with a quick fade
 * overlay (no logs).
 */
export default function Home() {
  const booted = useBootStore((s) => s.booted);
  const hydrated = useIsHydrated();
  // True when this visit STARTED already booted (returning visitor) — those
  // get the quick fade overlay; first-visit boots get the full sequence and
  // BootScreen's own exit fade covers the transition. Captured in a lazy
  // initializer: the store rehydrates synchronously from localStorage at
  // module load, before any interaction can call completeBoot, so this is
  // the persisted value for the visit.
  const [wasBootedAtMount] = useState(() => useBootStore.getState().booted);
  const [flashDone, setFlashDone] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // Safety net for the quick-fade overlay: even if the fade animation's
  // completion callback never fires (hidden tab, disabled JS animations),
  // unmount the overlay after 1s so it can never block the desktop.
  useEffect(() => {
    if (!(booted && wasBootedAtMount && !reducedMotion)) return;
    const t = setTimeout(() => setFlashDone(true), 1000);
    return () => clearTimeout(t);
  }, [booted, wasBootedAtMount, reducedMotion]);

  // Global hotkeys (lib/hotkeys.ts) — wired only once the desktop is up, so
  // boot-screen keys stay untouched.
  useEffect(() => {
    if (!booted) return;
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
        const workspaces = useWorkspacesStore.getState();
        const ws = workspaces.activeWs;
        workspaces.focusNextInWs(ws);
        const focused = useWorkspacesStore.getState().workspaces[ws].focused;
        if (focused !== null) useWmStore.getState().focus(focused);
      },
    });
    return dispose;
  }, [booted]);

  // SSR / hydration gate — nothing renders until the client has hydrated.
  if (!hydrated) return null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-zaid-bg">
      <AnimatePresence mode="wait">
        {!booted ? (
          <BootScreen key="boot" />
        ) : (
          <motion.div
            key="desktop"
            data-testid="desktop"
            className="relative h-full w-full overflow-hidden"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.35, ease: "easeOut" }
            }
          >
            {/*
              ---------------------------------------------------------------
              ZaidOS desktop layers (bottom -> top):
                Wallpaper     z-0    (wallpaper engine)
                DesktopIcons  z-10   (icon grid + desktop right-click surface)
                WorkspaceView z-20   (window layer — floats above the icons)
                Waybar        z-40   (fixed top bar)
                ContextMenu   z-50   (desktop right-click menu / modals)
                Launcher      z-60/70 (app launcher overlay)
              ---------------------------------------------------------------
            */}
            <Wallpaper />
            <DesktopIcons />
            <WorkspaceView />
            <Waybar />
            <ContextMenu />
            <Launcher />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Returning-visitor quick fade: brief opaque overlay that dissolves to
          reveal the desktop. First-visit boots skip it (BootScreen's exit
          fade covers that transition). */}
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
