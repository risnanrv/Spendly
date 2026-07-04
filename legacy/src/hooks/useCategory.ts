import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { container, DI_TOKENS } from '@/di/ServiceContainer';
import type { CategoryService } from '@/services/CategoryService';
import type { Category } from '@/models/domain';

/**
 * Custom React Query hook fetching active categories.
 * Can optionally include count and spent total statistics per category.
 */
export const useCategories = (options?: { includeStats?: boolean }) => {
  const includeStats = options?.includeStats ?? false;

  return useQuery<Category[]>({
    queryKey: ['categories', { includeStats }],
    queryFn: async () => {
      const categoryService = container.resolve<CategoryService>(DI_TOKENS.CategoryService);
      if (includeStats) {
        return categoryService.getCategoriesWithStats();
      }
      // Uses the repository's in-memory cache directly
      const repo = container.resolve<any>(DI_TOKENS.CategoryRepository);
      return repo.getCategories();
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

/**
 * Custom React Query hook creating new categories.
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, icon, color, type }: { name: string; icon: string; color: string; type?: 'expense' | 'income' }) => {
      const categoryService = container.resolve<CategoryService>(DI_TOKENS.CategoryService);
      return categoryService.createCategory(name, icon, color, type);
    },
    onSuccess: () => {
      // Invalidate all category lists, forms, and dashboard layouts
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

/**
 * Custom React Query hook updating existing custom/system category properties.
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name, icon, color }: { id: string; name?: string; icon?: string; color?: string }) => {
      const categoryService = container.resolve<CategoryService>(DI_TOKENS.CategoryService);
      return categoryService.updateCategory(id, name, icon, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

/**
 * Custom React Query hook soft-deleting categories. Handles reassignments.
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reassignToId }: { id: string; reassignToId?: string }) => {
      const categoryService = container.resolve<CategoryService>(DI_TOKENS.CategoryService);
      return categoryService.deleteCategory(id, reassignToId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
};

/**
 * Custom React Query hook restoring soft-deleted categories.
 */
export const useRestoreCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const categoryService = container.resolve<CategoryService>(DI_TOKENS.CategoryService);
      return categoryService.restoreCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
