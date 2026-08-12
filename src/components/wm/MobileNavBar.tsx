"use client";

interface MobileNavBarProps {
  canGoBack: boolean;
  onHome: () => void;
  onBack: () => void;
  onApps: () => void;
}

const RECENT_APPS_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H5V8h14v10z" />
  </svg>
);

const HOME_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const BACK_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
  </svg>
);

/** Compact One UI nav pill: Recent Apps, Home, Back. */
export default function MobileNavBar({
  canGoBack,
  onHome,
  onBack,
  onApps,
}: MobileNavBarProps) {
  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="oneui-nav-bar"
      aria-label="Mobile navigation"
    >
      <button
        type="button"
        data-testid="mobile-nav-apps"
        className="nav-btn"
        aria-label="Recent Apps"
        onClick={onApps}
      >
        {RECENT_APPS_ICON}
      </button>
      <button
        type="button"
        data-testid="mobile-nav-home"
        className="nav-btn"
        aria-label="Home"
        onClick={onHome}
      >
        {HOME_ICON}
      </button>
      <button
        type="button"
        data-testid="mobile-nav-back"
        className="nav-btn"
        aria-label="Back"
        onClick={onBack}
        disabled={!canGoBack}
      >
        {BACK_ICON}
      </button>
    </nav>
  );
}
