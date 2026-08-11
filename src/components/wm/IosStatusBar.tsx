"use client";

import { useEffect, useState } from "react";

function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** Signal: 4 bars at 4/7/10/13px, 2px wide, 2px gap, 1px top radius. */
function SignalIcon() {
  const heights = [4, 7, 10, 13];
  return (
    <svg width="14" height="13" viewBox="0 0 14 13" aria-hidden="true" className="shrink-0">
      {heights.map((h, i) => (
        <rect
          key={h}
          x={i * 4}
          y={13 - h}
          width={2}
          height={h}
          rx={1}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/** Wi‑Fi: 15×11px, 3 nested arcs + dot. */
function WifiIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 15 11" aria-hidden="true" className="shrink-0">
      <path
        d="M7.5 9.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
      <path
        d="M4 6.8a4.2 4.2 0 0 1 7 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M1.5 4.2a7.5 7.5 0 0 1 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M0 1.5a10.5 10.5 0 0 1 15 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Battery: 22×11 outline + 1.5×4 nub + inner fill. */
function BatteryIcon({ level }: { level: number }) {
  const pct = Math.max(0, Math.min(100, level));
  const innerW = Math.max(0, ((22 - 3) * pct) / 100);
  return (
    <svg width="25" height="11" viewBox="0 0 25 11" aria-hidden="true" className="shrink-0">
      <rect
        x="0.75"
        y="0.75"
        width="22"
        height="9.5"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect x="23.25" y="3.5" width="1.5" height="4" rx="0.75" fill="currentColor" opacity="0.55" />
      <rect x="2.25" y="2.25" width={innerW} height="6.5" rx="1.25" fill="currentColor" />
    </svg>
  );
}

/** Flat 44px status bar — no notch, no Dynamic Island. */
export default function IosStatusBar({ battery = 84 }: { battery?: number }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      data-testid="ios-status-bar"
      className="ios-status-bar relative z-20 flex h-11 min-h-[44px] shrink-0 items-center justify-between pl-4 pr-4 pt-[env(safe-area-inset-top,0px)] text-white"
    >
      <time
        dateTime={now.toISOString()}
        className="ios-status-time text-[15px] font-semibold tabular-nums"
      >
        {formatTime(now)}
      </time>

      <div
        className="ios-status-trailing flex items-center gap-1.5"
        aria-hidden="true"
      >
        <SignalIcon />
        <WifiIcon />
        <BatteryIcon level={battery} />
      </div>
    </div>
  );
}
