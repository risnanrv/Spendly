import { create } from 'zustand';

interface HistoryState {
  searchQuery: string;
  selectedFilter: 'today' | 'week' | 'month' | 'all';
  selectedMonth: string;
  scrollOffset: number;
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: 'today' | 'week' | 'month' | 'all') => void;
  setSelectedMonth: (month: string) => void;
  setScrollOffset: (offset: number) => void;
  resetHistoryState: () => void;
}

/**
 * Zustand store preserving scroll coordinates and input filter values
 * when users toggle between the transaction log and transaction details.
 */
export const useHistoryStateStore = create<HistoryState>((set) => ({
  searchQuery: '',
  selectedFilter: 'all',
  selectedMonth: new Date().toISOString().substring(0, 7),
  scrollOffset: 0,

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedFilter: (selectedFilter) => set({ selectedFilter }),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
  resetHistoryState: () => set({
    searchQuery: '',
    selectedFilter: 'all',
    selectedMonth: new Date().toISOString().substring(0, 7),
    scrollOffset: 0,
  }),
}));
