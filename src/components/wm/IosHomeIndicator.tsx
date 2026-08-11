"use client";

/** Decorative iOS home indicator pill (visual only — nav is AssistiveTouch ball). */
export default function IosHomeIndicator({
  variant = "light",
  decorative = true,
}: {
  variant?: "light" | "dark";
  decorative?: boolean;
}) {
  return (
    <div
      data-testid="ios-home-indicator-host"
      className="ios-home-indicator-host pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center"
      aria-hidden={decorative}
    >
      <span
        data-testid="ios-home-indicator"
        className={`ios-home-indicator block ${
          variant === "dark" ? "ios-home-indicator--dark" : ""
        } ${decorative ? "ios-home-indicator--decorative" : ""}`}
      />
    </div>
  );
}
