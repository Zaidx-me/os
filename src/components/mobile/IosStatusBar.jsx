import { useEffect, useState } from "react";
import { IosStatusTrailing } from "./IosStatusIcons.jsx";

function formatStatusTime(d) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function IosStatusBar({ onOpenControlCenter, variant = "light" }) {
  const [time, setTime] = useState(() => formatStatusTime(new Date()));

  useEffect(() => {
    const tick = () => setTime(formatStatusTime(new Date()));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  const isDark = variant === "dark";

  return (
    <header
      data-testid="ios-status-bar"
      className={`ios-status-bar relative z-20 flex shrink-0 items-center justify-between px-[1.35rem] pb-1 pt-[max(0.35rem,env(safe-area-inset-top))] ${
        isDark ? "text-black" : "text-white"
      }`}
    >
      <span className="ios-status-time">{time}</span>
      <IosStatusTrailing onClick={onOpenControlCenter} disabled={!onOpenControlCenter} />
    </header>
  );
}
