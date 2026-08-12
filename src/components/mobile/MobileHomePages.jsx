import { useCallback, useEffect, useRef } from "react";
import IosAppIcon from "./IosAppIcon.jsx";
import LiveProjectsWidget from "./LiveProjectsWidget.jsx";
import { paginateHomeApps } from "../../zaidos/mobile/registry.js";

export default function MobileHomePages({ apps, page, onPageChange, onOpenApp }) {
  const pages = paginateHomeApps();
  const trackRef = useRef(null);
  const scrollRaf = useRef(null);

  const goPage = useCallback(
    (next) => {
      onPageChange(Math.max(0, Math.min(pages.length - 1, next)));
    },
    [onPageChange, pages.length],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    if (!width) return;
    track.scrollTo({ left: page * width, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || pages.length <= 1) return;

    const onScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        const width = track.clientWidth;
        if (!width) return;
        const next = Math.round(track.scrollLeft / width);
        if (next !== page) onPageChange(next);
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    };
  }, [page, pages.length, onPageChange]);

  return (
    <div className="mobile-home-pages flex min-h-0 flex-1 flex-col">
      <div
        ref={trackRef}
        className="mobile-home-track relative min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
      >
        <div className="flex h-full min-h-0 w-max min-w-full">
          {pages.map((pageApps, pageIndex) => (
            <div
              key={pageIndex}
              className="mobile-home-page flex h-full min-h-0 w-full min-w-full flex-[0_0_100%] snap-start snap-always flex-col overflow-y-auto overscroll-y-contain px-1 pt-1"
            >
              {pageIndex === 0 && <LiveProjectsWidget />}
              <div className="grid grid-cols-4 gap-x-3 gap-y-5 pb-4">
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
        <div className="mobile-page-dots flex shrink-0 items-center justify-center gap-[6px] pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2">
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
