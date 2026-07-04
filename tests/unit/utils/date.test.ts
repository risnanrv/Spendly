import {
  getMonthStart,
  getMonthEnd,
  isSameMonth,
  addMonths,
  getMonthStr,
  getMonthName,
  toISODate,
  formatRelativeDate,
} from '@/utils/date';

describe('date utilities', () => {
  const testDate = new Date(2026, 6, 2); // 2nd July 2026

  describe('getMonthStart', () => {
    it('returns the first calendar day of the month at 00:00:00', () => {
      const start = getMonthStart(testDate);
      expect(start.getFullYear()).toBe(2026);
      expect(start.getMonth()).toBe(6);
      expect(start.getDate()).toBe(1);
    });
  });

  describe('getMonthEnd', () => {
    it('returns the final calendar day of the month', () => {
      const end = getMonthEnd(testDate);
      expect(end.getFullYear()).toBe(2026);
      expect(end.getMonth()).toBe(6);
      expect(end.getDate()).toBe(31); // July has 31 days
    });
  });

  describe('isSameMonth', () => {
    it('compares if two dates belong to the same calendar month', () => {
      const anotherJuly = new Date(2026, 6, 15);
      const august = new Date(2026, 7, 2);
      expect(isSameMonth(testDate, anotherJuly)).toBe(true);
      expect(isSameMonth(testDate, august)).toBe(false);
    });
  });

  describe('addMonths', () => {
    it('safely advances dates by given intervals', () => {
      const future = addMonths(testDate, 2);
      expect(future.getFullYear()).toBe(2026);
      expect(future.getMonth()).toBe(8); // September (0-indexed 8)
    });
  });

  describe('getMonthStr', () => {
    it('converts Date objects to YYYY-MM format', () => {
      expect(getMonthStr(testDate)).toBe('2026-07');
    });
  });

  describe('getMonthName', () => {
    it('returns a non-empty display string for a valid YYYY-MM input', () => {
      const label = getMonthName('2026-07');
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      // Should contain year portion
      expect(label).toContain('2026');
    });
  });

  describe('toISODate', () => {
    it('converts Date to YYYY-MM-DD ISO string', () => {
      // Create date in UTC to avoid timezone shifts
      const d = new Date(Date.UTC(2026, 6, 2));
      expect(toISODate(d)).toBe('2026-07-02');
    });
  });

  describe('formatRelativeDate', () => {
    it('returns Today for current date', () => {
      const today = new Date();
      expect(formatRelativeDate(today)).toBe('Today');
    });

    it('returns Yesterday for the previous day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });
  });
});
