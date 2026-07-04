import { BudgetService } from '@/services/BudgetService';
import type { IBudgetRepository, IExpenseRepository } from '@/database/repositories/interfaces';

describe('BudgetService', () => {
  let budgetService: BudgetService;
  let mockBudgetRepo: jest.Mocked<IBudgetRepository>;
  let mockExpenseRepo: jest.Mocked<IExpenseRepository>;

  beforeEach(() => {
    mockBudgetRepo = {
      getCurrentBudget: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
    } as any;

    mockExpenseRepo = {
      getExpensesByMonth: jest.fn(),
    } as any;

    budgetService = new BudgetService(mockBudgetRepo, mockExpenseRepo);
  });

  describe('getBudgetDetails', () => {
    const monthStr = '2026-07';

    it('returns empty details if no budget exists for target month', async () => {
      mockBudgetRepo.getCurrentBudget.mockResolvedValueOnce(null);
      mockExpenseRepo.getExpensesByMonth.mockResolvedValueOnce([
        { amount: 5000 },
      ] as any);

      const details = await budgetService.getBudgetDetails(monthStr);
      expect(details.budget).toBe(0);
      expect(details.spent).toBe(5000);
      expect(details.status).toBe('none');
    });

    it('resolves safe status when total expenses are below 80% of budget limit', async () => {
      mockBudgetRepo.getCurrentBudget.mockResolvedValueOnce({
        id: 'budget-id',
        month: monthStr,
        amount: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockExpenseRepo.getExpensesByMonth.mockResolvedValueOnce([
        { amount: 5000 }, // 50%
      ] as any);

      const details = await budgetService.getBudgetDetails(monthStr);
      expect(details.status).toBe('safe');
      expect(details.remaining).toBe(5000);
      expect(details.isNearLimit).toBe(false);
      expect(details.isExceeded).toBe(false);
    });

    it('resolves approaching status when total expenses cross 80% of budget limit', async () => {
      mockBudgetRepo.getCurrentBudget.mockResolvedValueOnce({
        id: 'budget-id',
        month: monthStr,
        amount: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockExpenseRepo.getExpensesByMonth.mockResolvedValueOnce([
        { amount: 8500 }, // 85%
      ] as any);

      const details = await budgetService.getBudgetDetails(monthStr);
      expect(details.status).toBe('approaching');
      expect(details.isNearLimit).toBe(true);
      expect(details.isExceeded).toBe(false);
    });

    it('resolves exceeded status when total expenses hit 100% of budget limit', async () => {
      mockBudgetRepo.getCurrentBudget.mockResolvedValueOnce({
        id: 'budget-id',
        month: monthStr,
        amount: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockExpenseRepo.getExpensesByMonth.mockResolvedValueOnce([
        { amount: 11000 }, // 110%
      ] as any);

      const details = await budgetService.getBudgetDetails(monthStr);
      expect(details.status).toBe('exceeded');
      expect(details.isNearLimit).toBe(false);
      expect(details.isExceeded).toBe(true);
    });

    it('throws validation error when month format is invalid', async () => {
      await expect(budgetService.getBudgetDetails('2026-7')).rejects.toThrow();
    });
  });
});
