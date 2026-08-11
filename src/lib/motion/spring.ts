/** Shared motion tokens — one coherent timing scale for the whole OS. */
export const motionTokens = {
  spring: {
    snappy: { type: "spring" as const, mass: 0.1, stiffness: 170, damping: 12 },
    smooth: { type: "spring" as const, stiffness: 300, damping: 30, mass: 1 },
    settle: { type: "spring" as const, stiffness: 200, damping: 20, mass: 1 },
    /** ~dampingRatio 0.85 — hero app/window open */
    hero: { type: "spring" as const, stiffness: 300, damping: 26, mass: 1 },
  },
  duration: {
    micro: 0.15,
    base: 0.25,
    hero: 0.35,
    close: 0.2,
    minimize: 0.3,
    spotlight: 0.2,
  },
  easing: {
    standard: [0.25, 0.1, 0.25, 1] as const,
    easeOut: [0, 0, 0.2, 1] as const,
    /** CSS/WAAPI string alias */
    easeOutCss: "cubic-bezier(0, 0, 0.2, 1)",
  },
};

/** @deprecated Use motionTokens.spring.smooth */
export const OS_SPRING = motionTokens.spring.smooth;

/** Stagger delay between icon-grid siblings (40–60ms). */
export const OS_STAGGER_MS = 50;

/** @deprecated Use motionTokens.duration */
export const OS_DURATION = {
  fast: motionTokens.duration.micro,
  base: motionTokens.duration.base,
  slow: motionTokens.duration.hero,
};

/** @deprecated Use motionTokens.easing */
export const OS_EASING = motionTokens.easing;
