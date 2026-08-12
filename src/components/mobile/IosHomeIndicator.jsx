/** Decorative home indicator — no swipe gestures (unreliable in mobile browsers). */
export default function IosHomeIndicator({ variant = "light" }) {
  return (
    <div
      data-testid="ios-home-indicator"
      className="ios-home-indicator-host pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center"
      aria-hidden
    >
      <div className={`ios-home-indicator ${variant === "dark" ? "ios-home-indicator--dark" : ""}`} />
    </div>
  );
}
