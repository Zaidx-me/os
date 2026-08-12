import { useCallback, useEffect, useRef, useState } from "react";
import IosAppIcon from "./IosAppIcon.jsx";
import LiveProjectsWidget from "./LiveProjectsWidget.jsx";
import { paginateHomeApps } from "../../zaidos/mobile/registry.js";

const SWIPE_THRESHOLD = 42;
const AXIS_LOCK = 12;

export default function MobileHomePages({ page, onPageChange, onOpenApp }) {
  const pages = paginateHomeApps();
  const viewportRef = useRef(null);
  const dragPxRef = useRef(0);
  const touchRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const goPage = useCallback(
    (next) => {
      onPageChange(Math.max(0, Math.min(pages.length - 1, next)));
    },
    [onPageChange, pages.length],
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el || pages.length <= 1) return;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      if (e.target.closest(".live-projects-widget, .mobile-widget-row")) return;
      touchRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        axis: null,
      };
      dragPxRef.current = 0;
      setDragPx(0);
      setDragging(true);
    };

    const onTouchMove = (e) => {
      const t = touchRef.current;
      if (!t || e.touches.length !== 1) return;

      const dx = e.touches[0].clientX - t.x;
      const dy = e.touches[0].clientY - t.y;

      if (!t.axis) {
        if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return;
        t.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (t.axis === "y") {
          setDragging(false);
          return;
        }
      }

      if (t.axis !== "x") return;

      e.preventDefault();

      let offset = dx;
      if (page === 0 && offset > 0) offset *= 0.3;
      if (page === pages.length - 1 && offset < 0) offset *= 0.3;

      dragPxRef.current = offset;
      setDragPx(offset);
    };

    const onTouchEnd = () => {
      const t = touchRef.current;
      touchRef.current = null;
      setDragging(false);

      if (t?.axis === "x") {
        const offset = dragPxRef.current;
        if (offset < -SWIPE_THRESHOLD && page < pages.length - 1) goPage(page + 1);
        else if (offset > SWIPE_THRESHOLD && page > 0) goPage(page - 1);
      }

      dragPxRef.current = 0;
      setDragPx(0);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [goPage, page, pages.length]);

  const translateX = viewportWidth
    ? -(page * viewportWidth) + (dragging ? dragPx : 0)
    : -(page * 100);

  return (
    <div className="mobile-home-pages flex min-h-0 flex-1 flex-col">
      <div
        ref={viewportRef}
        className="mobile-home-viewport relative min-h-0 flex-1 overflow-hidden"
      >
        <div
          className="mobile-home-slider flex h-full will-change-transform"
          style={{
            width: viewportWidth ? viewportWidth * pages.length : `${pages.length * 100}%`,
            transform: viewportWidth
              ? `translate3d(${translateX}px, 0, 0)`
              : `translate3d(-${page * 100}%, 0, 0)`,
            transition: dragging ? "none" : "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {pages.map((pageApps, pageIndex) => (
            <div
              key={pageIndex}
              className="mobile-home-page h-full shrink-0 overflow-y-auto overscroll-y-contain px-1 pt-1"
              style={{ width: viewportWidth || "100%" }}
            >
              {pageIndex === 0 && <LiveProjectsWidget />}
              <div className="mobile-home-grid grid w-full max-w-full grid-cols-4 gap-x-2 gap-y-5 pb-4">
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
                    aria-label={app.title}
                    className="mobile-app-tile flex w-full min-w-0 flex-col items-center gap-1.5 transition-transform active:scale-[0.92]"
                  >
                    <IosAppIcon src={app.icon} title={app.title} appId={app.id} />
                    <span className="ios-icon-label w-full truncate text-center text-[11px] font-medium text-white drop-shadow-sm">
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
