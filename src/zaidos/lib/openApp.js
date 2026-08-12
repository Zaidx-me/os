import { useAppStore } from "../../store/Appstore.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { MOBILE_HIDDEN_APP_IDS } from "../lib/appIcons.js";

/** Open an app on desktop (window) or mobile (home shell). */
export function useOpenApp() {
  const isMobile = useIsMobile();
  const openApp = useAppStore((s) => s.openApp);

  return (appId, component) => {
    if (MOBILE_HIDDEN_APP_IDS.has(appId)) return;
    if (isMobile) {
      window.dispatchEvent(new CustomEvent("zaidos:open-app", { detail: { appId } }));
      return;
    }
    openApp(appId, component);
  };
}
