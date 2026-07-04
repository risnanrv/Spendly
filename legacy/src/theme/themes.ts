// ─── Spendly Theme Definitions ────────────────────────────────────────────
// Light and dark theme token maps. Every component MUST consume colors
// from the active theme — never hardcode hex values in components.

import { palette } from './colors';
import { shadows } from './shadows';
import { radius } from './radius';
import { spacing, layout } from './spacing';
import { fontFamily, fontSize, lineHeight, typeScale } from './typography';
import { duration, spring, pressScale, stateOpacity } from './motion';
import { borders } from './borders';
import { opacity } from './opacity';
import { zIndex } from './zindex';
import { sizes } from './sizes';

// ── Color token shape ────────────────────────────────────────────────────
export interface ThemeColors {
  // Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgElevated: string;
  bgOverlay: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textBrand: string;

  // Borders
  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;

  // Brand
  brandPrimary: string;
  brandDark: string;
  brandLight: string;

  // Semantic
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
  info: string;
  infoBg: string;

  // Chart Palette (Phase 2 requirement)
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

// ── Full theme shape ──────────────────────────────────────────────────────
export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  layout: typeof layout;
  radius: typeof radius;
  shadows: typeof shadows;
  borders: typeof borders;
  opacity: typeof opacity;
  zIndex: typeof zIndex;
  sizes: typeof sizes;
  typography: {
    fontFamily: typeof fontFamily;
    fontSize: typeof fontSize;
    lineHeight: typeof lineHeight;
    scale: typeof typeScale;
  };
  motion: {
    duration: typeof duration;
    spring: typeof spring;
    pressScale: typeof pressScale;
    stateOpacity: typeof stateOpacity;
  };
}

// ── Light Theme ──────────────────────────────────────────────────────────
const lightColors: ThemeColors = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F6F5FF',
  bgCard: '#FFFFFF',
  bgElevated: '#FFFFFF',
  bgOverlay: 'rgba(0,0,0,0.4)',

  textPrimary: '#0F0E17',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textBrand: '#5B45E0',

  borderSubtle: '#F0EFF8',
  borderDefault: '#E5E3F3',
  borderStrong: '#C4C0E6',

  brandPrimary: palette.brand[500],
  brandDark: palette.brand[600],
  brandLight: palette.brand[50],

  success: palette.green[500],
  successBg: '#ECFDF5',
  warning: palette.amber[500],
  warningBg: '#FFFBEB',
  danger: palette.red[500],
  dangerBg: '#FEF2F2',
  info: palette.blue[500],
  infoBg: '#EFF6FF',

  // Curated premium chart palette
  chart1: '#5B45E0', // brand primary
  chart2: '#10B981', // green
  chart3: '#3B82F6', // blue
  chart4: '#F59E0B', // amber
  chart5: '#EC4899', // pink
};

// ── Dark Theme ───────────────────────────────────────────────────────────
const darkColors: ThemeColors = {
  bgPrimary: '#0C0B14',
  bgSecondary: '#131120',
  bgCard: '#1A1730',
  bgElevated: '#201D38',
  bgOverlay: 'rgba(0,0,0,0.7)',

  textPrimary: '#F4F3FF',
  textSecondary: '#9B9AB0',
  textTertiary: '#5E5D72',
  textInverse: '#0F0E17',
  textBrand: '#8A79F3',

  borderSubtle: '#1E1C30',
  borderDefault: '#2A2745',
  borderStrong: '#3D3A60',

  brandPrimary: '#7B6CF0',
  brandDark: palette.brand[500],
  brandLight: '#2A244A',

  success: palette.green[400],
  successBg: '#052E1B',
  warning: palette.amber[400],
  warningBg: '#2B1E04',
  danger: palette.red[400],
  dangerBg: '#2D0A0A',
  info: palette.blue[400],
  infoBg: '#0D1F3C',

  chart1: '#8A79F3', // lighter indigo for dark mode contrast
  chart2: '#34D399',
  chart3: '#60A5FA',
  chart4: '#FBBF24',
  chart5: '#F472B6',
};

// ── Shared non-color tokens ──────────────────────────────────────────────
const sharedTokens = {
  spacing,
  layout,
  radius,
  shadows,
  borders,
  opacity,
  zIndex,
  sizes,
  typography: {
    fontFamily,
    fontSize,
    lineHeight,
    scale: typeScale,
  },
  motion: {
    duration,
    spring,
    pressScale,
    stateOpacity,
  },
};

// ── Exported themes ──────────────────────────────────────────────────────
export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  ...sharedTokens,
};

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  ...sharedTokens,
};
