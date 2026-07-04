import { create } from 'zustand';
import { getMonthStr } from '@/utils/date';

interface DashboardState {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedMonth: getMonthStr(new Date()),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));
