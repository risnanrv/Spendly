import { create } from 'zustand';
import { getMonthStr } from '@/utils/date';

interface DashboardState {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

/**
 * Zustand store preserving the active month for dashboard reporting slices.
 * Survives component unmounting and route navigation.
 */
export const useDashboardStore = create<DashboardState>((set) => ({
  selectedMonth: getMonthStr(new Date()),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
}));
