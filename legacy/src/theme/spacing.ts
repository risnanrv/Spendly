// ─── Spendly Spacing Tokens ───────────────────────────────────────────────
// Based on 8-point grid. All spacing values in the app must use these tokens.

export const spacing = {
  0: 0,
  px: 1,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

export type SpacingToken = keyof typeof spacing;
export type SpacingValue = (typeof spacing)[SpacingToken];

// Named semantic spacing
export const layout = {
  screenHorizontalPadding: spacing[6], // 24px
  cardPaddingH: spacing[6],            // 24px
  cardPaddingV: spacing[5],            // 20px
  listItemPaddingH: spacing[4],        // 16px
  listItemPaddingV: spacing[3],        // 12px
  tabBarHeight: 64,
  fabSize: 56,
  inputHeight: 52,
  buttonHeight: 48,
  buttonHeightSm: 40,
  touchTargetMin: 44,
} as const;
