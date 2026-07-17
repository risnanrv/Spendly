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
  // Grayscale colors for category Doughnut slice allocation
  const doughnutData = {
    labels: categoryBreakdown.map((c) => c.name),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.amount / 100),
        backgroundColor: categoryBreakdown.map((_, i) => {
          const monochromePalette = [
            '#111111', // Solid Black
            '#2F2F2F', // Dark Gray
            '#4F4F4F', // Medium Dark Gray
            '#6F6F6F', // Gray
            '#8F8F8F', // Medium Gray
            '#AFAFAF', // Medium Light Gray
            '#CFCFCF', // Light Gray
            '#EAEAEA', // Very Light Gray
          ];
          return monochromePalette[i % monochromePalette.length];
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
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: '#111111',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
          label: (context: any) => {
            const val = context.raw as number;
            return ` ₹${val.toFixed(2)}`;
          },
        },
      },
    },
  };

  // Spending Trend line configuration
  const trendData = {
    labels: dailyTrend.map((d) => d.label),
    datasets: [
      {
        label: 'Daily Spending',
        data: dailyTrend.map((d) => d.amount / 100),
        borderColor: '#111111',
        backgroundColor: 'rgba(17, 17, 17, 0.04)',
        fill: true,
        tension: 0.25,
        pointRadius: dailyTrend.length > 15 ? 0 : 4,
        pointHoverRadius: 6,
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
        backgroundColor: '#111111',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
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
        border: {
          dash: [4, 4],
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
      {/* Category allocations chart */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm flex flex-col h-[300px]">
        <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-4">
          Category Allocation
        </h3>
        <div className="flex-1 relative min-h-0">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Spending Trend line chart */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm flex flex-col h-[300px]">
        <h3 className="text-xs font-bold text-[#111111] uppercase tracking-wider mb-4">
          Spending Trend
        </h3>
        <div className="flex-1 relative min-h-0">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>
    </div>
  );
}
