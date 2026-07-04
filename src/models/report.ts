/**
 * Domain models for the Reports and Analytics module.
 * These types are independent from the database/repository layer.
 */

// ─── Core Summary ────────────────────────────────────────────────────────────

export interface ReportSummary {
  totalIncome: number;        // cents
  totalExpense: number;       // cents
  netBalance: number;         // cents (income - expense)
  transactionCount: number;
  averageTransaction: number; // cents
  averageDailySpending: number; // cents
  largestExpense: number;     // cents
  smallestExpense: number;    // cents
  highestSpendingDay: TrendPoint | null;
  lowestSpendingDay: TrendPoint | null;
}

// ─── Breakdown ────────────────────────────────────────────────────────────────

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  amount: number;     // cents
  percentage: number; // 0–100
  count: number;
}

// ─── Trend Points ─────────────────────────────────────────────────────────────

export interface TrendPoint {
  label: string;      // "Mon", "Jan", "2026-07-01", etc.
  amount: number;     // cents
  date?: string;      // ISO string for the data point
}

export type TrendGranularity = 'daily' | 'weekly' | 'monthly';

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface ReportData {
  summary: ReportSummary;
  categoryBreakdown: CategoryBreakdown[];
  topCategories: CategoryBreakdown[];          // Top 5 by amount
  dailyTrend: TrendPoint[];
  weeklyTrend: TrendPoint[];
  monthlyTrend: TrendPoint[];
  recentTransactions: RecentTransaction[];
  period: ReportPeriod;
}

export interface MonthlyReport extends ReportData {
  monthStr: string;   // "YYYY-MM"
}

export interface YearlyReport extends ReportData {
  year: number;
  monthlyBreakdown: MonthlyBreakdownItem[];
}

export interface MonthlyBreakdownItem {
  monthStr: string;
  totalExpense: number;
  totalIncome: number;
  count: number;
}

// ─── Filter & Period ─────────────────────────────────────────────────────────

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

export interface ReportPeriod {
  preset: DateRangePreset;
  startDate: string;  // ISO date string "YYYY-MM-DD"
  endDate: string;    // ISO date string "YYYY-MM-DD"
  label: string;      // e.g. "July 2026"
}

export interface ReportFilter {
  period: ReportPeriod;
  categoryIds?: string[];
}

// ─── Comparison ───────────────────────────────────────────────────────────────

export interface MonthlyComparison {
  currentMonthStr: string;
  previousMonthStr: string;
  currentTotal: number;
  previousTotal: number;
  difference: number;         // cents, positive = more spent
  percentageChange: number;   // 0–100+, positive = more spent
  isIncrease: boolean;
}

// ─── Analytics Insights ──────────────────────────────────────────────────────

export type InsightType = 'warning' | 'info' | 'success' | 'neutral';

export interface AnalyticsInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  icon?: string;        // Lucide icon name
  value?: string;       // formatted highlight value, e.g. "₹2,400"
}

// ─── Chart Dataset ────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  value: number;
  label: string;
  color?: string;
  frontColor?: string;  // for bar charts
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  color?: string;
}

// ─── Recent Transactions ──────────────────────────────────────────────────────

export interface RecentTransaction {
  id: string;
  title: string;
  amount: number;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  date: string;   // ISO
}
