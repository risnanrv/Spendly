/**
 * Integration test: Budget lifecycle
 *
 * Tests the full budget lifecycle — save, fetch details, compute status, delete —
 * using mocked repositories to simulate the SQLite data layer.
 */
import { BudgetService } from '@/services/BudgetService';
import type { IBudgetRepository, IExpenseRepository } from '@/database/repositories/interfaces';
import type { MonthlyBudget } from '@/models/domain';

const MONTH = '2026-07';

const makeBudget = (amount: number): MonthlyBudget => ({
  id: 'budget-uuid',
  month: MONTH,
  amount,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  operationVersion: 1,
} as any as MonthlyBudget);

describe('Budget Lifecycle Integration', () => {
  let service: BudgetService;
  let budgetRepo: jest.Mocked<IBudgetRepository>;
  let expenseRepo: jest.Mocked<IExpenseRepository>;

  beforeEach(() => {
    budgetRepo = {
      getCurrentBudget: jest.fn(),
      setBudget: jest.fn(),
      deleteBudget: jest.fn(),
    } as any;

    expenseRepo = {
      getExpensesByMonth: jest.fn(),
    } as any;

    service = new BudgetService(budgetRepo, expenseRepo);
  });

  it('saves budget and computes accurate status on subsequent fetch', async () => {
    // Save
    const savedBudget = makeBudget(20000_00); // Rs. 20,000
    budgetRepo.setBudget.mockResolvedValueOnce(savedBudget);

    const result = await service.saveBudget(MONTH, 20000_00);
    expect(result.amount).toBe(20000_00);
    expect(budgetRepo.setBudget).toHaveBeenCalledWith(MONTH, 20000_00);

    // Fetch details
    budgetRepo.getCurrentBudget.mockResolvedValueOnce(savedBudget);
    expenseRepo.getExpensesByMonth.mockResolvedValueOnce([
      { amount: 5000_00 }, // Rs. 5000 (25%)
    ] as any);

    const details = await service.getBudgetDetails(MONTH);
    expect(details.budget).toBe(20000_00);
    expect(details.spent).toBe(5000_00);
    expect(details.status).toBe('safe');
    expect(details.percentage).toBe(25);
  });

  it('transitions to approaching status at 80% utilization', async () => {
    const budget = makeBudget(10000_00);
    budgetRepo.getCurrentBudget.mockResolvedValueOnce(budget);
    expenseRepo.getExpensesByMonth.mockResolvedValueOnce([
      { amount: 8500_00 }, // 85%
    ] as any);

    const details = await service.getBudgetDetails(MONTH);
    expect(details.status).toBe('approaching');
    expect(details.isNearLimit).toBe(true);
  });

  it('transitions to exceeded status when spending crosses 100%', async () => {
    const budget = makeBudget(10000_00);
    budgetRepo.getCurrentBudget.mockResolvedValueOnce(budget);
    expenseRepo.getExpensesByMonth.mockResolvedValueOnce([
      { amount: 12000_00 }, // 120%
    ] as any);

    const details = await service.getBudgetDetails(MONTH);
    expect(details.status).toBe('exceeded');
    expect(details.remaining).toBe(0); // Capped at 0 — never negative
  });

  it('deletes budget successfully', async () => {
    budgetRepo.deleteBudget.mockResolvedValueOnce(undefined);
    await service.deleteBudget(MONTH);
    expect(budgetRepo.deleteBudget).toHaveBeenCalledWith(MONTH);
  });

  it('rejects saveBudget with zero amount', async () => {
    await expect(service.saveBudget(MONTH, 0)).rejects.toThrow(
      'Budget amount must be greater than zero.'
    );
  });

  it('rejects saveBudget with invalid month format', async () => {
    await expect(service.saveBudget('07-2026', 10000)).rejects.toThrow(
      'Invalid month format. Expected YYYY-MM.'
    );
  });
});
