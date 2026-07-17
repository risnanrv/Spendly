'use client';

import React, { useState, useMemo } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
import { useBudgetDetails } from '@/hooks/useBudgets';
import { formatAmount } from '@/utils/currency';
import { getMonthStr, getMonthName } from '@/utils/date';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { ReportCharts } from '@/components/charts/ReportCharts';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Loader2 } from 'lucide-react';

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
  const { data: allExpenses, isLoading: isExpensesLoading } = useExpenses();
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
        // Filter by selected week of the current month
        const isCurrentMonth = expYear === now.getFullYear() && expMonth === now.getMonth();
        if (!isCurrentMonth) return false;

        const week = Math.min(4, Math.ceil(expDay / 7));
        return week === selectedWeek;
      }

      if (preset === 'month') {
        // Filter by selected month in the current year
        return expYear === now.getFullYear() && expMonth === selectedMonthIdx;
      }

      if (preset === 'year') {
        // Filter by selected year
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

  // Daily Trend calculation for lines chart
  const dailyTrend = useMemo(() => {
    const trendMap = new Map<string, number>();

    if (preset === 'today') {
      const label = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
      return [{ label, amount: totalSpent }];
    }

    if (preset === 'week') {
      // Pre-populate days of selected week
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const startDay = (selectedWeek - 1) * 7 + 1;
      const endDay = selectedWeek === 4 
        ? new Date(year, month + 1, 0).getDate() 
        : selectedWeek * 7;

      for (let d = startDay; d <= endDay; d++) {
        const label = String(d);
        trendMap.set(label, 0);
      }

      filteredExpenses.forEach((exp: any) => {
        const day = new Date(exp.date).getDate();
        const label = String(day);
        if (trendMap.has(label)) {
          trendMap.set(label, (trendMap.get(label) || 0) + exp.amount);
        }
      });
    } else if (preset === 'month') {
      // Pre-populate days of the selected month
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
      // Pre-populate 12 months
      MONTH_NAMES.forEach((m) => {
        trendMap.set(m.slice(0, 3), 0);
      });

      filteredExpenses.forEach((exp: any) => {
        const mIdx = new Date(exp.date).getMonth();
        const label = MONTH_NAMES[mIdx].slice(0, 3);
        trendMap.set(label, (trendMap.get(label) || 0) + exp.amount);
      });
    } else {
      // All - group by year
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#707070] gap-3 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="text-sm font-semibold">Loading financial metrics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Filters Panel Card */}
      <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Main Preset Chips */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {(['today', 'week', 'month', 'year', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                preset === p
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-[#EAEAEA] text-[#707070] hover:border-black/20'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Dynamic sub-filters */}
        {preset === 'week' && (
          <div className="relative w-full md:w-auto min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
            >
              <option value={1}>Week 1 (Days 1-7)</option>
              <option value={2}>Week 2 (Days 8-14)</option>
              <option value={3}>Week 3 (Days 15-21)</option>
              <option value={4}>Week 4 (Days 22+)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
          </div>
        )}

        {preset === 'month' && (
          <div className="relative w-full md:w-auto min-w-[150px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
            <select
              value={selectedMonthIdx}
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
          </div>
        )}

        {preset === 'year' && (
          <div className="relative w-full md:w-auto min-w-[120px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
          </div>
        )}
      </div>

      {/* ── 1. Total Expense Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm"
      >
        <span className="text-xs font-semibold text-[#707070] uppercase tracking-wider">
          Total Expense
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-[#111111] mt-2 tracking-tight">
          ₹{formatAmount(totalSpent)}
        </h2>
        <p className="text-[10px] text-[#707070] mt-1.5 font-medium">
          Logged across {filteredExpenses.length} transactions in this period.
        </p>
      </motion.div>

      {/* ── 2. Monthly Budget Card ── */}
      {budgetData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-semibold text-[#707070] uppercase tracking-wider">
                Monthly Budget ({getMonthName(activeMonthStr)})
              </span>
              <h3 className="text-lg font-bold text-[#111111] mt-1">
                {budgetData.budget > 0 ? `₹${formatAmount(budgetData.budget)}` : 'No Budget set'}
              </h3>
            </div>
            {budgetData.budget > 0 && (
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                  budgetData.status === 'exceeded'
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : budgetData.status === 'approaching'
                    ? 'text-amber-600 bg-amber-50 border-amber-200'
                    : 'text-[#111111] bg-[#F7F7F7] border-[#EAEAEA]'
                }`}
              >
                {budgetData.status}
              </span>
            )}
          </div>

          {budgetData.budget > 0 ? (
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetData.status === 'exceeded'
                      ? 'bg-red-500'
                      : budgetData.status === 'approaching'
                      ? 'bg-amber-500'
                      : 'bg-black'
                  }`}
                  style={{ width: `${Math.min(100, budgetData.percentage)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-semibold text-[#707070]">
                <span>Spent: ₹{formatAmount(budgetData.spent)}</span>
                <span>Remaining: ₹{formatAmount(budgetData.remaining)}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#707070]">
              To configure a target, visit Settings &gt; Budgets page.
            </p>
          )}
        </motion.div>
      )}

      {/* ── 3. Category Allocation & 4. Spending Trend Charts ── */}
      {filteredExpenses.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ReportCharts
            categoryBreakdown={categoryBreakdown}
            dailyTrend={dailyTrend}
          />
        </motion.div>
      ) : (
        <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-10 text-center text-[#707070] text-sm font-semibold">
          No transaction history in this range to draw charts.
        </div>
      )}

      {/* ── 5. Top Categories List ── */}
      {categoryBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm space-y-4"
        >
          <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
            Top Categories
          </h3>
          <div className="divide-y divide-[#EAEAEA]">
            {categoryBreakdown.map((cat) => {
              const colorSet = getCategoryColorClasses(cat.color);

              return (
                <div key={cat.categoryId} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${colorSet.fill}`}>
                      <CategoryIcon name={cat.icon} size={13} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#111111] leading-tight">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-[#707070] mt-0.5">
                        {cat.percentage}% of total allocations
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#111111]">
                    ₹{formatAmount(cat.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
