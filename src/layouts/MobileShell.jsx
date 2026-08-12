import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LazyWallpaper from "../components/LazyWallpaper.jsx";
import IosStatusBar from "../components/mobile/IosStatusBar.jsx";
import MobileFloatingBack from "../components/mobile/MobileFloatingBack.jsx";
import MobileHomePages from "../components/mobile/MobileHomePages.jsx";
import MobileAppSwitcher from "../components/mobile/MobileAppSwitcher.jsx";
import MobileControlCenterSheet from "../components/mobile/MobileControlCenterSheet.jsx";
import MobileWelcomeScreen from "../components/mobile/MobileWelcomeScreen.jsx";
import { DEFAULT_DESKTOP_WALLPAPER, resolveWallpaper } from "../zaidos/lib/assets.js";
import {
  getMobileApp,
  MOBILE_HOME_APPS,
} from "../zaidos/mobile/registry.js";

const EDGE_BACK_PX = 28;
const EDGE_BACK_DX = 72;

function MobileAppView({ appId, appPayload, onBack, onSwitcher }) {
  const meta = getMobileApp(appId);
  if (!meta) return null;
  const { Component } = meta;
  const edgeRef = useRef(null);
  const usesSelfChrome = appId === "ZaidGPT";
  const usesFloatingBack = !usesSelfChrome;

  const appBody =
    appId === "TextEdit" ? (
      <Component file={appPayload ?? { id: "new", name: "untitled.txt", content: "" }} />
    ) : appId === "PDFViewer" ? (
      <Component file={appPayload ?? { id: "pdf", name: "document.pdf", url: "" }} />
    ) : appId === "ZaidGPT" ? (
      <Component onBack={onBack} onSwitcher={onSwitcher} />
    ) : (
      <Component onBack={onBack} />
    );

  return (
    <div
      data-testid={`mobile-app-screen-${appId.toLowerCase()}`}
      className={`mobile-app-screen mobile-app-fullscreen flex min-h-0 flex-1 flex-col ${
        usesFloatingBack ? "mobile-app-screen--floating-back" : ""
      }`}
      onPointerDown={(e) => {
        edgeRef.current = { x: e.clientX, y: e.clientY, moved: false };
      }}
      onPointerMove={(e) => {
        const s = edgeRef.current;
        if (!s || s.moved) return;
        if (e.clientX - s.x > 12) s.moved = true;
      }}
      onPointerUp={(e) => {
        const s = edgeRef.current;
        edgeRef.current = null;
        if (!s?.moved) return;
        if (s.x <= EDGE_BACK_PX && e.clientX - s.x >= EDGE_BACK_DX) onBack();
      }}
      onPointerCancel={() => {
        edgeRef.current = null;
      }}
    >

      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-gray-500">Loading…</div>
        }
      >
        <div className="mobile-app-embedded mobile-app-native flex min-h-0 flex-1 flex-col overflow-hidden">
          {appBody}
        </div>
      </Suspense>
    </div>
  );
}

export default function MobileShell({
  peek = false,
  launchApp = null,
  onLaunchConsumed,
  welcomeOpen = false,
  onWelcomeDismiss,
}) {
  const [activeApp, setActiveApp] = useState(null);
  const [appPayload, setAppPayload] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [homePage, setHomePage] = useState(0);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState(() =>
    resolveWallpaper(localStorage.getItem("desktop_wallpaper")),
  );

  const pushRecent = useCallback((id) => {
    if (!id) return;
    setRecentApps((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 6));
  }, []);

  useEffect(() => {
    if (peek || !launchApp) return;
    setActiveApp(launchApp);
    pushRecent(launchApp);
    onLaunchConsumed?.();
  }, [peek, launchApp, pushRecent, onLaunchConsumed]);

  useEffect(() => {
    const onOpenBrowser = () => {
      setActiveApp("Safari");
      pushRecent("Safari");
    };
    const onOpenApp = (e) => {
      const id = e.detail?.appId ?? null;
      if (!id || id === "Launchpad") return;
      setAppPayload(null);
      setActiveApp(id);
      if (id) pushRecent(id);
    };
    const onOpenEditor = (e) => {
      setAppPayload(e.detail?.file ?? null);
      setActiveApp("TextEdit");
      pushRecent("TextEdit");
    };
    const onOpenPdf = (e) => {
      setAppPayload(e.detail?.file ?? null);
      setActiveApp("PDFViewer");
      pushRecent("PDFViewer");
    };
    window.addEventListener("zaidos:open-browser", onOpenBrowser);
    window.addEventListener("zaidos:open-app", onOpenApp);
    window.addEventListener("zaidos:open-editor", onOpenEditor);
    window.addEventListener("zaidos:open-pdf", onOpenPdf);
    return () => {
      window.removeEventListener("zaidos:open-browser", onOpenBrowser);
      window.removeEventListener("zaidos:open-app", onOpenApp);
      window.removeEventListener("zaidos:open-editor", onOpenEditor);
      window.removeEventListener("zaidos:open-pdf", onOpenPdf);
    };
  }, [pushRecent]);

  useEffect(() => {
    const syncWallpaper = (value) => {
      setWallpaper(resolveWallpaper(value ?? localStorage.getItem("desktop_wallpaper")));
    };
    const onWallpaperChanged = (e) => syncWallpaper(e?.detail);
    const onStorage = (e) => {
      if (e.key === "desktop_wallpaper") syncWallpaper(e.newValue);
    };
    window.addEventListener("wallpaperChanged", onWallpaperChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("wallpaperChanged", onWallpaperChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const openApp = useCallback(
    (id) => {
      if (!id || id === "Launchpad") return;
      setAppPayload(null);
      setActiveApp(id);
      pushRecent(id);
      setSwitcherOpen(false);
    },
    [pushRecent],
  );

  const closeApp = useCallback(() => {
    setActiveApp(null);
    setAppPayload(null);
    setSwitcherOpen(false);
    setControlCenterOpen(false);
  }, []);

  const switcherApps = recentApps.length > 0 ? recentApps : MOBILE_HOME_APPS.slice(0, 4).map((a) => a.id);
  const showFloatingBack = Boolean(activeApp) && activeApp !== "ZaidGPT" && !switcherOpen;
  const activeMeta = activeApp ? getMobileApp(activeApp) : null;

  if (peek) {
    return (
      <LazyWallpaper
        src={wallpaper || DEFAULT_DESKTOP_WALLPAPER}
        className="absolute inset-0"
        fixed
        cover
      />
    );
  }

  return (
    <div data-testid="mobile-shell" className="mobile-shell relative flex h-dvh w-full flex-col overflow-hidden font-sans">
      <LazyWallpaper src={wallpaper || DEFAULT_DESKTOP_WALLPAPER} fixed cover />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="popLayout">
          {activeApp ? (
            <motion.div
              key={`app-${activeApp}`}
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            >
              <MobileAppView
                appId={activeApp}
                appPayload={appPayload}
                onBack={closeApp}
                onSwitcher={() => setSwitcherOpen(true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            >
              <IosStatusBar onOpenControlCenter={() => setControlCenterOpen(true)} />
              <main
                data-testid="mobile-home"
                className="mobile-home flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
              >
                <MobileHomePages
                  apps={MOBILE_HOME_APPS}
                  page={homePage}
                  onPageChange={setHomePage}
                  onOpenApp={openApp}
                />
              </main>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {switcherOpen && (
            <MobileAppSwitcher
              apps={switcherApps}
              activeApp={activeApp}
              onSelect={openApp}
              onClose={() => setSwitcherOpen(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {controlCenterOpen && <MobileControlCenterSheet onClose={() => setControlCenterOpen(false)} />}
        </AnimatePresence>

        {showFloatingBack && (
          <MobileFloatingBack
            title={activeMeta?.title ?? ""}
            onBack={closeApp}
            onSwitcher={() => setSwitcherOpen(true)}
          />
        )}

        <AnimatePresence>
          {welcomeOpen && !activeApp && (
            <MobileWelcomeScreen
              onContinue={() => {
                sessionStorage.setItem("zaidos_session_welcome", "true");
                onWelcomeDismiss?.();
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
