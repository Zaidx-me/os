import { ChevronLeft } from "lucide-react";

/** Native-style top bar for full-screen mobile apps — reliable on real devices. */
export default function MobileAppChrome({ title, onBack }) {
  return (
    <header
      data-testid="mobile-app-chrome"
      className="mobile-app-chrome flex shrink-0 items-center gap-2 border-b border-black/10 bg-[#f6f6f6]/95 px-2 pb-2 pt-[max(0.35rem,env(safe-area-inset-top))] backdrop-blur-xl dark:border-white/10 dark:bg-[#1c1c1e]/95"
    >
      <button
        type="button"
        data-testid="mobile-app-back"
        onClick={onBack}
        className="mobile-app-chrome-btn flex min-h-11 min-w-[4.5rem] items-center gap-0.5 rounded-lg px-2 text-[15px] font-medium text-blue-600 active:bg-black/5 dark:text-blue-400 dark:active:bg-white/10"
        aria-label="Back to home"
      >
        <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
        Back
      </button>

      <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-gray-900 dark:text-white">
        {title}
      </p>

      <span className="h-11 w-11 shrink-0" aria-hidden />
    </header>
  );
}
