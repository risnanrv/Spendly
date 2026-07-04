import { useMutation } from '@tanstack/react-query';
import { container } from '@/di/ServiceContainer';
import type { ExportService } from '@/services/ExportService';

const getService = () => container.resolve<ExportService>('ExportService');

/**
 * useExport custom hook exposes triggers to compile and share CSV/PDF reports via React Query.
 */
export const useExport = () => {
  const service = getService();

  const exportCSVMutation = useMutation({
    mutationFn: (monthStr: string) => service.exportCSV(monthStr),
  });

  const exportPDFMutation = useMutation({
    mutationFn: (monthStr: string) => service.exportPDF(monthStr),
  });

  return {
    exportCSV: exportCSVMutation.mutateAsync,
    isExportingCSV: exportCSVMutation.isPending,
    exportPDF: exportPDFMutation.mutateAsync,
    isExportingPDF: exportPDFMutation.isPending,
  };
};
