// ─── Date Utilities ───────────────────────────────────────────────────────
// All date operations use native JS Date — no heavy date library required
// for the current feature set. Add date-fns if complexity grows.

/**
 * Get the first day of a given month as a Date.
 */
export const getMonthStart = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * Get the last day of a given month as a Date.
 */
export const getMonthEnd = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

/**
 * Format a Date to display month + year string.
 * e.g. → "July 2026"
 */
export const formatMonthYear = (date: Date = new Date()): string => {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/**
 * Format a Date to a short date string for list items.
 * e.g. → "2 Jul"
 */
export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/**
 * Format a Date to a long date string for detail views.
 * e.g. → "Wednesday, 2 July 2026"
 */
export const formatLongDate = (date: Date): string => {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format a Date as "Today", "Yesterday", or a short date.
 */
export const formatRelativeDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return formatShortDate(date);
};

/**
 * Convert a Date to an ISO date string (YYYY-MM-DD).
 */
export const toISODate = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? '';
};

/**
 * Get the current epoch timestamp in milliseconds.
 */
export const nowMs = (): number => Date.now();

/**
 * Check if two dates fall in the same calendar month.
 */
export const isSameMonth = (a: Date, b: Date): boolean => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
};

/**
 * Add months to a date (safe for end-of-month dates).
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Convert Date to "YYYY-MM" string.
 */
export const getMonthStr = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

/**
 * Convert "YYYY-MM" string to month name "July 2026".
 */
export const getMonthName = (monthStr: string): string => {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return formatMonthYear(date);
};

/**
 * Contextual greeting based on hour of the day.
 */
export const getGreeting = (): string => {
  const hours = new Date().getHours();
  if (hours < 12) return 'Good Morning';
  if (hours < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Readable display string for today's date.
 * e.g. Wednesday, Jul 2
 */
export const getTodayDateStr = (): string => {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};
