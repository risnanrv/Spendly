'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses, useDeleteExpense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { getMonthStr, getMonthName } from '@/utils/date';
import { formatAmount } from '@/utils/currency';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ExpenseCard } from '@/components/ExpenseCard';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog';
import {
  Search,
  ChevronDown,
  Trash2,
  Edit3,
  Plus,
  Loader2,
  Calendar,
  AlertTriangle,
  FolderMinus,
  ArrowUpDown,
} from 'lucide-react';

export default function ExpensesPage() {
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteExpense();

  // Filters State
  const [monthStr, setMonthStr] = useState<string>(getMonthStr(new Date()));
  const [categoryId, setCategoryId] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Sort State
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<any | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Fetch expenses using Server Action hook
  const { data: expensesList, isLoading, isError, error } = useExpenses({
    monthStr,
    categoryId: categoryId || undefined,
    search: search || undefined,
  });

  const handleEdit = (expense: any) => {
    setExpenseToEdit(expense);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setExpenseToEdit(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    setExpenseToDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDeleteId) {
      await deleteMutation.mutateAsync(expenseToDeleteId);
      setExpenseToDeleteId(null);
    }
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Sort expenses client-side
  const sortedExpenses = useMemo(() => {
    if (!expensesList) return [];
    return [...expensesList].sort((a: any, b: any) => {
      let comp = 0;
      if (sortField === 'amount') {
        comp = a.amount - b.amount;
      } else {
        comp = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return sortOrder === 'desc' ? -comp : comp;
    });
  }, [expensesList, sortField, sortOrder]);

  const monthOptions = useMemo(() => {
    const list = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      list.push({
        value: getMonthStr(d),
        label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      });
    }
    return list;
  }, []);

  return (
    <div className="space-y-6 select-none pb-12">
      {/* Header section (Desktop only, mobile uses FAB and page title) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111]">
            Expenses
          </h1>
          <p className="text-xs text-[#707070] mt-1">
            Track and manage your daily spending records.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="hidden md:flex px-4 py-2.5 bg-black hover:bg-black/90 transition-all rounded-lg font-semibold text-sm text-white items-center gap-1.5 active:scale-[0.98]"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Expense
        </button>
      </div>

      {/* 1. Month Filter */}
      <div className="flex items-center gap-3">
        <div className="relative min-w-[200px]">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
          <select
            value={monthStr}
            onChange={(e) => setMonthStr(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl text-sm font-bold text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors appearance-none cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-black">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
        </div>
      </div>

      {/* 2. Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl text-sm text-[#111111] placeholder-text-tertiary focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
        />
      </div>

      {/* 3. Category Chips (Horizontal Scrollable list) */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#707070]">Categories</span>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none scroll-smooth">
          {/* "All" chip */}
          <button
            onClick={() => setCategoryId('')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
              categoryId === ''
                ? 'bg-black border-black text-white'
                : 'bg-[#F7F7F7] border-[#EAEAEA] text-[#707070] hover:border-black/20'
            }`}
          >
            All
          </button>
          
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border flex items-center gap-1.5 ${
                categoryId === cat.id
                  ? 'bg-black border-black text-white'
                  : 'bg-[#F7F7F7] border-[#EAEAEA] text-[#707070] hover:border-black/20'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. List / History Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#707070] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <span className="text-sm font-semibold">Loading transactions...</span>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center p-6 bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl max-w-md mx-auto text-center gap-3">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <h3 className="text-base font-bold text-[#111111]">Failed to load transactions</h3>
          <p className="text-xs text-[#707070]">{error?.message || 'Unexpected database error'}</p>
        </div>
      ) : sortedExpenses.length === 0 ? (
        /* Empty state */
        <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[#707070] mb-4">
            <FolderMinus className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[#111111]">No records found</h3>
          <p className="text-sm text-[#707070] max-w-sm mt-1 mb-6">
            We couldn&apos;t find any logged expenses matching those filter criteria for {getMonthName(monthStr)}.
          </p>
          <button
            onClick={handleAdd}
            className="px-5 py-2.5 bg-black hover:bg-black/90 transition-all rounded-lg font-semibold text-sm text-white shadow-sm active:scale-[0.98]"
          >
            Log New Expense
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden bg-white border border-[#EAEAEA] rounded-2xl shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#EAEAEA] bg-[#F7F7F7]">
                  <th className="text-left py-3 px-4 text-xs font-bold text-[#707070] uppercase tracking-wider">Category</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-[#707070] uppercase tracking-wider">Title</th>
                  <th
                    onClick={() => toggleSort('date')}
                    className="text-left py-3 px-4 text-xs font-bold text-[#707070] uppercase tracking-wider cursor-pointer hover:text-black transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-[#707070] uppercase tracking-wider">Note</th>
                  <th
                    onClick={() => toggleSort('amount')}
                    className="text-right py-3 px-4 text-xs font-bold text-[#707070] uppercase tracking-wider cursor-pointer hover:text-black transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Amount
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-bold text-[#707070] uppercase tracking-wider w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAEAEA]">
                {sortedExpenses.map((expense: any) => {
                  const colorSet = getCategoryColorClasses(expense.categoryColor);

                  return (
                    <tr
                      key={expense.id}
                      onClick={() => handleEdit(expense)}
                      className="hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                    >
                      {/* Category Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${colorSet.fill}`}>
                            <CategoryIcon name={expense.categoryIcon} size={13} />
                          </div>
                          <span className="font-bold text-[#111111]">{expense.categoryName}</span>
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-bold text-[#111111] max-w-[200px] truncate">
                        {expense.title}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-sm text-[#707070]">
                        {new Date(expense.date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Note */}
                      <td className="py-3.5 px-4 text-sm text-[#707070] max-w-[250px] truncate">
                        {expense.note || '-'}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-red-500">
                        -{formatAmount(expense.amount)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(expense);
                            }}
                            className="p-1.5 text-[#707070] hover:text-[#111111] rounded-lg hover:bg-[#F7F7F7] transition-all"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(expense.id, e)}
                            className="p-1.5 text-[#707070] hover:text-red-500 rounded-lg hover:bg-red-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="lg:hidden space-y-2">
            {sortedExpenses.map((expense: any) => (
              <ExpenseCard
                key={expense.id}
                title={expense.title}
                note={expense.note}
                amount={expense.amount}
                categoryId={expense.categoryId}
                date={new Date(expense.date)}
                onClick={() => handleEdit(expense)}
              />
            ))}
          </div>
        </>
      )}

      {/* 5. Floating Action Button (FAB) for mobile viewports */}
      <button
        onClick={handleAdd}
        className="fixed right-6 bottom-20 w-14 h-14 rounded-full bg-black hover:bg-black/90 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all z-40"
        aria-label="Add Expense"
      >
        <Plus className="h-6 w-6 text-white" />
      </button>

      {/* Modals Containers */}
      <ExpenseDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      <DeleteConfirmDialog
        isOpen={!!expenseToDeleteId}
        onClose={() => setExpenseToDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
}
