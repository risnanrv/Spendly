'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { expenseSchema, zodResolver, type ExpenseInput } from '@/utils/validation';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { getMonthStr, getMonthName } from '@/utils/date';
import { formatAmount, toStorageAmount } from '@/utils/currency';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ExpenseCard } from '@/components/ExpenseCard';
import { ExpenseDialog } from '@/components/expenses/ExpenseDialog';
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog';
import { SkeletonList, SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Calendar,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronUp,
} from 'lucide-react';

export default function ExpensesPage() {
  const { data: categories } = useCategories();
  const deleteMutation = useDeleteExpense();
  const createMutation = useCreateExpense();

  // Filters State
  const [monthStr, setMonthStr] = useState<string>(getMonthStr(new Date()));
  const [categoryId, setCategoryId] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Sort State
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Form State
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Modal State for EDITING
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<any | null>(null);
  const [expenseToDeleteId, setExpenseToDeleteId] = useState<string | null>(null);

  // Fetch expenses
  const { data: expensesList, isLoading, isError, error, refetch } = useExpenses({
    monthStr,
    categoryId: categoryId || undefined,
    search: search || undefined,
  });

  // Query ALL expenses for sorting categories by recency/frequency
  const { data: allExpenses } = useExpenses();

  // Calculate sorted categories: Most Used -> Recently Used -> Others
  const sortedCategories = useMemo(() => {
    if (!categories) return [];

    const counts: Record<string, number> = {};
    const recency: Record<string, number> = {};

    if (allExpenses && allExpenses.length > 0) {
      allExpenses.forEach((exp: any) => {
        const catId = exp.categoryId;
        counts[catId] = (counts[catId] || 0) + 1;
        const time = new Date(exp.date).getTime();
        if (!recency[catId] || time > recency[catId]) {
          recency[catId] = time;
        }
      });
    }

    return [...categories].sort((a: any, b: any) => {
      const countA = counts[a.id] || 0;
      const countB = counts[b.id] || 0;

      if (countA !== countB) return countB - countA;

      if (countA > 0) {
        const timeA = recency[a.id] || 0;
        const timeB = recency[b.id] || 0;
        if (timeA !== timeB) return timeB - timeA;
      }

      return a.name.localeCompare(b.name);
    });
  }, [categories, allExpenses]);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors: formErrors, isSubmitting: formSubmitting },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      categoryId: '',
      dateStr: new Date().toISOString().split('T')[0],
      note: '',
    },
  });

  const selectedCategoryId = watch('categoryId');

  // No default category — user must explicitly choose one

  // Auto-focus amount input on mount
  useEffect(() => {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, []);

  const onAddExpense = async (data: ExpenseInput) => {
    const amountCents = toStorageAmount(data.amount);
    try {
      await createMutation.mutateAsync({
        title: data.title || '',
        amount: amountCents,
        categoryId: data.categoryId,
        dateStr: data.dateStr,
        note: data.note || undefined,
      });

      // Reset form on success — no default category
      reset({
        title: '',
        amount: undefined,
        categoryId: '',
        dateStr: new Date().toISOString().split('T')[0],
        note: '',
      });
      setShowAdvanced(false);
      setCategorySearch('');
      if (amountInputRef.current) {
        amountInputRef.current.focus();
      }
    } catch {
      // Handled inside hook
    }
  };

  const handleEdit = (expense: any) => {
    setExpenseToEdit(expense);
    setIsEditOpen(true);
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

  // Filter categories shown in chips
  const filteredChipsCategories = useMemo(() => {
    return sortedCategories.filter(cat =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [sortedCategories, categorySearch]);

  // Client-side sort
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
    <div className="space-y-8 pb-12 select-none">


      {/* Log Expense Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6"
      >


        <form onSubmit={handleSubmit(onAddExpense)} className="space-y-6">
          {/* Amount input: HERO Element — ₹ and number center together as one unit */}
          <div className="flex flex-col items-center justify-center py-2 space-y-1">
            <div className="flex items-center justify-center font-black text-4xl md:text-5xl text-[#0A0A0A]">
              <span className="select-none">₹</span>
              <input
                type="number"
                step="any"
                placeholder="0"
                style={{
                  // Shrink/grow with content so ₹+number centers as one unit
                  width: `${Math.max(1, String(watch('amount') ?? '').replace(/[^0-9.]/g, '').length || 1)}ch`,
                  minWidth: '1ch',
                  maxWidth: '12ch',
                }}
                className="text-center focus:outline-none bg-transparent select-all"
                {...register('amount', { valueAsNumber: true })}
                ref={(e) => {
                  register('amount').ref(e);
                  // @ts-ignore
                  amountInputRef.current = e;
                }}
                disabled={formSubmitting}
              />
            </div>
            {formErrors.amount && (
              <p className="text-[10px] text-red-500 font-semibold">{formErrors.amount.message}</p>
            )}
          </div>

          {/* Categories Selector Horizontal Scroll Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
                Category
              </label>

              {/* Mini category search */}
              {sortedCategories.length > 5 && (
                <div className="relative w-36 hidden sm:block">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#6B6B6B]" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full pl-6 pr-2 py-1 bg-[#F5F5F5] border border-[#E8E8E8] rounded-lg text-[10px] focus:outline-none focus:border-[#0A0A0A]"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
              {filteredChipsCategories.map((cat: any) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setValue('categoryId', cat.id, { shouldValidate: true })}
                    disabled={formSubmitting}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border transition-all flex items-center gap-1.5 ${isSelected
                      ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                      : 'bg-[#F5F5F5] border-[#E8E8E8] text-[#6B6B6B] hover:border-[#A8A8A8] hover:text-[#0A0A0A]'
                      }`}
                  >
                    <CategoryIcon name={cat.icon} size={12} />
                    <span>{cat.name}</span>
                  </button>
                );
              })}
              {filteredChipsCategories.length === 0 && (
                <span className="text-[10px] text-[#6B6B6B] italic py-1">No categories match</span>
              )}
            </div>
            {formErrors.categoryId && (
              <p className="text-[10px] text-red-500 font-semibold">{formErrors.categoryId.message}</p>
            )}
          </div>

          {/* Form Title & Advanced Accordion Toggle */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="What did you spend on?"
                  className="w-full px-4 py-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all"
                  {...register('title')}
                  disabled={formSubmitting}
                />
                {formErrors.title && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1">{formErrors.title.message}</p>
                )}
              </div>

              {/* Show more/less toggle button */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="p-3 bg-[#F5F5F5] hover:bg-[#E8E8E8] text-[#6B6B6B] rounded-xl transition-all"
                title="Advanced Options"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
              </button>
            </div>

            {/* Collapsible notes/date selector */}
            <AnimatePresence initial={false}>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Date */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-wider">Date</label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all"
                        {...register('dateStr')}
                        disabled={formSubmitting}
                      />
                    </div>

                    {/* Note */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-wider">Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="Add details..."
                        className="w-full px-4 py-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all"
                        {...register('note')}
                        disabled={formSubmitting}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end pt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={formSubmitting}
              className="w-full py-3.5 bg-[#0A0A0A] hover:bg-[#1C1C1C] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {formSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Logging record...
                </span>
              ) : (
                'Log Expense'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Divider */}
      <div className="border-t border-[#E8E8E8] my-6" />



      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Month Selector */}
        <div className="relative min-w-[160px] w-full sm:w-auto">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
          <select
            value={monthStr}
            onChange={(e) => setMonthStr(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] appearance-none cursor-pointer"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B] pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] placeholder-neutral-400 focus:outline-none focus:border-[#0A0A0A]"
          />
        </div>
      </div>

      {/* Category Chips scroll list for History filter */}
      <div className="space-y-1">
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-2 px-2 scrollbar-thin">
          <button
            onClick={() => setCategoryId('')}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shrink-0 border ${categoryId === ''
              ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
              : 'bg-white border-[#E8E8E8] text-[#6B6B6B] hover:border-[#A8A8A8] hover:text-[#0A0A0A]'
              }`}
          >
            All Categories
          </button>

          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all shrink-0 border flex items-center gap-1 ${categoryId === cat.id
                ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                : 'bg-white border-[#E8E8E8] text-[#6B6B6B] hover:border-[#A8A8A8] hover:text-[#0A0A0A]'
                }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      {isLoading ? (
        <SkeletonList count={4} type="list-item" />
      ) : isError ? (
        <ErrorState onRetry={refetch} message={error?.message} />
      ) : sortedExpenses.length === 0 ? (
        <EmptyState
          illustration="expenses"
          title="No logged records"
          description={`We couldn't find any transactions logged for ${getMonthName(monthStr)} matching your filters.`}
          actionLabel="Log New Entry"
          onAction={() => {
            if (amountInputRef.current) {
              amountInputRef.current.focus();
            }
          }}
        />
      ) : (
        <motion.div
          variants={{
            show: {
              transition: {
                staggerChildren: 0.04,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-2.5"
        >
          {sortedExpenses.map((expense: any) => (
            <motion.div
              key={expense.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <ExpenseCard
                title={expense.title}
                note={expense.note}
                amount={expense.amount}
                categoryId={expense.categoryId}
                date={new Date(expense.date)}
                onClick={() => handleEdit(expense)}
                onEdit={() => handleEdit(expense)}
                onDelete={() => handleDeleteClick(expense.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Edit Dialog Modal Container */}
      <ExpenseDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={!!expenseToDeleteId}
        onClose={() => setExpenseToDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        isSubmitting={deleteMutation.isPending}
      />
    </div>
  );
}
