// ─── Spendly Typography Tokens ────────────────────────────────────────────
// All type sizes follow the Design System Specification (Phase 0, Doc 03).
// Inter is the primary font family. All components must use these scales.

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
} as const;

export type FontFamily = (typeof fontFamily)[keyof typeof fontFamily];

export const fontSize = {
  'display-xl': 48,
  'display-l': 36,
  'display-m': 28,
  'title-l': 22,
  'title-m': 18,
  'title-s': 16,
  'body-l': 16,
  'body-m': 14,
  'body-s': 13,
  'label-l': 14,
  'label-m': 12,
  'label-s': 11,
} as const;

export type FontSizeToken = keyof typeof fontSize;

export const lineHeight = {
  'display-xl': 48,
  'display-l': 40,
  'display-m': 32,
  'title-l': 28,
  'title-m': 24,
  'title-s': 22,
  'body-l': 24,
  'body-m': 21,
  'body-s': 19,
  'label-l': 18,
  'label-m': 16,
  'label-s': 14,
} as const;

// Pre-composed type scales for common use cases
export const typeScale = {
  displayXl: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['display-xl'],
    lineHeight: lineHeight['display-xl'],
  },
  displayL: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['display-l'],
    lineHeight: lineHeight['display-l'],
  },
  displayM: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['display-m'],
    lineHeight: lineHeight['display-m'],
  },
  titleL: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['title-l'],
    lineHeight: lineHeight['title-l'],
  },
  titleM: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize['title-m'],
    lineHeight: lineHeight['title-m'],
  },
  titleS: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize['title-s'],
    lineHeight: lineHeight['title-s'],
  },
  bodyL: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-l'],
    lineHeight: lineHeight['body-l'],
  },
  bodyM: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-m'],
    lineHeight: lineHeight['body-m'],
  },
  bodyS: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize['body-s'],
    lineHeight: lineHeight['body-s'],
  },
  labelL: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['label-l'],
    lineHeight: lineHeight['label-l'],
  },
  labelM: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['label-m'],
    lineHeight: lineHeight['label-m'],
  },
  labelS: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize['label-s'],
    lineHeight: lineHeight['label-s'],
  },
} as const;

export type TypeScaleKey = keyof typeof typeScale;
