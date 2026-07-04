import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '@/di/ServiceContainer';
import type { BackupService } from '@/services/BackupService';

const getService = () => container.resolve<BackupService>('BackupService');

/**
 * useBackup custom hook exposes functions to export or import backups using React Query mutations.
 */
export const useBackup = () => {
  const queryClient = useQueryClient();
  const service = getService();

  const exportBackupMutation = useMutation({
    mutationFn: () => service.exportBackup(),
  });

  const importBackupMutation = useMutation({
    mutationFn: () => service.importBackup(),
    onSuccess: (success) => {
      if (success) {
        // Invalidate all loaded query caches to force-reload database updates
        queryClient.invalidateQueries();
      }
    },
  });

  return {
    exportBackup: exportBackupMutation.mutateAsync,
    isExporting: exportBackupMutation.isPending,
    importBackup: importBackupMutation.mutateAsync,
    isImporting: importBackupMutation.isPending,
    error: importBackupMutation.error,
  };
};
