// ─── Spendly Motion & Animation Tokens ───────────────────────────────────
// All animation durations and easing curves for Reanimated 3

export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  relaxed: 400,
  slow: 500,
} as const;

export type DurationToken = keyof typeof duration;

// Spring configs for react-native-reanimated withSpring
export const spring = {
  snappy: { damping: 20, stiffness: 300, mass: 1 },
  bouncy: { damping: 12, stiffness: 250, mass: 1 },
  smooth: { damping: 25, stiffness: 200, mass: 1 },
  gentle: { damping: 30, stiffness: 150, mass: 1 },
} as const;

// Scale values for press animations
export const pressScale = {
  button: 0.96,
  card: 0.98,
  fab: 0.90,
  icon: 0.92,
} as const;

// Opacity values for states
export const stateOpacity = {
  pressed: 0.85,
  disabled: 0.4,
  placeholder: 0.5,
} as const;
