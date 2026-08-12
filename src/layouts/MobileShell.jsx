import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LazyWallpaper from "../components/LazyWallpaper.jsx";
import IosStatusBar from "../components/mobile/IosStatusBar.jsx";
import MobileFloatingBack from "../components/mobile/MobileFloatingBack.jsx";
import MobileHomePages from "../components/mobile/MobileHomePages.jsx";
import MobileControlCenterSheet from "../components/mobile/MobileControlCenterSheet.jsx";
import MobileWelcomeScreen from "../components/mobile/MobileWelcomeScreen.jsx";
import { DEFAULT_DESKTOP_WALLPAPER, resolveWallpaper } from "../zaidos/lib/assets.js";
import {
  getMobileApp,
  MOBILE_HOME_APPS,
} from "../zaidos/mobile/registry.js";
import { hideMobileBrowserChrome, enterFullscreen } from "../zaidos/lib/fullscreen.js";
import { PENDING_KEY } from "../zaidos/lib/openBrowser.js";
import { PENDING_ARTICLE_SLUG_KEY } from "../zaidos/lib/openArticle.js";

const EDGE_BACK_PX = 28;
const EDGE_BACK_DX = 72;

function MobileAppView({ appId, appPayload, onBack }) {
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
  const [homePage, setHomePage] = useState(0);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState(() =>
    resolveWallpaper(localStorage.getItem("desktop_wallpaper")),
  );

  useEffect(() => {
    if (peek) return;
    hideMobileBrowserChrome();
  }, [peek]);

  useEffect(() => {
    if (peek || !launchApp) return;
    setActiveApp(launchApp);
    onLaunchConsumed?.();
  }, [peek, launchApp, onLaunchConsumed]);

  useEffect(() => {
    const onOpenBrowser = (e) => {
      const url = e.detail?.url;
      if (url) sessionStorage.setItem(PENDING_KEY, url);
      setActiveApp("Safari");
    };
    const onOpenApp = (e) => {
      const id = e.detail?.appId ?? null;
      if (!id || id === "Launchpad") return;
      setAppPayload(null);
      setActiveApp(id);
    };
    const onOpenEditor = (e) => {
      setAppPayload(e.detail?.file ?? null);
      setActiveApp("TextEdit");
    };
    const onOpenPdf = (e) => {
      setAppPayload(e.detail?.file ?? null);
      setActiveApp("PDFViewer");
    };
    const onOpenArticle = (e) => {
      const slug = e.detail?.slug;
      if (slug) sessionStorage.setItem(PENDING_ARTICLE_SLUG_KEY, slug);
      setAppPayload(null);
      setActiveApp("Articles");
    };
    window.addEventListener("zaidos:open-browser", onOpenBrowser);
    window.addEventListener("zaidos:open-app", onOpenApp);
    window.addEventListener("zaidos:open-article", onOpenArticle);
    window.addEventListener("zaidos:open-editor", onOpenEditor);
    window.addEventListener("zaidos:open-pdf", onOpenPdf);
    return () => {
      window.removeEventListener("zaidos:open-browser", onOpenBrowser);
      window.removeEventListener("zaidos:open-app", onOpenApp);
      window.removeEventListener("zaidos:open-article", onOpenArticle);
      window.removeEventListener("zaidos:open-editor", onOpenEditor);
      window.removeEventListener("zaidos:open-pdf", onOpenPdf);
    };
  }, []);

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

  const openApp = useCallback((id) => {
    if (!id || id === "Launchpad") return;
    enterFullscreen();
    hideMobileBrowserChrome();
    setAppPayload(null);
    setActiveApp(id);
  }, []);

  const closeApp = useCallback(() => {
    setActiveApp(null);
    setAppPayload(null);
    setControlCenterOpen(false);
  }, []);

  const activeMeta = activeApp ? getMobileApp(activeApp) : null;
  const showFloatingBack = Boolean(activeApp) && activeApp !== "ZaidGPT";

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
          {controlCenterOpen && <MobileControlCenterSheet onClose={() => setControlCenterOpen(false)} />}
        </AnimatePresence>

        {showFloatingBack && (
          <MobileFloatingBack
            title={activeMeta?.title ?? ""}
            onBack={closeApp}
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
