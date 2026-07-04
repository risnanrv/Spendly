import type { Currency } from '@/stores/settings.store';
import { INR } from '@/stores/settings.store';

// Amounts are stored as integers (× 100, i.e. paisa) to avoid float precision issues.
// All formatting functions accept integer amounts and convert for display.

/**
 * Convert a display decimal amount to integer storage format.
 * e.g. 1234.56 → 123456
 */
export const toStorageAmount = (display: number): number => {
  return Math.round(display * 100);
};

/**
 * Convert an integer storage amount to decimal for display.
 * e.g. 123456 → 1234.56
 */
export const toDisplayAmount = (storage: number): number => {
  return storage / 100;
};

/**
 * Format a storage amount (integer) as a localized currency string.
 * e.g. 123456, INR → "₹1,234.56"
 */
export const formatAmount = (
  storageAmount: number,
  currency: Currency = INR,
): string => {
  const displayAmount = toDisplayAmount(storageAmount);
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount);
};

/**
 * Format a storage amount without the currency symbol.
 * e.g. 123456 → "1,234.56"
 */
export const formatAmountRaw = (
  storageAmount: number,
  currency: Currency = INR,
): string => {
  const displayAmount = toDisplayAmount(storageAmount);
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayAmount);
};

/**
 * Format a compact amount for space-constrained contexts.
 * e.g. 1500000 (₹15,000.00) → "₹15K"
 */
export const formatAmountCompact = (
  storageAmount: number,
  currency: Currency = INR,
): string => {
  const displayAmount = toDisplayAmount(storageAmount);
  if (displayAmount >= 100_000) {
    return `${currency.symbol}${(displayAmount / 100_000).toFixed(1)}L`;
  }
  if (displayAmount >= 1_000) {
    return `${currency.symbol}${(displayAmount / 1_000).toFixed(1)}K`;
  }
  return `${currency.symbol}${displayAmount.toFixed(0)}`;
};

/**
 * Calculate percentage (0–100) of amount relative to total.
 * Safe division — returns 0 if total is 0.
 */
export const calculatePercentage = (amount: number, total: number): number => {
  if (total === 0) return 0;
  return Math.min(Math.round((amount / total) * 100), 100);
};
