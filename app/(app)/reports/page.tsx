'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useReports, type ReportsFilter } from '@/hooks/useReports';
import { useCategories } from '@/hooks/useCategories';
import { formatAmount } from '@/utils/currency';
import { getMonthStr, getMonthName } from '@/utils/date';
import { getCategoryColorClasses } from '@/utils/colors';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SkeletonCard, SkeletonList } from '@/components/ui/SkeletonCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronDown,
  Sparkles,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  Printer,
  Download,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { auth } from '@/firebase/config';
import { exportService } from '@/lib/services';
import { useToastStore } from '@/stores/toast.store';

export default function ReportsPage() {
  const { addToast } = useToastStore();
  
  // Filter state
  const [preset, setPreset] = useState<ReportsFilter['preset']>('thisMonth');
  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(getMonthStr(new Date()));

  // Active query filters
  const reportsFilter = useMemo<ReportsFilter>(() => {
    return {
      preset,
      monthStr: preset === 'thisMonth' ? selectedMonthStr : undefined,
    };
  }, [preset, selectedMonthStr]);

  // Hook queries
  const { data: reportData, isLoading, isError, error, refetch } = useReports(reportsFilter);
  const { data: categories } = useCategories();

  // Month navigation range
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

  // Format HTML Statement report download
  const handleExportHTML = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const targetPeriod = preset === 'thisMonth' ? selectedMonthStr : 'lifetime';
      const htmlData = await exportService.exportHTML(userId, targetPeriod);
      const blob = new Blob([htmlData], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Spendly_Report_${targetPeriod}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Printable statement generated successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to print statement', 'danger');
    }
  };

  const handleExportCSV = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const targetPeriod = preset === 'thisMonth' ? selectedMonthStr : 'lifetime';
      const csvData = await exportService.exportCSV(userId, targetPeriod);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Spendly_Export_${targetPeriod}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('CSV spreadsheet downloaded successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to export CSV', 'danger');
    }
  };

  // Convert categories allocation total cents list
  const categoryAllocations = useMemo(() => {
    return reportData?.report?.categoryBreakdown || [];
  }, [reportData]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 select-none">
        <div className="flex gap-2 justify-start items-center">
          <div className="h-6 w-36 rounded animate-shimmer" />
        </div>
        <SkeletonCard type="card" className="h-40 w-full" />
        <SkeletonList count={3} type="list-item" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} message={error?.message} />;
  }

  const summary = reportData?.report?.summary;
  const insights = reportData?.insights?.insights || [];
  const comparison = reportData?.monthComparison;

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 -ml-2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-all" title="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#0A0A0A]">
            Analytics Reports
          </h1>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Deeper financial metrics and automated statement generation.
          </p>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-2 px-2 scrollbar-none">
          {([
            { value: 'thisMonth', label: 'Month' },
            { value: 'last7days', label: 'Last 7 Days' },
            { value: 'thisYear', label: 'Year' },
            { value: 'lifetime', label: 'All Time' },
          ] as const).map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 ${
                preset === p.value
                  ? 'bg-[#0A0A0A] border-[#0A0A0A] text-white'
                  : 'bg-white border-[#E8E8E8] text-[#6B6B6B] hover:border-[#A8A8A8] hover:text-[#0A0A0A]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Dynamic Month Selector */}
        {preset === 'thisMonth' && (
          <div className="relative min-w-[150px] w-full sm:w-auto">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
            <select
              value={selectedMonthStr}
              onChange={(e) => setSelectedMonthStr(e.target.value)}
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
        )}
      </div>

      {/* Main Metric Banner */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
                Total Expenses
              </span>
              <h2 className="text-3xl font-black text-[#0A0A0A] tracking-tight">
                ₹{formatAmount(summary.totalExpense)}
              </h2>
            </div>
            
            {/* Range comparison status badge */}
            {comparison && (
              <div
                className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  comparison.isIncrease
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                }`}
              >
                {comparison.isIncrease ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {comparison.percentageChange}% {comparison.isIncrease ? 'more' : 'less'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t border-[#E8E8E8] text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#6B6B6B] block">Transactions Count</span>
              <span className="font-semibold text-[#0A0A0A]">{summary.transactionCount}</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#6B6B6B] block">Daily Average</span>
              <span className="font-semibold text-[#0A0A0A]">₹{formatAmount(summary.averageDailySpending)}</span>
            </div>
            <div className="space-y-0.5 col-span-2 md:col-span-1">
              <span className="text-[10px] text-[#6B6B6B] block">Highest Transaction</span>
              <span className="font-semibold text-[#0A0A0A]">
                {summary.largestExpense ? `₹${formatAmount(summary.largestExpense)}` : '—'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Automated AI Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
            System Insights
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insights.map((insight: any, i: number) => {
              const isDanger = insight.type === 'danger';
              const isWarning = insight.type === 'warning';
              const isSuccess = insight.type === 'success';

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i}
                  className="bg-white border border-[#E8E8E8] rounded-2xl p-4 flex items-start gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                >
                  <div className={`p-2 rounded-xl shrink-0 ${
                    isDanger 
                      ? 'bg-red-50 text-red-500' 
                      : isWarning 
                      ? 'bg-amber-50 text-amber-500' 
                      : isSuccess 
                      ? 'bg-emerald-50 text-emerald-500' 
                      : 'bg-[#F5F5F5] text-[#0A0A0A]'
                  }`}>
                    {isDanger || isWarning ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#0A0A0A] block">
                      {insight.title}
                    </span>
                    <p className="text-[10px] text-[#6B6B6B] leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category allocations progress detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Category Allocations list */}
        <div className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block mb-4">
              Category Distributions
            </span>
            {categoryAllocations.length === 0 ? (
              <p className="text-xs text-[#6B6B6B] py-6 text-center italic">No categorised breakdowns</p>
            ) : (
              <div className="space-y-4">
                {categoryAllocations.slice(0, 6).map((alloc) => {
                  const colorSet = getCategoryColorClasses(alloc.color);
                  return (
                    <div key={alloc.categoryId} className="space-y-1.5 text-xs">
                      <div className="flex justify-between items-center font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 ${colorSet.fill}`}>
                            <CategoryIcon name={alloc.icon} size={11} />
                          </div>
                          <span className="text-[#0A0A0A] font-semibold">{alloc.name}</span>
                        </div>
                        <span className="text-[#0A0A0A] font-bold">₹{formatAmount(alloc.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F5F5F5] rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${alloc.percentage}%` }}
                            transition={{ duration: 0.5 }}
                            className={`h-full rounded-full ${colorSet.fill}`}
                          />
                        </div>
                        <span className="text-[9px] text-[#6B6B6B] font-bold shrink-0">{alloc.percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: PDF / statements exports */}
        <div className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
              Statement Exports
            </span>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">
              Generate structured records for your taxes, backups, or external accounting spreadsheet software.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 py-3 bg-[#F5F5F5] border border-[#E8E8E8] hover:bg-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] transition-all"
            >
              <Download className="h-4 w-4" />
              Spreadsheet CSV
            </button>
            <button
              onClick={handleExportHTML}
              className="flex items-center justify-center gap-2 py-3 bg-[#F5F5F5] border border-[#E8E8E8] hover:bg-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] transition-all"
            >
              <Printer className="h-4 w-4" />
              Print HTML Statement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
