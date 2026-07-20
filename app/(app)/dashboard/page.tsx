'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useBudgetDetails } from '@/hooks/useBudgets';
import { formatAmount } from '@/utils/currency';
import { getMonthStr, getMonthName } from '@/utils/date';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ReportCharts } from '@/components/charts/ReportCharts';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ExpenseCard } from '@/components/ExpenseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, TrendingUp, Sparkles, PiggyBank, ArrowUpRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth(); // 0-11
  
  // States for main filter
  const [preset, setPreset] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('today');
  
  // Sub-filter states
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const day = new Date().getDate();
    return Math.min(4, Math.ceil(day / 7));
  });
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Hook queries
  const { data: allExpenses, isLoading: isExpensesLoading, isError: isExpensesError, error: expensesError, refetch } = useExpenses();
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();

  // Get budget details for the currently active/selected month (YYYY-MM)
  const activeMonthStr = useMemo(() => {
    const year = preset === 'year' ? selectedYear : new Date().getFullYear();
    const month = preset === 'month' 
      ? String(selectedMonthIdx + 1).padStart(2, '0') 
      : String(currentMonthIdx + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [preset, selectedMonthIdx, selectedYear, currentMonthIdx]);

  const { data: budgetData, isLoading: isBudgetLoading } = useBudgetDetails(activeMonthStr);

  // Years option range
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<number>([currentYear, currentYear - 1, currentYear - 2]);
    if (allExpenses) {
      allExpenses.forEach((exp: any) => {
        const y = new Date(exp.date).getFullYear();
        if (y > 2000) yearsSet.add(y);
      });
    }
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [allExpenses, currentYear]);

  // Client-side filtering logic
  const filteredExpenses = useMemo(() => {
    if (!allExpenses) return [];

    const now = new Date();
    return allExpenses.filter((exp: any) => {
      const expDate = new Date(exp.date);
      const expYear = expDate.getFullYear();
      const expMonth = expDate.getMonth(); // 0-11
      const expDay = expDate.getDate();

      if (preset === 'today') {
        return (
          expYear === now.getFullYear() &&
          expMonth === now.getMonth() &&
          expDay === now.getDate()
        );
      }

      if (preset === 'week') {
        const isCurrentMonth = expYear === now.getFullYear() && expMonth === now.getMonth();
        if (!isCurrentMonth) return false;

        const week = Math.min(4, Math.ceil(expDay / 7));
        return week === selectedWeek;
      }

      if (preset === 'month') {
        return expYear === now.getFullYear() && expMonth === selectedMonthIdx;
      }

      if (preset === 'year') {
        return expYear === selectedYear;
      }

      if (preset === 'all') {
        return true;
      }

      return false;
    });
  }, [allExpenses, preset, selectedWeek, selectedMonthIdx, selectedYear]);

  // Calculations for KPI details
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  }, [filteredExpenses]);

  // Categories allocation calculations
  const categoryBreakdown = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    const totals: Record<string, number> = {};
    filteredExpenses.forEach((exp: any) => {
      totals[exp.categoryId] = (totals[exp.categoryId] || 0) + exp.amount;
    });

    return categories
      .map((cat: any) => ({
        categoryId: cat.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        amount: totals[cat.id] || 0,
        percentage: totalSpent > 0 ? Math.round(((totals[cat.id] || 0) / totalSpent) * 100) : 0,
        progress: totalSpent > 0 ? (totals[cat.id] || 0) / totalSpent : 0,
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [categories, filteredExpenses, totalSpent]);

  // Daily Trend calculation
  const dailyTrend = useMemo(() => {
    const trendMap = new Map<string, number>();

    if (preset === 'today') {
      const label = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
      return [{ label, amount: totalSpent }];
    }

    if (preset === 'week') {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startDay = (selectedWeek - 1) * 7 + 1;
      const endDay = selectedWeek === 4 
        ? new Date(year, month + 1, 0).getDate() 
        : selectedWeek * 7;

      for (let d = startDay; d <= endDay; d++) {
        trendMap.set(String(d), 0);
      }

      filteredExpenses.forEach((exp: any) => {
        const day = new Date(exp.date).getDate();
        const label = String(day);
        if (trendMap.has(label)) {
          trendMap.set(label, (trendMap.get(label) || 0) + exp.amount);
        }
      });
    } else if (preset === 'month') {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), selectedMonthIdx + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        trendMap.set(String(d), 0);
      }

      filteredExpenses.forEach((exp: any) => {
        const day = new Date(exp.date).getDate();
        const label = String(day);
        trendMap.set(label, (trendMap.get(label) || 0) + exp.amount);
      });
    } else if (preset === 'year') {
      MONTH_NAMES.forEach((m) => {
        trendMap.set(m.slice(0, 3), 0);
      });

      filteredExpenses.forEach((exp: any) => {
        const mIdx = new Date(exp.date).getMonth();
        const label = MONTH_NAMES[mIdx].slice(0, 3);
        trendMap.set(label, (trendMap.get(label) || 0) + exp.amount);
      });
    } else {
      filteredExpenses.forEach((exp: any) => {
        const label = String(new Date(exp.date).getFullYear());
        trendMap.set(label, (trendMap.get(label) || 0) + exp.amount);
      });
    }

    return Array.from(trendMap.entries()).map(([label, amount]) => ({
      label,
      amount,
    }));
  }, [filteredExpenses, preset, selectedWeek, selectedMonthIdx, totalSpent]);

  // Loading UI indicator
  const isLoading = isExpensesLoading || isCategoriesLoading || isBudgetLoading;

  // Recent transactions list
  const recentTransactions = useMemo(() => {
    if (!filteredExpenses) return [];
    return [...filteredExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredExpenses]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 select-none">
        <div className="flex gap-2 justify-start items-center">
          <div className="h-6 w-36 rounded animate-shimmer" />
        </div>
        <SkeletonCard type="card" className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard type="insight" />
          <SkeletonCard type="insight" />
        </div>
        <SkeletonCard type="chart" />
      </div>
    );
  }

  if (isExpensesError) {
    return <ErrorState onRetry={refetch} message={expensesError?.message} />;
  }

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Filters Panel Card */}
      <div className="flex flex-col gap-3">
        {/* Main Preset Chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                preset === p
                  ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                  : 'bg-white border-[#E8E8E8] text-[#6B6B6B] hover:border-[#A8A8A8] hover:text-[#0A0A0A]'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Dynamic sub-filters */}
        <AnimatePresence mode="wait">
          {preset === 'week' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative min-w-[150px] w-full sm:w-auto"
            >
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] appearance-none cursor-pointer"
              >
                <option value={1}>Week 1 (Days 1-7)</option>
                <option value={2}>Week 2 (Days 8-14)</option>
                <option value={3}>Week 3 (Days 15-21)</option>
                <option value={4}>Week 4 (Days 22+)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B] pointer-events-none" />
            </motion.div>
          )}

          {preset === 'month' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative min-w-[150px] w-full sm:w-auto"
            >
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
              <select
                value={selectedMonthIdx}
                onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] appearance-none cursor-pointer"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B] pointer-events-none" />
            </motion.div>
          )}

          {preset === 'year' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative min-w-[120px] w-full sm:w-auto"
            >
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] appearance-none cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B] pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hero Spent display Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0A0A0A] text-white rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.12)] relative overflow-hidden"
      >
        <div className="absolute right-4 top-4 opacity-5">
          <TrendingUp className="w-36 h-36" />
        </div>
        
        <div>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Total Spent
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mt-3 tracking-tight select-all">
            ₹{formatAmount(totalSpent)}
          </h2>
        </div>
        
        <div className="mt-6 flex justify-between items-center text-[10px] text-neutral-400 font-medium">
          <span>Logged across {filteredExpenses.length} entries</span>
          {preset !== 'all' && (
            <span className="uppercase text-[9px] px-2 py-0.5 rounded-full border border-neutral-800 bg-neutral-900 text-white font-semibold">
              {preset}
            </span>
          )}
        </div>
      </motion.div>

      {/* 2-Column insights row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget remaining detail */}
        {budgetData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                  Budget Target
                </span>
                <span className="text-lg font-bold text-[#0A0A0A] block">
                  {budgetData.budget > 0 ? `₹${formatAmount(budgetData.budget)}` : 'No Limit Set'}
                </span>
              </div>
              {budgetData.budget > 0 && (
                <span
                  className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    budgetData.status === 'exceeded'
                      ? 'text-red-600 bg-red-50 border-red-200'
                      : budgetData.status === 'approaching'
                      ? 'text-amber-600 bg-amber-50 border-amber-200'
                      : 'text-[#0A0A0A] bg-[#F5F5F5] border-[#E8E8E8]'
                  }`}
                >
                  {budgetData.status}
                </span>
              )}
            </div>

            {budgetData.budget > 0 ? (
              <div className="space-y-2">
                <div className="w-full h-2 bg-[#F5F5F5] border border-[#E8E8E8] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, budgetData.percentage)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      budgetData.status === 'exceeded'
                        ? 'bg-red-500'
                        : budgetData.status === 'approaching'
                        ? 'bg-amber-500'
                        : 'bg-[#0A0A0A]'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-[#6B6B6B]">
                  <span>Spent: ₹{formatAmount(budgetData.spent)}</span>
                  <span>Left: ₹{formatAmount(budgetData.remaining)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center text-[10px] text-[#6B6B6B] pt-2">
                <span>Configure target budgets inside Settings.</span>
                <Link
                  href="/settings/budgets"
                  className="text-[#0A0A0A] hover:underline flex items-center gap-0.5 font-bold"
                >
                  Configure
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Detailed reports analytics link */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between"
        >
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Analytics Reports
            </span>
            <p className="text-xs text-[#6B6B6B] leading-relaxed pt-1">
              Explore your detailed spending structures, trends, and download monthly statements.
            </p>
          </div>

          <div className="pt-4 flex justify-end">
            <Link
              href="/reports"
              className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1C1C1C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              View Detailed Analytics
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Spend Charts: Line + Donut Ring */}
      {filteredExpenses.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <ReportCharts
            categoryBreakdown={categoryBreakdown}
            dailyTrend={dailyTrend}
          />
        </motion.div>
      ) : (
        <div className="bg-white border border-[#E8E8E8] rounded-3xl p-8 text-center text-[#6B6B6B] text-xs font-medium">
          No records logged in this period to display visual metrics.
        </div>
      )}

      {/* Top Categories Details List */}
      {categoryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
        >
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            Top Categories
          </span>
          <div className="divide-y divide-[#E8E8E8] text-xs">
            {categoryBreakdown.map((cat) => {
              const colorSet = getCategoryColorClasses(cat.color);

              return (
                <div key={cat.categoryId} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${colorSet.fill}`}>
                      <CategoryIcon name={cat.icon} size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-[#0A0A0A] truncate">
                          {cat.name}
                        </span>
                        <span className="text-[#6B6B6B] font-bold shrink-0 ml-2">
                          ₹{formatAmount(cat.amount)}
                        </span>
                      </div>
                      
                      {/* Horizontal progress visualization */}
                      <div className="w-full h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${colorSet.fill}`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <span className="font-bold text-[#0A0A0A] shrink-0 text-[10px]">
                    {cat.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Recent Transactions section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider">
            Recent Transactions
          </span>
          {filteredExpenses.length > 5 && (
            <Link href="/expenses" className="text-[10px] font-bold text-[#0A0A0A] hover:underline flex items-center gap-0.5">
              View All
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            illustration="expenses"
            title="Start tracking expenses"
            description="Log your daily transactions to see them visualised on this screen."
            actionLabel="Add Transaction"
            onAction={() => window.location.href = '/expenses'}
          />
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {recentTransactions.map((expense) => (
              <ExpenseCard
                key={expense.id}
                title={expense.title}
                note={expense.note}
                amount={expense.amount}
                categoryId={expense.categoryId}
                date={new Date(expense.date)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
