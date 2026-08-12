import { useEffect, useState } from "react";
import { APP_ICON } from "../../zaidos/lib/assets.js";
import { getAppIcon } from "../../zaidos/lib/appIcons.js";

const FALLBACK = APP_ICON("files");

function iconInitial(title, appId) {
  const label = title || appId || "?";
  return label.replace(/[^a-zA-Z0-9]/g, "").charAt(0).toUpperCase() || "?";
}

/** Consistent iOS home-screen app icon — local assets with letter fallback (no alt-text bleed). */
export default function IosAppIcon({ src, title, appId, size = 58, className = "" }) {
  const resolved = (appId && getAppIcon(appId)) || src || FALLBACK;
  const [iconSrc, setIconSrc] = useState(resolved);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIconSrc((appId && getAppIcon(appId)) || src || FALLBACK);
    setFailed(false);
  }, [appId, src]);

  if (failed) {
    return (
      <span
        className={`ios-app-icon-fallback inline-flex shrink-0 items-center justify-center rounded-[22%] bg-white/20 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.28)] ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      >
        {iconInitial(title, appId)}
      </span>
    );
  }

  return (
    <span
      className={`ios-app-icon-wrap inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={iconSrc}
        alt=""
        aria-hidden
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
        onError={() => {
          if (iconSrc !== FALLBACK) {
            setIconSrc(FALLBACK);
            return;
          }
          setFailed(true);
        }}
        className="ios-app-icon h-full w-full rounded-[22%] object-contain shadow-[0_2px_8px_rgba(0,0,0,0.28)]"
      />
    </span>
  );
}
