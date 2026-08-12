import { useCallback, useEffect, useRef, useState } from "react";
import LazyWallpaper from "../components/LazyWallpaper.jsx";
import IosStatusBar from "../components/mobile/IosStatusBar.jsx";
import { DEFAULT_LOCK_WALLPAPER, resolveLockWallpaper } from "../zaidos/lib/assets.js";
import { enterFullscreen, hideMobileBrowserChrome } from "../zaidos/lib/fullscreen.js";

function formatLockDate(d) {
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function formatLockTimeParts(d) {
  const parts = new Intl.DateTimeFormat([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: undefined,
  }).formatToParts(d);

  let hour = "";
  let minute = "";
  let dayPeriod = "";

  for (const part of parts) {
    if (part.type === "hour") hour = part.value;
    if (part.type === "minute") minute = part.value;
    if (part.type === "dayPeriod") dayPeriod = part.value;
  }

  return { hour, minute, dayPeriod };
}

export default function MobileLockScreen({ goNext }) {
  const [now, setNow] = useState(() => new Date());
  const [dragY, setDragY] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const startRef = useRef(null);
  const wallpaper = resolveLockWallpaper(localStorage.getItem("lockscreen_wallpaper"));
  const { hour, minute, dayPeriod } = formatLockTimeParts(now);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  const finishUnlock = useCallback(() => {
    if (unlocking) return;
    setUnlocking(true);
    enterFullscreen();
    hideMobileBrowserChrome();
    window.setTimeout(() => goNext(), 180);
  }, [goNext, unlocking]);

  return (
    <div
      data-testid="mobile-lock"
      className="mobile-lock absolute inset-0 z-50 flex flex-col overflow-hidden touch-none select-none"
      style={{
        transform: dragY ? `translateY(${-Math.min(dragY, 120)}px)` : undefined,
        opacity: unlocking ? 0 : 1,
        transition: unlocking ? "opacity 0.2s ease, transform 0.25s ease" : undefined,
      }}
      onPointerDown={(e) => {
        startRef.current = { y: e.clientY, t: Date.now() };
      }}
      onPointerMove={(e) => {
        const s = startRef.current;
        if (!s) return;
        const dy = s.y - e.clientY;
        if (dy > 8) setDragY(Math.min(dy, 140));
      }}
      onPointerUp={(e) => {
        const s = startRef.current;
        startRef.current = null;
        if (!s) return;
        const dy = s.y - e.clientY;
        const quickTap = Date.now() - s.t < 250 && dy < 12;
        if (dy > 72 || quickTap) finishUnlock();
        else setDragY(0);
      }}
      onPointerCancel={() => {
        startRef.current = null;
        setDragY(0);
      }}
    >
      <LazyWallpaper src={wallpaper || DEFAULT_LOCK_WALLPAPER} className="absolute inset-0" cover>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/50" aria-hidden />
      </LazyWallpaper>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <IosStatusBar />

        <div className="mobile-lock-clock-block flex flex-col items-center px-6 pt-[clamp(2.5rem,11vh,5rem)]">
          <p className="mobile-lock-date">{formatLockDate(now)}</p>
          <div className="mobile-lock-time-row mt-1 flex items-baseline justify-center">
            <span className="mobile-lock-time" aria-label={`${hour}:${minute}`}>
              {hour}
              <span className="mobile-lock-time-colon">:</span>
              {minute}
            </span>
            {dayPeriod ? <span className="mobile-lock-ampm">{dayPeriod}</span> : null}
          </div>
        </div>

        <div className="flex-1" aria-hidden />

        <div className="mobile-lock-hint pointer-events-none pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
          <div className="mobile-lock-home-bar mx-auto mb-3" />
          <p className="text-[15px] font-normal text-white/80">Swipe up to open</p>
        </div>
      </div>
    </div>
  );
}
