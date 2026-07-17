import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/lib/services';
import { auth } from '@/firebase/config';

export function useDashboard(monthStr: string) {
  const userId = auth.currentUser?.uid;

  return useQuery({
    queryKey: ['dashboard', userId, monthStr],
    queryFn: async () => {
      if (!userId) return null;
      return dashboardService.getDashboardData(userId, monthStr);
    },
    enabled: !!userId,
  });
}
