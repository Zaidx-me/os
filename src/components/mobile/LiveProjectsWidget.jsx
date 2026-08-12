import { useCallback, useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { projects } from "../../zaidos/content/index.ts";
import { openBrowser } from "../../zaidos/lib/openBrowser.js";

const LIVE = projects.filter((p) => p.status === "live" && p.links.live);
const AUTO_MS = 6000;
const SWIPE_THRESHOLD = 40;

export default function LiveProjectsWidget() {
  const [index, setIndex] = useState(0);
  const dragRef = useRef({ startX: 0, moved: false });
  const count = LIVE.length;

  const goTo = useCallback(
    (next) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [count]);

  if (count === 0) return null;

  const project = LIVE[index];

  return (
    <section
      data-testid="mobile-live-projects-widget"
      className="mobile-widget-row mb-3 w-full"
      aria-label="Live projects widget"
    >
      <div
        className="live-projects-widget relative h-[8.75rem] w-full overflow-hidden rounded-[1.35rem] border border-white/20 bg-black/25 shadow-lg backdrop-blur-xl"
        onPointerDown={(e) => {
          dragRef.current = { startX: e.clientX, moved: false };
        }}
        onPointerMove={(e) => {
          if (Math.abs(e.clientX - dragRef.current.startX) > 8) {
            dragRef.current.moved = true;
          }
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - dragRef.current.startX;
          if (dragRef.current.moved && Math.abs(dx) > SWIPE_THRESHOLD) {
            goTo(dx < 0 ? index + 1 : index - 1);
            return;
          }
          if (!dragRef.current.moved) openBrowser(project.links.live);
        }}
        onPointerCancel={() => {
          dragRef.current = { startX: 0, moved: false };
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: `${count * 100}%`,
            transform: `translateX(-${(index / count) * 100}%)`,
          }}
        >
          {LIVE.map((p) => (
            <article
              key={p.id}
              data-testid={`mobile-live-${p.id}`}
              className="flex h-full min-w-0 shrink-0 flex-col justify-between px-4 py-3 text-left"
              style={{ width: `${100 / count}%` }}
            >
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-green-300">
                  <Globe size={11} strokeWidth={2.5} aria-hidden />
                  Live
                </div>
                <h3 className="truncate text-[15px] font-semibold leading-tight text-white">{p.title}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/70">{p.tagline}</p>
              </div>
              <span className="shrink-0 pt-1 text-[10px] font-medium text-white/50">Tap to open · swipe</span>
            </article>
          ))}
        </div>

        {count > 1 && (
          <div className="mobile-widget-dots pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-[5px]">
            {LIVE.map((p, i) => (
              <span key={p.id} className={`mobile-widget-dot ${i === index ? "is-active" : ""}`} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
