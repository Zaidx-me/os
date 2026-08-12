import { memo, useEffect, useState } from "react";
import { DEFAULT_DESKTOP_WALLPAPER, resolveWallpaper } from "../zaidos/lib/assets.js";

/** Fast full-bleed wallpaper — fixed layer on mobile, img + object-cover, optimized WebP fallback. */
function LazyWallpaper({ src, className = "", cover = true, fixed = false, children, ...rest }) {
  const resolved = resolveWallpaper(src || DEFAULT_DESKTOP_WALLPAPER);
  const [activeSrc, setActiveSrc] = useState(resolved);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    setActiveSrc(resolveWallpaper(src || DEFAULT_DESKTOP_WALLPAPER));
  }, [src]);

  useEffect(() => {
    if (!activeSrc) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "high";
    img.onload = () => {
      if (!cancelled) setReady(true);
    };
    img.onerror = () => {
      if (cancelled) return;
      if (activeSrc !== DEFAULT_DESKTOP_WALLPAPER) {
        setActiveSrc(DEFAULT_DESKTOP_WALLPAPER);
      } else {
        setReady(true);
      }
    };
    img.src = activeSrc;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };
  }, [activeSrc]);

  useEffect(() => {
    const href = activeSrc || DEFAULT_DESKTOP_WALLPAPER;
    let link = document.querySelector('link[data-wallpaper-preload="1"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.setAttribute("data-wallpaper-preload", "1");
      document.head.appendChild(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  }, [activeSrc]);

  const rootClass = fixed
    ? "pointer-events-none fixed inset-0 z-0 lazy-wallpaper-layer"
    : `relative overflow-hidden lazy-wallpaper-layer ${className}`;

  return (
    <div className={rootClass} {...rest}>
      <img
        src={activeSrc}
        alt=""
        decoding="async"
        fetchPriority="high"
        draggable={false}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          cover ? "object-cover" : "object-contain"
        } ${ready ? "opacity-100" : "opacity-0"}`}
      />
      {!ready && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 animate-pulse"
          aria-hidden
        />
      )}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/15" aria-hidden />
      {children ? <div className="relative z-[2] h-full w-full">{children}</div> : null}
    </div>
  );
}

export default memo(LazyWallpaper);
