import { useEffect, useState } from "react";

export default function IosStatusBar({ onOpenControlCenter }) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      data-testid="ios-status-bar"
      className="ios-status-bar relative z-20 flex shrink-0 items-center justify-between px-5 pb-1 pt-[max(0.35rem,env(safe-area-inset-top))] text-[13px] font-semibold text-white"
    >
      <span className="ios-status-time">{time}</span>
      <button
        type="button"
        className="ios-status-trailing flex items-center gap-1 text-[11px] opacity-90 active:opacity-70"
        aria-label="Control Center"
        onClick={onOpenControlCenter}
        disabled={!onOpenControlCenter}
      >
        <svg width="16" height="12" viewBox="0 0 18 14" fill="currentColor" aria-hidden>
          <rect x="0" y="10" width="3" height="4" rx="0.5" />
          <rect x="5" y="7" width="3" height="7" rx="0.5" />
          <rect x="10" y="4" width="3" height="10" rx="0.5" />
          <rect x="15" y="0" width="3" height="14" rx="0.5" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 24 20" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <circle cx="12" cy="18" r="2" fill="currentColor" stroke="none" />
          <path d="M8.5 14.5a5 5 0 0 1 7 0" />
          <path d="M5 11a10 10 0 0 1 14 0" />
        </svg>
      </button>
    </header>
  );
}
