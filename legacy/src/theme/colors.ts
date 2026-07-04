// ─── Spendly Color Tokens ─────────────────────────────────────────────────
// All color values follow the Design System Specification (Phase 0, Doc 03)
// Never import raw hex colors directly in components — use theme tokens.

export const palette = {
  // Brand identity — Spendly Indigo
  brand: {
    50: '#EEEBFF',
    100: '#D9D3FF',
    200: '#B9ACFF',
    300: '#9A83FF',
    400: '#7B6CF0',
    500: '#5B45E0', // Primary brand color
    600: '#4332B8',
    700: '#2E2280',
    800: '#1C1550',
    900: '#120F2A',
  },

  // Neutral grays with subtle purple undertone
  neutral: {
    0: '#FFFFFF',
    50: '#F6F5FF',
    100: '#EEECF8',
    200: '#E5E3F3',
    300: '#C4C0E6',
    400: '#9B9AB0',
    500: '#6B7280',
    600: '#5E5D72',
    700: '#4B4A5E',
    800: '#2A2745',
    900: '#1A1730',
    950: '#131120',
    1000: '#0C0B14',
  },

  // Semantic colors
  green: {
    400: '#34D399',
    500: '#10B981',
    900: '#052E1B',
  },
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    900: '#2B1E04',
  },
  red: {
    400: '#F87171',
    500: '#EF4444',
    900: '#2D0A0A',
  },
  blue: {
    400: '#60A5FA',
    500: '#3B82F6',
    900: '#0D1F3C',
  },
} as const;

// Category color palette — 16 curated colors
export const categoryColors = [
  '#EF4444', // cat-1  Food & Dining
  '#F97316', // cat-2  Transport
  '#EAB308', // cat-3  Entertainment
  '#22C55E', // cat-4  Groceries
  '#14B8A6', // cat-5  Health
  '#3B82F6', // cat-6  Shopping
  '#8B5CF6', // cat-7  Bills & Utilities
  '#EC4899', // cat-8  Beauty
  '#06B6D4', // cat-9  Travel
  '#84CC16', // cat-10 Education
  '#F43F5E', // cat-11 Subscriptions
  '#A855F7', // cat-12 Personal Care
  '#6366F1', // cat-13 Technology
  '#0EA5E9', // cat-14 Sports & Fitness
  '#D97706', // cat-15 Gifts
  '#64748B', // cat-16 Other
] as const;

export type CategoryColor = (typeof categoryColors)[number];
