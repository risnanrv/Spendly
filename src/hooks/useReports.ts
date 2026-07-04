import { useQuery } from '@tanstack/react-query';
import { getReportsAction, type ReportsFilter } from '@/actions/reports';

export function useReports(filter: ReportsFilter) {
  return useQuery({
    queryKey: ['reports', filter],
    queryFn: async () => {
      const response = await getReportsAction(filter);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
  });
}
