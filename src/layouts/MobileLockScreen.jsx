import { useCallback, useEffect, useRef, useState } from "react";
import LazyWallpaper from "../components/LazyWallpaper.jsx";
import IosStatusBar from "../components/mobile/IosStatusBar.jsx";
import { DEFAULT_LOCK_WALLPAPER, resolveLockWallpaper } from "../zaidos/lib/assets.js";

function formatClock(d) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(d) {
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export default function MobileLockScreen({ goNext }) {
  const [now, setNow] = useState(() => new Date());
  const [dragY, setDragY] = useState(0);
  const [unlocking, setUnlocking] = useState(false);
  const startRef = useRef(null);
  const wallpaper = resolveLockWallpaper(localStorage.getItem("lockscreen_wallpaper"));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const finishUnlock = useCallback(() => {
    if (unlocking) return;
    setUnlocking(true);
    window.setTimeout(() => goNext(), 180);
  }, [goNext, unlocking]);

  return (
    <div
      data-testid="mobile-lock"
      className="mobile-lock absolute inset-0 z-50 flex flex-col overflow-hidden touch-none select-none"
      style={{ transform: dragY ? `translateY(${-Math.min(dragY, 120)}px)` : undefined, opacity: unlocking ? 0 : 1, transition: unlocking ? "opacity 0.2s ease, transform 0.25s ease" : undefined }}
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/45" aria-hidden />
      </LazyWallpaper>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <IosStatusBar />

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-32">
          <p className="mobile-lock-date text-[18px] font-medium text-white/90">{formatDate(now)}</p>
          <p className="mobile-lock-time mt-1 text-[72px] font-light leading-none tracking-tight text-white">
            {formatClock(now)}
          </p>
        </div>

        <div className="mobile-lock-hint pointer-events-none pb-[max(2rem,env(safe-area-inset-bottom))] text-center">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/50" />
          <p className="text-[13px] font-medium text-white/75">Swipe up to unlock</p>
        </div>
      </div>
    </div>
  );
}
