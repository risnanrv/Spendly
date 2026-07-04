import { useQuery } from '@tanstack/react-query';
import { getDashboardAction } from '@/actions/dashboard';

export function useDashboard(monthStr: string) {
  return useQuery({
    queryKey: ['dashboard', monthStr],
    queryFn: async () => {
      const response = await getDashboardAction(monthStr);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}
