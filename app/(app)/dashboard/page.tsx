'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useReports } from '@/hooks/useReports';
import { useBudgetDetails } from '@/hooks/useBudgets';
import { authClient } from '@/lib/auth-client';
import { getTodayDateStr, getMonthStr, getMonthName } from '@/utils/date';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { BudgetPreview } from '@/components/dashboard/BudgetPreview';
import { TopCategoriesList } from '@/components/dashboard/TopCategoriesList';
import { Loader2, AlertTriangle, Calendar, ChevronDown } from 'lucide-react';
import type { ReportsFilter } from '@/actions/reports';
import dynamic from 'next/dynamic';

// Load charts dynamically to prevent canvas SSR failures in Next.js
const ReportCharts = dynamic(
  () => import('@/components/charts/ReportCharts').then((mod) => mod.ReportCharts),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  // 1. Presets and Month States
  const [preset, setPreset] = useState<'today' | 'last7days' | 'thisMonth' | 'thisYear' | 'lifetime'>('thisMonth');
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthStr(new Date()));

  // 2. Build Reports Filter Hook Argument — pass monthStr so the server action uses it
  const filter = useMemo<ReportsFilter>(() => {
    if (preset === 'thisMonth') {
      return { preset: 'thisMonth', monthStr: selectedMonth };
    }
    return { preset };
  }, [preset, selectedMonth]);

  // 3. Query Hook calls
  const { data: reportData, isLoading: isReportLoading, isError: isReportError, error: reportError, refetch } = useReports(filter);
  // Always fetch budget data for the selected month regardless of active preset
  const { data: budgetData, isLoading: isBudgetLoading } = useBudgetDetails(selectedMonth);

  const todayDateStr = useMemo(() => getTodayDateStr(), []);

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

  const remainingDays = useMemo(() => {
    const today = new Date();
    const [year, month] = selectedMonth.split('-').map(Number);
    const isCurrentMonth = today.getFullYear() === year && (today.getMonth() + 1) === month;
    if (!isCurrentMonth) {
      const isFuture = new Date(year, month - 1, 1) > today;
      return isFuture ? new Date(year, month, 0).getDate() : 0;
    }
    const totalDays = new Date(year, month, 0).getDate();
    return Math.max(0, totalDays - today.getDate());
  }, [selectedMonth]);

  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'last7days', label: 'Week' },
    { id: 'thisMonth', label: 'Month' },
    { id: 'thisYear', label: 'Year' },
    { id: 'lifetime', label: 'Lifetime' },
  ] as const;

  const isLoading = isReportLoading || isBudgetLoading;
  const isError = isReportError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#707070] gap-3 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="text-sm font-semibold">Loading dashboard metrics...</span>
      </div>
    );
  }

  if (isError || !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl max-w-md mx-auto text-center select-none">
        <AlertTriangle className="h-12 w-12 text-red-500 animate-bounce" />
        <h2 className="text-lg font-bold text-[#111111]">Failed to load dashboard</h2>
        <p className="text-sm text-[#707070]">
          {reportError?.message || 'Check database connection. The database may be temporarily unavailable.'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-5 py-2.5 bg-black hover:bg-black/90 transition-all rounded-lg font-semibold text-sm text-white active:scale-[0.98]"
        >
          Retry Reload
        </button>
      </div>
    );
  }

  const { report } = reportData;
  const { categoryBreakdown, topCategories, dailyTrend } = report;
  const hasExpenses = report.summary.transactionCount > 0;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* 1. Clean Dashboard Header */}
      <GreetingHeader
        todayDateStr={todayDateStr}
        greeting=""
        userName={session?.user?.name || ''}
      />

      {/* 2. Filter Chips + Month Selector Panel */}
      <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                preset === p.id
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-[#EAEAEA] text-[#707070] hover:border-black/20'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Month Selector — shown only for Month preset */}
        {preset === 'thisMonth' && (
          <div className="relative w-full sm:w-auto min-w-[160px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-black transition-colors appearance-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-black">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070] pointer-events-none" />
          </div>
        )}
      </div>

      {/* 3. Budget Preview — always shown when budget data is available */}
      {budgetData && (
        <BudgetPreview
          hasBudget={budgetData.budget > 0}
          budgetAmount={budgetData.budget}
          spent={budgetData.spent}
          remaining={budgetData.remaining}
          progress={budgetData.percentage / 100}
          status={budgetData.status}
          remainingDays={remainingDays}
          monthName={getMonthName(selectedMonth)}
        />
      )}

      {/* 4. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: KPI Summary + Charts */}
        <div className="lg:col-span-2 space-y-6">
          {hasExpenses ? (
            <>
              {/* Summary KPIs */}
              <SummaryCard
                totalSpent={report.summary.totalExpense}
                averageDailySpend={report.summary.averageDailySpending}
                expenseCount={report.summary.transactionCount}
                highestExpenseAmount={report.summary.largestExpense}
                largestCategoryName={report.categoryBreakdown[0]?.name || 'None'}
              />

              {/* Analytics Charts */}
              <ReportCharts
                categoryBreakdown={categoryBreakdown}
                dailyTrend={dailyTrend}
              />
            </>
          ) : (
            /* Empty Data State */
            <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#EAEAEA] flex items-center justify-center text-[#707070] mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-[#111111]">No transactions logged</h3>
              <p className="text-sm text-[#707070] max-w-sm mt-1 mb-6">
                You haven&apos;t logged any spending records during this period.
              </p>
              <button
                onClick={() => router.push('/expenses')}
                className="px-5 py-2.5 bg-black hover:bg-black/90 transition-all rounded-lg font-semibold text-sm text-white shadow-sm active:scale-[0.98]"
              >
                Log First Expense
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Top Categories */}
        <div className="space-y-6">
          {hasExpenses && (
            <TopCategoriesList topCategories={topCategories} />
          )}
        </div>
      </div>
    </div>
  );
}
