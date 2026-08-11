"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, Volume2, Wifi } from "lucide-react";
import { useSystrayStore, selectMuted, selectVolume, selectWifi } from "@/store/systray";

/** macOS Control Center slide-down panel. */
export default function ControlCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const volume = useSystrayStore(selectVolume);
  const muted = useSystrayStore(selectMuted);
  const wifi = useSystrayStore(selectWifi);
  const toggleMute = useSystrayStore((s) => s.toggleMute);
  const toggleWifi = useSystrayStore((s) => s.toggleWifi);
  const [brightness, setBrightness] = useState(72);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        data-testid="control-center-backdrop"
        className="control-center-backdrop fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        data-testid="control-center-panel"
        role="dialog"
        aria-label="Control Center"
        className="control-center-panel fixed right-3 top-[calc(var(--waybar-h)+0.5rem)] z-50 w-72 rounded-2xl p-3 font-sans text-xs"
      >
        <p className="mb-2 px-1 text-[11px] font-semibold text-zaid-text">Control Center</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-testid="cc-wifi"
            onClick={() => toggleWifi()}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
              wifi ? "bg-zaid-accent/20 text-zaid-text" : "bg-zaid-surface2/80 text-zaid-muted"
            }`}
          >
            <Wifi size={16} />
            Wi‑Fi
          </button>
          <button
            type="button"
            data-testid="cc-mute"
            onClick={() => toggleMute()}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
              !muted ? "bg-zaid-accent/20 text-zaid-text" : "bg-zaid-surface2/80 text-zaid-muted"
            }`}
          >
            <Volume2 size={16} />
            Sound
          </button>
        </div>
        <label className="mt-3 block px-1">
          <span className="mb-1 flex items-center gap-1.5 text-zaid-muted">
            <SlidersHorizontal size={12} />
            Brightness
          </span>
          <input
            type="range"
            min={10}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full accent-zaid-accent"
          />
        </label>
        <p className="mt-2 px-1 text-[10px] text-zaid-muted">
          Volume {volume}%{muted ? " (muted)" : ""}
        </p>
      </div>
    </>
  );
}
