"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Globe, Grid3X3 } from "lucide-react";
import { motion } from "motion/react";

import { AppIcon } from "@/components/ui/AppIcon";
import type { AppId } from "@/components/ui/AppIcon";
import IosStatusBar from "@/components/wm/IosStatusBar";
import IosHomeIndicator from "@/components/wm/IosHomeIndicator";
import IosAssistiveTouch from "@/components/wm/IosAssistiveTouch";
import WindowHost from "@/components/wm/WindowHost";
import Wallpaper from "@/components/wm/Wallpaper";
import { APPS, getAppMeta } from "@/lib/apps";
import MobileAppLaunchOverlay from "@/components/wm/MobileAppLaunchOverlay";
import { motionTokens, OS_STAGGER_MS } from "@/lib/motion/spring";
import { localRectFromElement } from "@/lib/wm/mobile-open";
import type { LocalRect } from "@/lib/wm/mobile-open";
import { playMobileGenieDismiss } from "@/lib/wm/genie";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import OsServices from "@/components/os/OsServices";

const IOS_DOCK_APPS: { id: AppId; testId?: string }[] = [
  { id: "browser", testId: "mobile-nav-browser" },
  { id: "chat" },
  { id: "music" },
  { id: "photos" },
];

const HOME_APPS = APPS.slice(0, 16);

function ApplicatorWidget({ onOpen }: { onOpen: (el: HTMLElement) => void }) {
  const [ready, setReady] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 600);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      data-testid="mobile-live-applicator"
      onClick={() => ref.current && onOpen(ref.current)}
      className="ios-widget mx-auto mt-auto flex w-full max-w-xs flex-col gap-2 rounded-[24px] p-4 text-left active:scale-[0.99]"
    >
      {!ready ? (
        <div className="ios-widget-shimmer h-16 rounded-2xl" aria-hidden="true" />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: motionTokens.duration.base }}
          className="flex items-start gap-3"
        >
          <AppIcon appId="browser" size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-white">Applicator</p>
            <p className="text-xs text-white/75">Open live demo in Safari</p>
          </div>
          <Globe size={16} className="mt-1 shrink-0 text-white/80" />
        </motion.div>
      )}
    </button>
  );
}

function IOSHomeScreen({
  onOpenApp,
  reducedMotion,
}: {
  onOpenApp: (id: AppId, el: HTMLElement) => void;
  reducedMotion: boolean;
}) {
  return (
    <main
      data-testid="mobile-home"
      className="mobile-home relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-40 pt-2"
    >
      <div className="mb-8 grid grid-cols-4 gap-x-4 gap-y-6">
        {HOME_APPS.map((app, index) => (
          <motion.button
            key={app.id}
            type="button"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              ...motionTokens.spring.smooth,
              delay: index * (OS_STAGGER_MS / 1000),
            }}
            data-testid={
              ["terminal", "chat"].includes(app.id)
                ? `mobile-quick-${app.id}`
                : `mobile-app-${app.id}`
            }
            onClick={(e) => onOpenApp(app.id, e.currentTarget)}
            className="mobile-app-tile flex flex-col items-center gap-1.5 active:scale-[0.92]"
          >
            <AppIcon appId={app.id} size={60} />
            <span className="ios-icon-label max-w-[4.75rem] truncate text-center text-[11px] font-medium text-white">
              {app.title}
            </span>
          </motion.button>
        ))}
      </div>

      <ApplicatorWidget onOpen={(el) => onOpenApp("browser", el)} />
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
  activeApp,
  onToggleApp,
  onApps,
}: {
  activeApp: AppId | null;
  onToggleApp: (id: AppId, el: HTMLElement) => void;
  onApps: () => void;
}) {
  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="ios-dock pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1.75rem+env(safe-area-inset-bottom))] pt-2"
      aria-label="Dock"
    >
      <div className="ios-dock-inner pointer-events-auto mx-auto flex max-w-[22rem] items-end justify-between gap-1 px-3 py-2">
        {IOS_DOCK_APPS.map(({ id, testId }) => (
          <button
            key={id}
            type="button"
            data-testid={testId ?? `mobile-dock-${id}`}
            data-dock-app={id}
            aria-label={getAppMeta(id)?.title ?? id}
            aria-current={activeApp === id ? "true" : undefined}
            onClick={(e) => onToggleApp(id, e.currentTarget)}
            className="ios-dock-icon-btn active:scale-[0.92]"
          >
            <AppIcon appId={id} size={50} className="ios-dock-icon" />
            {activeApp === id && <span className="mac-dock-dot" aria-hidden="true" />}
          </button>
        ))}
        <button
          type="button"
          data-testid="mobile-nav-apps"
          aria-label="App Library"
          onClick={onApps}
          className="ios-dock-icon-btn active:scale-[0.92]"
        >
          <span className="ios-dock-library">
            <Grid3X3 size={22} className="text-white" strokeWidth={2.2} />
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
  const [launch, setLaunch] = useState<{ appId: AppId; rect: LocalRect } | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const drawerRef = useRef<HTMLDivElement>(null);
  const appScreenRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  useFocusTrap(drawerRef, drawerOpen && activeApp === null);

  useEffect(() => {
    const onOpenBrowserEvt = () => {
      setActiveApp("browser");
      setDrawerOpen(false);
    };
    window.addEventListener("zaidos:open-browser", onOpenBrowserEvt);
    return () => window.removeEventListener("zaidos:open-browser", onOpenBrowserEvt);
  }, []);

  const openAppFromHome = useCallback((appId: AppId, target: HTMLElement) => {
    setDrawerOpen(false);
    const container = screenRef.current;
    if (!container) {
      setActiveApp(appId);
      return;
    }
    const iconWrap =
      (target.querySelector('[role="img"]')?.parentElement as HTMLElement | null) ?? target;
    const rect = localRectFromElement(iconWrap, container);
    const cr = container.getBoundingClientRect();
    setContainerSize({
      width: cr.width || container.clientWidth || rect.width,
      height: cr.height || container.clientHeight || rect.height,
    });
    setLaunch({ appId, rect });
  }, []);

  const finishLaunch = useCallback(() => {
    setLaunch((current) => {
      if (current) setActiveApp(current.appId);
      return null;
    });
  }, []);

  const openApp = useCallback((appId: AppId) => {
    setActiveApp(appId);
    setDrawerOpen(false);
    setLaunch(null);
  }, []);

  const goHome = useCallback(() => {
    setActiveApp(null);
    setDrawerOpen(false);
  }, []);

  const goHomeViaIndicator = useCallback(
    async (targetEl: HTMLElement) => {
      if (drawerOpen) {
        setDrawerOpen(false);
        return;
      }
      if (!activeApp) return;

      const screen = appScreenRef.current;
      if (screen) await playMobileGenieDismiss(screen, targetEl);
      goHome();
    },
    [activeApp, drawerOpen, goHome],
  );

  const assistiveBack = useCallback(() => {
    if (activeApp === "browser") {
      window.dispatchEvent(new CustomEvent("zaidos:mobile-back"));
      return;
    }
    if (activeApp) {
      const ball = document.querySelector(
        '[data-testid="ios-assistive-touch"]',
      ) as HTMLElement | null;
      if (ball) void goHomeViaIndicator(ball);
      else goHome();
    }
  }, [activeApp, goHome, goHomeViaIndicator]);

  const toggleDockApp = useCallback(
    async (appId: AppId, dockBtn: HTMLElement) => {
      if (activeApp === appId) {
        const screen = appScreenRef.current;
        if (screen) await playMobileGenieDismiss(screen, dockBtn);
        setActiveApp(null);
        setDrawerOpen(false);
        return;
      }
      openApp(appId);
    },
    [activeApp, openApp],
  );

  const openLibrary = useCallback(() => {
    setDrawerOpen(true);
    setActiveApp(null);
  }, []);

  const meta = activeApp ? getAppMeta(activeApp) : undefined;

  return (
    <div
      data-testid="mobile-shell"
      id="main-content"
      className="mobile-shell relative flex h-dvh w-full flex-col overflow-hidden font-sans"
    >
      <div ref={screenRef} className="mobile-screen relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Wallpaper />
          <div className="absolute inset-0 bg-black/15" aria-hidden="true" />
        </div>

        <motion.div
          className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden"
          animate={{
            scale: drawerOpen && !activeApp ? 0.92 : 1,
            borderRadius: drawerOpen && !activeApp ? 10 : 0,
          }}
          transition={motionTokens.spring.hero}
          style={{ transformOrigin: "center center" }}
        >
          {!activeApp && !launch && <IosStatusBar />}

          {launch && (
            <MobileAppLaunchOverlay
              appId={launch.appId}
              startRect={launch.rect}
              containerSize={containerSize}
              onComplete={finishLaunch}
            />
          )}

          {activeApp && meta ? (
          <div
            ref={appScreenRef}
            className="relative z-10 flex min-h-0 flex-1 flex-col bg-zaid-surface pb-[calc(2rem+env(safe-area-inset-bottom))]"
          >
            <header className="flex shrink-0 items-center justify-center border-b border-zaid-border px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
              <span className="min-w-0 truncate text-center text-sm font-semibold">
                {meta.title}
              </span>
            </header>
            <div
              data-testid={`mobile-page-${activeApp}`}
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading…</div>}>
                <WindowHost windowId={`mobile-${activeApp}`} appId={activeApp} />
              </Suspense>
              {activeApp === "terminal" && (
                <button
                  type="button"
                  data-testid="mobile-terminal-hint"
                  className="shrink-0 border-t border-zaid-border bg-zaid-surface2 px-4 py-3 text-center text-xs text-zaid-muted"
                  onClick={() =>
                    (
                      document.querySelector('[data-testid="terminal-input"]') as HTMLInputElement | null
                    )?.focus()
                  }
                >
                  Tap here to type commands
                </button>
              )}
            </div>
          </div>
        ) : !launch ? (
          <IOSHomeScreen onOpenApp={openAppFromHome} reducedMotion={reducedMotion} />
        ) : null}
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
              transition={motionTokens.spring.hero}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-zaid-surface p-5 pb-44"
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

        {!activeApp && (
          <IOSDock
            activeApp={activeApp}
            onToggleApp={(id, el) => void toggleDockApp(id, el)}
            onApps={openLibrary}
          />
        )}

        <IosHomeIndicator variant={activeApp ? "dark" : "light"} decorative />

        <IosAssistiveTouch
          onHome={goHomeViaIndicator}
          onBack={assistiveBack}
          onAppSwitcher={openLibrary}
          onSearch={openLibrary}
          onSettings={() => openApp("settings")}
        />
      </div>
      <OsServices />
    </div>
  );
}
