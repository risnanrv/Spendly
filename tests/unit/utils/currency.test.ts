import {
  toStorageAmount,
  toDisplayAmount,
  formatAmount,
  formatAmountRaw,
  formatAmountCompact,
  calculatePercentage,
} from '@/utils/currency';
import { INR } from '@/stores/settings.store';

describe('currency utilities', () => {
  describe('toStorageAmount', () => {
    it('converts display decimal values to paisa integer values', () => {
      expect(toStorageAmount(12.34)).toBe(1234);
      expect(toStorageAmount(0)).toBe(0);
      expect(toStorageAmount(-5.5)).toBe(-550);
    });
  });

  describe('toDisplayAmount', () => {
    it('converts paisa storage integers to display decimals', () => {
      expect(toDisplayAmount(1234)).toBe(12.34);
      expect(toDisplayAmount(0)).toBe(0);
      expect(toDisplayAmount(-550)).toBe(-5.5);
    });
  });

  describe('calculatePercentage', () => {
    it('calculates the integer percentage of a value relative to total', () => {
      expect(calculatePercentage(50, 100)).toBe(50);
      expect(calculatePercentage(10, 30)).toBe(33);
      expect(calculatePercentage(120, 100)).toBe(100); // capped at 100%
    });

    it('gracefully returns 0 when total is 0', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe('formatAmountCompact', () => {
    it('formats values under 1,000 normally', () => {
      expect(formatAmountCompact(45000, INR)).toBe('₹450');
    });

    it('formats values over 1,000 with K units', () => {
      expect(formatAmountCompact(150000, INR)).toBe('₹1.5K');
    });

    it('formats values over 100,000 with L units', () => {
      expect(formatAmountCompact(15000000, INR)).toBe('₹1.5L');
    });
  });

  describe('formatAmountRaw', () => {
    it('formats amount in decimal representation without symbol', () => {
      expect(formatAmountRaw(123456, INR).replace(/\s/g, ' ')).toBe('1,234.56');
    });
  });

  describe('formatAmount', () => {
    it('formats localization layout with currency symbols', () => {
      expect(formatAmount(123456, INR).replace(/\u00a0/g, ' ')).toBe('₹1,234.56');
    });
  });
});
