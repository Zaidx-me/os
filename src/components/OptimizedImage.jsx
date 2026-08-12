import { memo, useEffect, useRef, useState } from "react";

/**
 * Lazy-loaded image with async decode and optional unload when off-screen.
 * Reduces memory vs eager <img> for galleries and avatars.
 */
function OptimizedImage({
  src,
  alt = "",
  className = "",
  width,
  height,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  onError,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(loading === "eager");
  const [loadedSrc, setLoadedSrc] = useState(null);

  useEffect(() => {
    if (loading === "eager" || !src) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, src]);

  useEffect(() => {
    if (!visible || !src) return;
    let cancelled = false;
    const img = new Image();
    img.decoding = decoding;
    img.onload = () => {
      if (!cancelled) setLoadedSrc(src);
    };
    img.onerror = onError;
    img.src = src;
    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
      img.src = "";
    };
  }, [visible, src, decoding, onError]);

  return (
    <span ref={ref} className={`inline-block ${className}`} style={{ width, height }}>
      {loadedSrc ? (
        <img
          src={loadedSrc}
          alt={alt}
          className={className}
          width={width}
          height={height}
          decoding={decoding}
          loading={loading}
          fetchPriority={fetchPriority ?? (loading === "eager" ? "high" : "auto")}
          {...rest}
        />
      ) : (
        <span
          className={`block bg-gray-200/20 dark:bg-white/5 animate-pulse ${className}`}
          style={{ width: width ?? "100%", height: height ?? "100%", minHeight: height ?? 48 }}
          aria-hidden
        />
      )}
    </span>
  );
}

export default memo(OptimizedImage);
