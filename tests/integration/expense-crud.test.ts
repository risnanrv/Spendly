/**
 * Integration test: Expense CRUD flow
 *
 * Tests the end-to-end create → read → update → delete cycle using
 * mocked repository implementations to simulate real database interactions.
 */
import { ExpenseService } from '@/services/ExpenseService';
import type { IExpenseRepository } from '@/database/repositories/interfaces';
import type { Expense } from '@/models/domain';

const CATEGORY_ID = '12345678-1234-1234-1234-1234567890ab';
const EXPENSE_ID  = 'abcdefab-1234-1234-1234-abcdefabcdef';

const makeExpense = (overrides: Partial<Expense> = {}): Expense => ({
  id: EXPENSE_ID,
  title: 'Coffee',
  note: null,
  amount: 25000,
  categoryId: CATEGORY_ID,
  date: new Date('2026-07-01'),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  operationVersion: 1,
  ...overrides,
} as any as Expense);

describe('Expense CRUD Integration', () => {
  let service: ExpenseService;
  let repo: jest.Mocked<IExpenseRepository>;

  beforeEach(() => {
    repo = {
      createExpense: jest.fn(),
      updateExpense: jest.fn(),
      deleteExpense: jest.fn(),
      restoreExpense: jest.fn(),
      getExpenseById: jest.fn(),
      getExpensesForMonth: jest.fn(),
      getExpensesForRange: jest.fn(),
      getRecentExpenses: jest.fn(),
      getExpensesByMonth: jest.fn(),
    } as any;
    service = new ExpenseService(repo);
  });

  it('full CRUD cycle completes without errors', async () => {
    // CREATE
    const created = makeExpense();
    repo.createExpense.mockResolvedValueOnce(created);

    const expense = await service.createExpense({
      title: 'Coffee',
      amount: 25000,
      categoryId: CATEGORY_ID,
      date: new Date('2026-07-01'),
    });
    expect(expense.id).toBe(EXPENSE_ID);
    expect(repo.createExpense).toHaveBeenCalledTimes(1);

    // UPDATE
    repo.updateExpense.mockResolvedValueOnce(undefined);
    await service.updateExpense(EXPENSE_ID, { title: 'Latte', amount: 30000 });
    expect(repo.updateExpense).toHaveBeenCalledWith(
      EXPENSE_ID,
      { title: 'Latte', amount: 30000 },
      undefined
    );

    // DELETE
    repo.deleteExpense.mockResolvedValueOnce(undefined);
    await service.deleteExpense(EXPENSE_ID);
    expect(repo.deleteExpense).toHaveBeenCalledWith(EXPENSE_ID, undefined);

    // RESTORE
    repo.restoreExpense.mockResolvedValueOnce(undefined);
    await service.restoreExpense(EXPENSE_ID);
    expect(repo.restoreExpense).toHaveBeenCalledWith(EXPENSE_ID, undefined);
  });

  it('rejects invalid UUID on update without calling repository', async () => {
    await expect(service.updateExpense('bad-id', { title: 'X' })).rejects.toThrow(
      'Invalid expense identifier.'
    );
    expect(repo.updateExpense).not.toHaveBeenCalled();
  });

  it('rejects invalid UUID on delete without calling repository', async () => {
    await expect(service.deleteExpense('bad-id')).rejects.toThrow(
      'Invalid expense identifier.'
    );
    expect(repo.deleteExpense).not.toHaveBeenCalled();
  });

  it('creates expense with optional note field', async () => {
    repo.createExpense.mockResolvedValueOnce(makeExpense({ note: 'Quick note' }));

    await service.createExpense({
      title: 'Snack',
      amount: 5000,
      categoryId: CATEGORY_ID,
      date: new Date(),
      note: 'Quick note',
    });

    const callArg = repo.createExpense.mock.calls[0]?.[0];
    expect(callArg?.note).toBe('Quick note');
  });

  it('strips whitespace from title before creating', async () => {
    repo.createExpense.mockResolvedValueOnce(makeExpense({ title: 'Trimmed' }));

    await service.createExpense({
      title: '  Trimmed  ',
      amount: 5000,
      categoryId: CATEGORY_ID,
      date: new Date(),
    });

    const callArg = repo.createExpense.mock.calls[0]?.[0];
    expect(callArg?.title).toBe('Trimmed');
  });
});
