import { motion } from "framer-motion";
import IosAppIcon from "./IosAppIcon.jsx";
import { getMobileApp } from "../../zaidos/mobile/registry.js";

export default function MobileAppSwitcher({ apps, activeApp, onSelect, onClose }) {
  if (apps.length === 0) return null;

  return (
    <>
      <motion.div
        className="ios-switcher-backdrop fixed inset-0 z-[85] bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        data-testid="mobile-app-switcher"
        className="ios-switcher-panel fixed inset-x-0 top-[12%] z-[86] px-4"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 420, damping: 34 }}
      >
        <div className="mx-auto flex max-w-md flex-col gap-3">
          {apps.map((appId) => {
            const meta = getMobileApp(appId);
            if (!meta) return null;
            const active = appId === activeApp;
            return (
              <button
                key={appId}
                type="button"
                data-testid={`mobile-switcher-${appId.toLowerCase()}`}
                onClick={() => onSelect(appId)}
                className={`ios-switcher-card flex items-center gap-3 rounded-2xl p-3 text-left transition-transform active:scale-[0.98] ${
                  active ? "ios-switcher-card--active" : ""
                }`}
              >
                <IosAppIcon src={meta.icon} title={meta.title} appId={appId} size={52} />
                <span className="text-[15px] font-semibold text-white">{meta.title}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-6 text-center text-[13px] font-medium text-white/70">
          Swipe up on the bar below to go Home
        </p>
      </motion.div>
    </>
  );
}
