import { useEffect, useState } from "react";
import { APP_ICON } from "../../zaidos/lib/assets.js";
import { getAppIcon } from "../../zaidos/lib/appIcons.js";

const FALLBACK = APP_ICON("files");

/** Consistent iOS home-screen / dock app icon — always uses local assets. */
export default function IosAppIcon({ src, title, appId, size = 58, className = "" }) {
  const resolved = (appId && getAppIcon(appId)) || src || FALLBACK;
  const [iconSrc, setIconSrc] = useState(resolved);

  useEffect(() => {
    setIconSrc((appId && getAppIcon(appId)) || src || FALLBACK);
  }, [appId, src]);

  return (
    <span
      className={`ios-app-icon-wrap inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={iconSrc}
        alt={title || ""}
        width={size}
        height={size}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        draggable={false}
        onError={() => {
          if (iconSrc !== FALLBACK) setIconSrc(FALLBACK);
        }}
        className="ios-app-icon h-full w-full rounded-[22%] object-cover shadow-[0_2px_8px_rgba(0,0,0,0.28)]"
      />
    </span>
  );
}
