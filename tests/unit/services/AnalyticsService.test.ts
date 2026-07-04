import { AnalyticsService } from '@/services/AnalyticsService';
import type { BudgetContext } from '@/services/AnalyticsService';
import type { ReportData } from '@/models/report';

const makeReport = (
  totalExpense = 0,
  categories: any[] = [],
  dailyTrend: any[] = []
): ReportData => ({
  month: '2026-07',
  summary: {
    totalExpense,
    totalTransactions: categories.length,
    averageTransaction: categories.length > 0 ? Math.round(totalExpense / categories.length) : 0,
    highestExpense: 0,
    lowestExpense: 0,
  },
  categoryBreakdown: categories,
  dailyTrend,
  weeklyComparison: [],
} as any as ReportData);

const makeNoBudget = (): BudgetContext => ({
  hasBudget: false,
  budgetAmount: 0,
  spent: 0,
  remaining: 0,
  remainingDays: 0,
  status: 'safe',
});

const makeBudget = (
  budgetAmount: number,
  spent: number,
  status: 'safe' | 'approaching' | 'exceeded',
  remainingDays = 10
): BudgetContext => ({
  hasBudget: true,
  budgetAmount,
  spent,
  remaining: Math.max(0, budgetAmount - spent),
  remainingDays,
  status,
});

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    analyticsService = new AnalyticsService();
  });

  describe('generateInsights', () => {
    it('generates a budget exceeded warning insight when status is exceeded', () => {
      const report = makeReport(11000, [], []);
      const budget = makeBudget(10000, 11000, 'exceeded');

      const result = analyticsService.generateInsights(report, budget);
      const exceeded = result.insights.find(i => i.id === 'budget-exceeded');

      expect(exceeded).toBeDefined();
      expect(exceeded?.type).toBe('warning');
    });

    it('generates a budget approaching warning insight when status is approaching', () => {
      const report = makeReport(8500, [], []);
      const budget = makeBudget(10000, 8500, 'approaching');

      const result = analyticsService.generateInsights(report, budget);
      const approaching = result.insights.find(i => i.id === 'budget-approaching');

      expect(approaching).toBeDefined();
      expect(approaching?.type).toBe('warning');
    });

    it('generates a budget safe success insight when status is safe', () => {
      const report = makeReport(5000, [], []);
      const budget = makeBudget(10000, 5000, 'safe');

      const result = analyticsService.generateInsights(report, budget);
      const safe = result.insights.find(i => i.id === 'budget-safe');

      expect(safe).toBeDefined();
      expect(safe?.type).toBe('success');
    });

    it('generates daily allowance insight when remaining days exist', () => {
      const report = makeReport(5000, [], []);
      const budget = makeBudget(10000, 5000, 'safe', 5);

      const result = analyticsService.generateInsights(report, budget);
      const allowance = result.insights.find(i => i.id === 'daily-allowance');

      expect(allowance).toBeDefined();
      expect(allowance?.type).toBe('info');
    });

    it('skips budget insights when no budget is defined', () => {
      const report = makeReport(5000, [], []);
      const budget = makeNoBudget();

      const result = analyticsService.generateInsights(report, budget);
      const budgetInsight = result.insights.find(
        i => i.id === 'budget-exceeded' || i.id === 'budget-approaching' || i.id === 'budget-safe'
      );
      expect(budgetInsight).toBeUndefined();
    });

    it('generates top category and average transaction insights', () => {
      const report = makeReport(10000, [
        {
          categoryId: 'cat-1',
          name: 'Food',
          icon: 'Utensils',
          color: '#ff0000',
          amount: 7000,
          percentage: 70,
          transactionCount: 5,
        },
      ], []);
      const budget = makeNoBudget();

      const result = analyticsService.generateInsights(report, budget);

      const topCat = result.insights.find(i => i.id === 'top-category');
      expect(topCat).toBeDefined();
      expect(topCat?.type).toBe('info');
    });

    it('generates month-over-month increase insight when spending went up', () => {
      const cat = {
        categoryId: 'cat-1', name: 'Food', icon: 'Utensils', color: '#f00',
        amount: 8000, percentage: 100, transactionCount: 4,
      };
      const prevReport = makeReport(5000, [{ ...cat, amount: 5000, percentage: 100 }], []);
      const currReport = makeReport(8000, [cat], []);
      const budget = makeNoBudget();

      const result = analyticsService.generateInsights(currReport, budget, prevReport);
      const momInsight = result.insights.find(i => i.id === 'mom-comparison');

      expect(momInsight).toBeDefined();
      expect(momInsight?.type).toBe('warning'); // Spending went up = warning
    });

    it('generates month-over-month decrease insight when spending went down', () => {
      const cat = {
        categoryId: 'cat-1', name: 'Food', icon: 'Utensils', color: '#f00',
        amount: 5000, percentage: 100, transactionCount: 3,
      };
      const prevReport = makeReport(8000, [{ ...cat, amount: 8000, percentage: 100 }], []);
      const currReport = makeReport(5000, [cat], []);
      const budget = makeNoBudget();

      const result = analyticsService.generateInsights(currReport, budget, prevReport);
      const momInsight = result.insights.find(i => i.id === 'mom-comparison');

      expect(momInsight?.type).toBe('success'); // Spending went down = success
    });

    it('caps insights to maximum 6 items', () => {
      const report = makeReport(10000, [
        {
          categoryId: 'cat-1',
          name: 'Food',
          icon: 'Utensils',
          color: '#ff0000',
          amount: 7000,
          percentage: 70,
          transactionCount: 5,
        },
      ], [
        { date: '2026-07-05', amount: 1000 }, // Saturday
        { date: '2026-07-06', amount: 2000 }, // Sunday
      ]);
      const budget = makeBudget(10000, 8500, 'approaching', 10);
      const prevReport = makeReport(8000, [], []);

      const result = analyticsService.generateInsights(report, budget, prevReport);
      expect(result.insights.length).toBeLessThanOrEqual(6);
    });

    it('identifies weekend spending patterns from daily trend data', () => {
      const report = makeReport(5000, [], [
        { date: '2026-07-04', amount: 3000 }, // Saturday
        { date: '2026-07-05', amount: 2000 }, // Sunday
      ]);
      const budget = makeNoBudget();

      const result = analyticsService.generateInsights(report, budget);
      // 100% weekend spending - should get "Weekend Spender"
      const weekendInsight = result.insights.find(i => i.id === 'weekend-spending');
      expect(weekendInsight).toBeDefined();
    });

    it('returns topCategory and weekendSpending in the result', () => {
      const report = makeReport(8000, [
        {
          categoryId: 'cat-1',
          name: 'Transport',
          icon: 'Car',
          color: '#0000ff',
          amount: 8000,
          percentage: 100,
          transactionCount: 10,
        },
      ], []);
      const budget = makeNoBudget();

      const result = analyticsService.generateInsights(report, budget);
      expect(result.topCategory?.name).toBe('Transport');
      expect(result.weekendSpending).toBe(0);
    });
  });
});
