import { useRef } from "react";
import IosAppIcon from "./IosAppIcon.jsx";
import LiveProjectsWidget from "./LiveProjectsWidget.jsx";
import { paginateHomeApps } from "../../zaidos/mobile/registry.js";

const SWIPE_THRESHOLD = 50;

export default function MobileHomePages({ apps, page, onPageChange, onOpenApp }) {
  const pages = paginateHomeApps();
  const dragRef = useRef({ x: 0, moved: false });

  const goPage = (next) => {
    onPageChange(Math.max(0, Math.min(pages.length - 1, next)));
  };

  return (
    <div className="mobile-home-pages flex min-h-0 flex-1 flex-col">
      <div
        className="relative min-h-0 flex-1 overflow-hidden"
        onPointerDown={(e) => {
          dragRef.current = { x: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          if (Math.abs(e.clientX - dragRef.current.x) > 10) dragRef.current.moved = true;
        }}
        onPointerUp={(e) => {
          if (!dragRef.current.moved) return;
          const dx = e.clientX - dragRef.current.x;
          if (dx < -SWIPE_THRESHOLD) goPage(page + 1);
          else if (dx > SWIPE_THRESHOLD) goPage(page - 1);
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((pageApps, pageIndex) => (
            <div
              key={pageIndex}
              className="mobile-home-page flex h-full w-full shrink-0 flex-col overflow-y-auto overscroll-contain px-1 pt-1"
            >
              {pageIndex === 0 && <LiveProjectsWidget />}
              <div className="grid grid-cols-4 gap-x-3 gap-y-5 pb-2">
                {pageApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    data-testid={
                      ["Terminal", "ZaidGPT"].includes(app.id)
                        ? `mobile-quick-${app.id.toLowerCase()}`
                        : `mobile-app-${app.id.toLowerCase()}`
                    }
                    onClick={() => onOpenApp(app.id)}
                    className="mobile-app-tile flex flex-col items-center gap-1.5 transition-transform active:scale-[0.92]"
                  >
                    <IosAppIcon src={app.icon} title={app.title} appId={app.id} />
                    <span className="ios-icon-label max-w-[4.5rem] truncate text-center text-[11px] font-medium text-white drop-shadow-sm">
                      {app.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="mobile-page-dots flex shrink-0 items-center justify-center gap-[6px] pb-1 pt-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === page ? "true" : undefined}
              onClick={() => goPage(i)}
              className={`mobile-page-dot ${i === page ? "is-active" : ""}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
