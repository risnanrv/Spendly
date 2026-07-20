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
  // Ultra-premium monochrome gray scale
  const doughnutData = {
    labels: categoryBreakdown.map((c) => c.name),
    datasets: [
      {
        data: categoryBreakdown.map((c) => c.amount / 100),
        backgroundColor: categoryBreakdown.map((_, i) => {
          const monochromePalette = [
            '#0A0A0A', // True Black
            '#262626', // Near Black
            '#404040', // Deep Gray
            '#525252', 
            '#737373', 
            '#A3A3A3', // Muted Gray
            '#D4D4D4', // Light Gray
            '#E5E5E5', // Very Light Gray
          ];
          return monochromePalette[i % monochromePalette.length];
        }),
        borderColor: '#FFFFFF',
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '80%', // Thin elegant ring
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#404040',
          font: {
            size: 10,
            family: 'var(--font-sans)',
            weight: 500,
          },
          padding: 16,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0A0A0A',
        titleFont: { family: 'var(--font-sans)' },
        bodyFont: { family: 'var(--font-sans)' },
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => {
            const val = context.raw as number;
            return ` ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
  };

  // Line trend chart data
  const trendData = {
    labels: dailyTrend.map((d) => d.label),
    datasets: [
      {
        label: 'Spending',
        data: dailyTrend.map((d) => d.amount / 100),
        borderColor: '#0A0A0A',
        borderWidth: 2,
        backgroundColor: 'rgba(10, 10, 10, 0.03)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#0A0A0A',
        pointHoverBorderColor: '#FFFFFF',
        pointHoverBorderWidth: 2,
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
        backgroundColor: '#0A0A0A',
        titleFont: { family: 'var(--font-sans)' },
        bodyFont: { family: 'var(--font-sans)' },
        padding: 10,
        cornerRadius: 12,
        callbacks: {
          label: (context: any) => {
            const val = context.raw as number;
            return ` ₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
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
          color: '#6B6B6B',
          font: {
            size: 9,
            family: 'var(--font-sans)',
            weight: 500,
          },
        },
      },
      y: {
        grid: {
          color: '#E8E8E8',
          drawTicks: false,
        },
        border: {
          dash: [4, 4],
        },
        ticks: {
          color: '#6B6B6B',
          font: {
            size: 9,
            family: 'var(--font-sans)',
            weight: 500,
          },
          callback: (value: any) => `₹${value}`,
        },
      },
    },
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
      {/* Category breakdown (Donut ring) */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col h-[320px]">
        <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-4">
          Breakdown
        </span>
        <div className="flex-1 relative min-h-0">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      {/* Spending Trend (Minimal curve) */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col h-[320px]">
        <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider mb-4">
          Spending Curve
        </span>
        <div className="flex-1 relative min-h-0">
          <Line data={trendData} options={trendOptions} />
        </div>
      </div>
    </div>
  );
}
