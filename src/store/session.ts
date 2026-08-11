/** Wall-clock moment this browser tab session started (client-only). */
export const SESSION_START_MS =
  typeof performance !== "undefined" ? performance.timeOrigin : Date.now();

/** Seconds since this tab session began. */
export function getSessionUptimeSec(nowMs = Date.now()): number {
  return Math.max(0, Math.floor((nowMs - SESSION_START_MS) / 1000));
}

/** Hyprland-style uptime label (matches waybar's minute:second feel). */
export function formatSessionUptime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}
