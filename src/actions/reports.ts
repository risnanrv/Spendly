'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { reportService, analyticsService, budgetRepo } from '@/lib/services';
import { getMonthStr } from '@/utils/date';
import { logger } from '@/utils/logger';

async function verifySession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export interface ReportsFilter {
  preset: 'today' | 'last7days' | 'thisMonth' | 'thisYear' | 'lifetime' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export async function getReportsAction(filter: ReportsFilter) {
  try {
    const session = await verifySession();
    const userId = session.user.id;

    const now = new Date();
    let startDateObj = new Date();
    let endDateObj = new Date();
    let prevStartDateObj = new Date();
    let prevEndDateObj = new Date();
    let isMonthComparison = false;
    const currentMonthStr = getMonthStr(now);
    let prevMonthStr = '';

    // 1. Resolve date boundaries based on filters
    if (filter.preset === 'today') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Previous Day
      const prev = new Date(now);
      prev.setDate(prev.getDate() - 1);
      prevStartDateObj = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 0, 0, 0, 0);
      prevEndDateObj = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), 23, 59, 59, 999);
    } else if (filter.preset === 'last7days') {
      startDateObj = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      startDateObj.setHours(0, 0, 0, 0);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      // Previous 7 Days
      prevStartDateObj = new Date(startDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevEndDateObj = new Date(startDateObj.getTime() - 1);
    } else if (filter.preset === 'thisMonth') {
      isMonthComparison = true;
      const [year, month] = currentMonthStr.split('-').map(Number);
      startDateObj = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDateObj = new Date(year, month, 0, 23, 59, 59, 999);

      const prev = new Date(year, month - 2, 1);
      prevMonthStr = getMonthStr(prev);
    } else if (filter.preset === 'thisYear') {
      startDateObj = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDateObj = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      // Previous Year
      prevStartDateObj = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEndDateObj = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else if (filter.preset === 'lifetime') {
      startDateObj = new Date(2000, 0, 1, 0, 0, 0, 0);
      endDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      prevStartDateObj = new Date(1990, 0, 1, 0, 0, 0, 0);
      prevEndDateObj = new Date(1999, 11, 31, 23, 59, 59, 999);
    } else if (filter.preset === 'custom' && filter.startDate && filter.endDate) {
      startDateObj = new Date(filter.startDate);
      startDateObj.setHours(0, 0, 0, 0);
      endDateObj = new Date(filter.endDate);
      endDateObj.setHours(23, 59, 59, 999);

      const diffMs = endDateObj.getTime() - startDateObj.getTime();
      prevStartDateObj = new Date(startDateObj.getTime() - diffMs - 1000);
      prevEndDateObj = new Date(startDateObj.getTime() - 1000);
    } else {
      // Fallback
      isMonthComparison = true;
      const [year, month] = currentMonthStr.split('-').map(Number);
      startDateObj = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endDateObj = new Date(year, month, 0, 23, 59, 59, 999);

      const prev = new Date(year, month - 2, 1);
      prevMonthStr = getMonthStr(prev);
    }

    // 2. Fetch reports data
    let reportData;
    let prevReportData = null;
    let monthCompareData = null;

    if (isMonthComparison) {
      // Use ReportService monthly methods
      reportData = await reportService.getMonthlyReport(userId, currentMonthStr);
      try {
        monthCompareData = await reportService.compareMonths(userId, currentMonthStr, prevMonthStr);
        prevReportData = monthCompareData.previous;
      } catch (err) {
        logger.warn('Failed to resolve previous month comparison:', err);
      }
    } else {
      // Custom date range fetches
      reportData = await reportService.getCustomReport(userId, startDateObj, endDateObj);
      try {
        prevReportData = await reportService.getCustomReport(userId, prevStartDateObj, prevEndDateObj);
      } catch (err) {
        logger.warn('Failed to resolve previous range comparison:', err);
      }
    }

    // 3. Resolve Budget Context details for insights
    const budget = await budgetRepo.getCurrentBudget(userId, currentMonthStr);
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = Math.max(0, totalDaysInMonth - now.getDate());

    const spent = reportData.summary.totalExpense;
    let budgetContext = {
      hasBudget: false,
      budgetAmount: 0,
      spent,
      remaining: 0,
      remainingDays,
      status: 'safe' as 'safe' | 'approaching' | 'exceeded',
    };

    if (budget) {
      const budgetAmount = budget.amount;
      const remaining = Math.max(0, budgetAmount - spent);
      const spentRatio = budgetAmount > 0 ? spent / budgetAmount : 0;
      const status = spentRatio >= 1.0 ? 'exceeded' as const : spentRatio >= 0.8 ? 'approaching' as const : 'safe' as const;

      budgetContext = {
        hasBudget: true,
        budgetAmount,
        spent,
        remaining,
        remainingDays,
        status,
      };
    }

    // 4. Generate automated insights cards
    const insights = analyticsService.generateInsights(reportData, budgetContext, prevReportData);

    const serializedReport = JSON.parse(JSON.stringify(reportData));
    const serializedPrevReport = prevReportData ? JSON.parse(JSON.stringify(prevReportData)) : null;

    return {
      success: true,
      data: {
        report: serializedReport,
        previousReport: serializedPrevReport,
        insights,
        monthComparison: monthCompareData ? {
          difference: monthCompareData.difference,
          percentageChange: monthCompareData.percentageChange,
          isIncrease: monthCompareData.isIncrease,
        } : null,
      },
    };
  } catch (error: any) {
    logger.error('getReportsAction failed:', error);
    return { success: false, error: error.message || 'Failed to compile report analysis' };
  }
}
