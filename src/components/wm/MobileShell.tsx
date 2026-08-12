"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Grid3X3 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { AppIcon } from "@/components/ui/AppIcon";
import type { AppId } from "@/components/ui/AppIcon";
import IosStatusBar from "@/components/wm/IosStatusBar";
import MobileNavBar from "@/components/wm/MobileNavBar";
import WindowHost from "@/components/wm/WindowHost";
import Wallpaper from "@/components/wm/Wallpaper";
import { APPS, getAppMeta } from "@/lib/apps";
import { motionTokens, OS_STAGGER_MS } from "@/lib/motion/spring";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import OsServices from "@/components/os/OsServices";
import { useBrowserStore } from "@/store/browser";

const IOS_DOCK_APPS: { id: AppId; testId?: string }[] = [
  { id: "browser", testId: "mobile-nav-browser" },
  { id: "chat" },
  { id: "music" },
  { id: "photos" },
];

const HOME_APPS = APPS.slice(0, 16);

const APP_TRANSITION = {
  duration: 0.2,
  ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
};

function IOSHomeScreen({
  onOpenApp,
  reducedMotion,
  skipIntro,
}: {
  onOpenApp: (id: AppId) => void;
  reducedMotion: boolean;
  skipIntro: boolean;
}) {
  return (
    <main
      data-testid="mobile-home"
      className="mobile-home relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-2"
    >
      <div className="grid grid-cols-4 gap-x-4 gap-y-6">
        {HOME_APPS.map((app, index) => (
          <motion.button
            key={app.id}
            type="button"
            initial={
              reducedMotion || skipIntro ? false : { opacity: 0, scale: 0.8 }
            }
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reducedMotion || skipIntro
                ? { duration: 0 }
                : {
                    ...motionTokens.spring.smooth,
                    delay: index * (OS_STAGGER_MS / 1000),
                  }
            }
            data-testid={
              ["terminal", "chat"].includes(app.id)
                ? `mobile-quick-${app.id}`
                : `mobile-app-${app.id}`
            }
            onClick={() => onOpenApp(app.id)}
            className="mobile-app-tile flex flex-col items-center gap-1.5 active:scale-[0.92]"
          >
            <AppIcon appId={app.id} size={60} />
            <span className="ios-icon-label max-w-[4.75rem] truncate text-center text-[11px] font-medium text-white">
              {app.title}
            </span>
          </motion.button>
        ))}
      </div>
    </main>
  );
}

function readDeepLinkApp(): AppId | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const app = params.get("app");
  if (!app || !getAppMeta(app)) return null;
  window.history.replaceState({}, "", "/");
  return app as AppId;
}

function IOSDock({
  onOpenApp,
  onApps,
}: {
  onOpenApp: (id: AppId) => void;
  onApps: () => void;
}) {
  return (
    <nav
      data-testid="mobile-dock"
      className="ios-dock pointer-events-none fixed inset-x-0 z-[60] px-4"
      aria-label="Dock"
    >
      <div className="ios-dock-inner pointer-events-auto mx-auto flex max-w-[20rem] items-end justify-between gap-1 px-2.5 py-1.5">
        {IOS_DOCK_APPS.map(({ id, testId }) => (
          <button
            key={id}
            type="button"
            data-testid={testId ?? `mobile-dock-${id}`}
            data-dock-app={id}
            aria-label={getAppMeta(id)?.title ?? id}
            onClick={() => onOpenApp(id)}
            className="ios-dock-icon-btn active:scale-[0.92]"
          >
            <AppIcon appId={id} size={46} className="ios-dock-icon" />
          </button>
        ))}
        <button
          type="button"
          data-testid="mobile-dock-apps"
          aria-label="App Library"
          onClick={onApps}
          className="ios-dock-icon-btn active:scale-[0.92]"
        >
          <span className="ios-dock-library">
            <Grid3X3 size={18} className="text-white" strokeWidth={2.2} />
          </span>
        </button>
      </div>
    </nav>
  );
}

export default function MobileShell() {
  const reducedMotion = useReducedMotion();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeApp, setActiveApp] = useState<AppId | null>(() => readDeepLinkApp());
  const [hasVisitedHome, setHasVisitedHome] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pendingDrawerRef = useRef(false);

  const browserTabs = useBrowserStore((s) => s.tabs);
  const browserActiveId = useBrowserStore((s) => s.activeTabId);

  useFocusTrap(drawerRef, drawerOpen && activeApp === null);

  useEffect(() => {
    if (!activeApp) setHasVisitedHome(true);
  }, [activeApp]);

  useEffect(() => {
    const onOpenBrowserEvt = () => {
      setActiveApp("browser");
      setDrawerOpen(false);
    };
    window.addEventListener("zaidos:open-browser", onOpenBrowserEvt);
    return () => window.removeEventListener("zaidos:open-browser", onOpenBrowserEvt);
  }, []);

  const openApp = useCallback((appId: AppId) => {
    setDrawerOpen(false);
    setActiveApp(appId);
  }, []);

  const goHome = useCallback(() => {
    setActiveApp(null);
    setDrawerOpen(false);
  }, []);

  const closeActiveApp = useCallback(() => {
    if (drawerOpen) {
      setDrawerOpen(false);
      return;
    }
    goHome();
  }, [drawerOpen, goHome]);

  const onAppExitComplete = useCallback(() => {
    if (pendingDrawerRef.current) {
      pendingDrawerRef.current = false;
      setDrawerOpen(true);
    }
  }, []);

  const openLibrary = useCallback(() => {
    if (activeApp) {
      pendingDrawerRef.current = true;
      goHome();
      return;
    }
    setDrawerOpen(true);
  }, [activeApp, goHome]);

  const navBack = useCallback(() => {
    if (activeApp === "browser") {
      const tab = browserTabs.find((t) => t.id === browserActiveId);
      if (tab && tab.historyIndex > 0) {
        useBrowserStore.getState().goBack();
        return;
      }
    }
    if (activeApp) closeActiveApp();
  }, [activeApp, browserActiveId, browserTabs, closeActiveApp]);

  const canGoBack =
    Boolean(activeApp) &&
    (activeApp !== "browser" ||
      (browserTabs.find((t) => t.id === browserActiveId)?.historyIndex ?? 0) > 0);

  const meta = activeApp ? getAppMeta(activeApp) : undefined;
  const showHome = !activeApp;

  return (
    <div
      data-testid="mobile-shell"
      id="main-content"
      className="mobile-shell relative flex h-dvh w-full flex-col overflow-hidden font-sans"
    >
      <div className="mobile-screen relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Wallpaper />
          <div className="absolute inset-0 bg-black/15" aria-hidden="true" />
        </div>

        <motion.div
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
          animate={{
            scale: drawerOpen && !activeApp ? 0.96 : 1,
            borderRadius: drawerOpen && !activeApp ? 12 : 0,
          }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: APP_TRANSITION.ease }}
          style={{ transformOrigin: "center center" }}
        >
          {showHome && <IosStatusBar />}

          <AnimatePresence mode="wait" onExitComplete={onAppExitComplete}>
            {activeApp && meta ? (
              <motion.div
                key={activeApp}
                data-testid={`mobile-page-${activeApp}`}
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: 8 }}
                transition={reducedMotion ? { duration: 0 } : APP_TRANSITION}
                className="relative z-10 flex min-h-0 flex-1 flex-col bg-zaid-surface pb-[calc(2.75rem+env(safe-area-inset-bottom))]"
              >
                <header className="flex shrink-0 items-center justify-center border-b border-zaid-border px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
                  <span className="min-w-0 truncate text-center text-sm font-semibold">
                    {meta.title}
                  </span>
                </header>
                <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                  <Suspense
                    fallback={
                      <div className="flex flex-1 items-center justify-center">Loading…</div>
                    }
                  >
                    <WindowHost windowId={`mobile-${activeApp}`} appId={activeApp} />
                  </Suspense>
                  {activeApp === "terminal" && (
                    <button
                      type="button"
                      data-testid="mobile-terminal-hint"
                      className="shrink-0 border-t border-zaid-border bg-zaid-surface2 px-4 py-3 text-center text-xs text-zaid-muted"
                      onClick={() =>
                        (
                          document.querySelector(
                            '[data-testid="terminal-input"]',
                          ) as HTMLInputElement | null
                        )?.focus()
                      }
                    >
                      Tap here to type commands
                    </button>
                  )}
                </div>
              </motion.div>
            ) : showHome ? (
              <motion.div
                key="home"
                initial={false}
                animate={{ opacity: 1 }}
                exit={reducedMotion ? undefined : { opacity: 0 }}
                transition={APP_TRANSITION}
                className="flex min-h-0 flex-1 flex-col"
              >
                <IOSHomeScreen
                  onOpenApp={openApp}
                  reducedMotion={reducedMotion}
                  skipIntro={hasVisitedHome}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {drawerOpen && !activeApp && (
          <>
            <div
              data-testid="mobile-drawer-backdrop"
              className="mobile-sheet-backdrop fixed inset-0 z-40 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              ref={drawerRef}
              data-testid="mobile-drawer"
              role="dialog"
              aria-label="App Library"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: reducedMotion ? 0 : 0.25, ease: APP_TRANSITION.ease }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-zaid-surface p-5 pb-[calc(2.75rem+env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zaid-border" />
              <p className="mb-4 text-lg font-semibold">App Library</p>
              <div className="grid grid-cols-4 gap-4">
                {APPS.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    data-testid={`mobile-app-${app.id}`}
                    onClick={() => openApp(app.id)}
                    className="flex flex-col items-center gap-2 active:scale-95"
                  >
                    <AppIcon appId={app.id} size={52} />
                    <span className="line-clamp-2 text-center text-[10px] font-medium">
                      {app.title}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {drawerOpen && !activeApp && (
          <div className="pointer-events-none absolute inset-0 z-[5] bg-black/30" aria-hidden="true" />
        )}

        {showHome && !drawerOpen && (
          <IOSDock onOpenApp={openApp} onApps={openLibrary} />
        )}

        <MobileNavBar
          canGoBack={canGoBack}
          onHome={closeActiveApp}
          onBack={navBack}
          onApps={openLibrary}
        />
      </div>
      <OsServices />
    </div>
  );
}
