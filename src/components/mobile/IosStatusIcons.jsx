/** iOS-style status bar glyphs — filled cellular, Wi‑Fi, and battery. */

export function IosCellularIcon({ className = "", size = 18 }) {
  const h = (size * 12) / 18;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 18 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <rect x="1" y="8.25" width="2.75" height="3.25" rx="0.65" />
      <rect x="5.25" y="5.75" width="2.75" height="5.75" rx="0.65" />
      <rect x="9.5" y="3.25" width="2.75" height="8.25" rx="0.65" />
      <rect x="13.75" y="0.75" width="2.75" height="10.75" rx="0.65" />
    </svg>
  );
}

export function IosWifiIcon({ className = "", size = 17 }) {
  const h = (size * 12) / 17;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 17 12"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8.5 2.1c-2.35 0-4.48.82-6.17 2.18l1.28 1.28A7.02 7.02 0 0 1 8.5 3.55c2.05 0 3.9.68 5.39 1.91l1.28-1.28A8.52 8.52 0 0 0 8.5 2.1Z" />
      <path d="M8.5 6.05a4.55 4.55 0 0 0-3.22 1.34l1.28 1.28a2.85 2.85 0 0 1 3.88 0l1.28-1.28A4.55 4.55 0 0 0 8.5 6.05Z" />
      <circle cx="8.5" cy="10.35" r="1.35" />
    </svg>
  );
}

export function IosBatteryIcon({ className = "", size = 27, level = 1 }) {
  const h = (size * 13) / 27;
  const fillW = Math.max(0, Math.min(1, level)) * 19;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 27 13"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect
        x="0.75"
        y="0.75"
        width="22.5"
        height="11.5"
        rx="3.25"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.45"
      />
      <rect x="2.25" y="2.25" width={fillW} height="8.5" rx="1.75" fill="currentColor" />
      <path
        d="M24.5 4.35h1.85c.95 0 1.65.7 1.65 1.55v1.2c0 .85-.7 1.55-1.65 1.55h-1.85"
        fill="currentColor"
        opacity="0.45"
      />
    </svg>
  );
}

export function IosStatusTrailing({ className = "", onClick, disabled }) {
  const inner = (
    <>
      <IosCellularIcon size={17} />
      <IosWifiIcon size={16} />
      <IosBatteryIcon size={25} level={0.82} />
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`ios-status-trailing flex items-center gap-[5px] ${className}`}
        aria-label="Control Center"
        onClick={onClick}
        disabled={disabled}
      >
        {inner}
      </button>
    );
  }

  return <div className={`ios-status-trailing flex items-center gap-[5px] ${className}`}>{inner}</div>;
}
