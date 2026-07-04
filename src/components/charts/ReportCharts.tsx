'use client';

import React from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Filler
);

interface ReportChartsProps {
  categoryBreakdown: Array<{
    categoryId: string;
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }>;
  dailyTrend: Array<{
    label: string;
    amount: number;
    date?: string;
  }>;
}

export function ReportCharts({ categoryBreakdown, dailyTrend }: ReportChartsProps) {
  // 1. Doughnut Category Allocation data
  const doughnutData = {
    labels: categoryBreakdown.map((c) => c.name),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.amount / 100),
        backgroundColor: categoryBreakdown.map((c) => {
          if (c.color === 'indigo') return '#4F46E5';
          if (c.color === 'emerald') return '#10B981';
          if (c.color === 'orange') return '#F97316';
          if (c.color === 'purple') return '#8B5CF6';
          if (c.color === 'red') return '#EF4444';
          if (c.color === 'pink') return '#EC4899';
          if (c.color === 'violet') return '#8B5CF6';
          if (c.color === 'cyan') return '#06B6D4';
          if (c.color === 'amber') return '#F59E0B';
          if (c.color === 'rose') return '#F43F5E';
          if (c.color === 'teal') return '#14B8A6';
          return '#707070';
        }),
        borderColor: '#FFFFFF',
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#111111',
          font: {
            size: 11,
            weight: 'bold' as const,
          },
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw as number;
            return ` ₹${val.toFixed(2)}`;
          },
        },
      },
    },
  };

  // 2. Line Spending Trend data
  const trendData = {
    labels: dailyTrend.map((d) => d.label),
    datasets: [
      {
        label: 'Daily Spending',
        data: dailyTrend.map((d) => d.amount / 100),
        borderColor: '#111111',
        backgroundColor: 'rgba(17, 17, 17, 0.03)',
        fill: true,
        tension: 0.2,
        pointRadius: dailyTrend.length > 15 ? 0 : 3,
        pointHoverRadius: 5,
        pointBackgroundColor: '#111111',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1.5,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const val = context.raw as number;
            return ` Spending: ₹${val.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#707070',
          font: {
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: '#EAEAEA',
        },
        ticks: {
          color: '#707070',
          font: {
            size: 10,
          },
          callback: (value: any) => `₹${value}`,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
      {/* Category Allocation share */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm flex flex-col h-[300px]">
        <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4">
          Category Allocations
        </h3>
        <div className="flex-1 relative min-h-0">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Daily trend line chart */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm flex flex-col h-[300px]">
        <h3 className="text-sm font-bold text-[#111111] uppercase tracking-wider mb-4">
          Spending Trend
        </h3>
        <div className="flex-1 relative min-h-0">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>
    </div>
  );
}
