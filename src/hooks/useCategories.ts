import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategoriesAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '@/actions/categories';
import { useToastStore } from '@/stores/toast.store';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await getCategoriesAction();
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string }) => {
      const response = await createCategoryAction(data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
      const response = await updateCategoryAction(id, data);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
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
      const response = await deleteCategoryAction(id, reassignToId);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      addToast('Category deleted successfully.', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Failed to delete category', 'danger');
    },
  });
}
