import { useEffect, useState } from "react";
import { APP_ICON } from "../zaidos/lib/assets.js";
import { getAppIcon } from "../zaidos/lib/appIcons.js";

const FALLBACK = APP_ICON("files");

/** Resilient app/file icon — local paths with automatic fallback. */
export default function AppIconImg({ src, appId, alt = "", className = "", ...rest }) {
  const resolved = appId ? getAppIcon(appId) : src || FALLBACK;
  const [iconSrc, setIconSrc] = useState(resolved);

  useEffect(() => {
    setIconSrc(appId ? getAppIcon(appId) : src || FALLBACK);
  }, [appId, src]);

  return (
    <img
      src={iconSrc}
      alt={alt}
      className={className}
      decoding="async"
      draggable={false}
      onError={() => {
        if (iconSrc !== FALLBACK) setIconSrc(FALLBACK);
      }}
      {...rest}
    />
  );
}
