import { ExpenseService } from '@/services/ExpenseService';
import type { IExpenseRepository } from '@/database/repositories/interfaces';

describe('ExpenseService', () => {
  let expenseService: ExpenseService;
  let mockExpenseRepo: jest.Mocked<IExpenseRepository>;

  beforeEach(() => {
    mockExpenseRepo = {
      createExpense: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
      restoreExpense: jest.fn(),
      getExpenseById: jest.fn(),
      getExpensesForMonth: jest.fn(),
      getExpensesForRange: jest.fn(),
      getRecentExpenses: jest.fn(),
    } as any;

    expenseService = new ExpenseService(mockExpenseRepo);
  });

  describe('createExpense', () => {
    const validCategoryId = '12345678-1234-1234-1234-1234567890ab';
    const validInsertData = {
      title: 'Groceries',
      amount: 1500, // Rs. 15.00
      categoryId: validCategoryId,
      date: new Date('2026-07-02'),
      note: 'Weekly grocery shopping',
    };

    it('creates an expense successfully when all arguments are valid', async () => {
      mockExpenseRepo.createExpense.mockResolvedValueOnce({
        id: 'mock-expense-id',
        ...validInsertData,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      const result = await expenseService.createExpense(validInsertData);
      expect(result.id).toBe('mock-expense-id');
      expect(mockExpenseRepo.createExpense).toHaveBeenCalledWith(
        {
          title: 'Groceries',
          amount: 1500,
          categoryId: validCategoryId,
          date: validInsertData.date,
          note: 'Weekly grocery shopping',
        },
        undefined
      );
    });

    it('throws validation error if title is empty', async () => {
      await expect(
        expenseService.createExpense({ ...validInsertData, title: '  ' })
      ).rejects.toThrow('Expense title is required.');
    });

    it('throws validation error if amount is zero or negative', async () => {
      await expect(
        expenseService.createExpense({ ...validInsertData, amount: 0 })
      ).rejects.toThrow('Expense amount must be greater than zero.');
    });

    it('throws validation error if category UUID is invalid', async () => {
      await expect(
        expenseService.createExpense({ ...validInsertData, categoryId: 'invalid-uuid' })
      ).rejects.toThrow('Selected category is invalid.');
    });
  });
});
