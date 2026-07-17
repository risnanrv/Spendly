import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/lib/services';
import { auth } from '@/firebase/config';
import { useToastStore } from '@/stores/toast.store';

export function useCategories() {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return [];
      return categoryService.getCategoriesWithStats(userId);
    },
    enabled: !!userId,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      return categoryService.createCategory(userId, data.name, data.icon, data.color);
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      addToast('Category created successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to create category', 'danger');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; icon?: string; color?: string };
    }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      return categoryService.updateCategory(userId, id, data.name, data.icon, data.color);
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      addToast('Category updated successfully!', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to update category', 'danger');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async ({ id, reassignToId }: { id: string; reassignToId?: string }) => {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Unauthorized');

      return categoryService.deleteCategory(userId, id, reassignToId);
    },
    onSuccess: () => {
      const userId = auth.currentUser?.uid;
      queryClient.invalidateQueries({ queryKey: ['categories', userId] });
      queryClient.invalidateQueries({ queryKey: ['expenses', userId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', userId] });
      addToast('Category deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete category', 'danger');
    },
  });
}
