import { create } from 'zustand';

interface RecentCategoriesState {
  recentCategoryIds: string[];
  addRecentCategoryId: (id: string) => void;
}

/**
 * Zustand store retaining the top 4 most recently used category IDs
 * for quick favorite selection in the expense form picker.
 */
export const useRecentCategoriesStore = create<RecentCategoriesState>((set) => ({
  recentCategoryIds: [],
  addRecentCategoryId: (id) =>
    set((state) => {
      const filtered = state.recentCategoryIds.filter((cid) => cid !== id);
      return {
        recentCategoryIds: [id, ...filtered].slice(0, 4),
      };
    }),
}));
