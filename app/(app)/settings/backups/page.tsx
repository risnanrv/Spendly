'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  useTruncateExpenses,
  useTruncateBudgets,
  useTruncateCategories,
  useResetDatabase,
} from '@/hooks/useSettings';
import { getBackupAction, restoreBackupAction, exportCSVAction, exportHTMLAction } from '@/actions/backup';
import { getMonthStr } from '@/utils/date';
import { useToastStore } from '@/stores/toast.store';
import { DeleteConfirmDialog } from '@/components/expenses/DeleteConfirmDialog';
import { ChevronLeft, Download, Upload, Printer, Trash2, ShieldAlert } from 'lucide-react';

export default function BackupsSettingsPage() {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [confirmType, setConfirmType] = useState<
    'expenses' | 'budgets' | 'categories' | 'reset' | 'restore' | null
  >(null);
  const [restorePayload, setRestorePayload] = useState<any>(null);
  const [exportMonth, setExportMonth] = useState<string>('lifetime');

  const truncateExpenses = useTruncateExpenses();
  const truncateBudgets = useTruncateBudgets();
  const truncateCategories = useTruncateCategories();
  const resetDatabase = useResetDatabase();

  const handleExportJSON = async () => {
    const res = await getBackupAction();
    if (!res.success || !res.data) {
      addToast(res.error || 'Failed to extract database backup', 'danger');
      return;
    }

    const payloadString = JSON.stringify(res.data, null, 2);
    const blob = new Blob([payloadString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `Spendly_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Backup JSON downloaded successfully.', 'success');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.app || parsed.app !== 'Spendly') {
          addToast('Invalid backup file format.', 'danger');
          return;
        }

        setRestorePayload(parsed);
        setConfirmType('restore');
      } catch {
        addToast('Failed to parse selected JSON file.', 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restorePayload) return;
    const res = await restoreBackupAction(restorePayload);
    if (res.success) {
      if (queryClient) {
        queryClient.invalidateQueries();
      }
      addToast('Data snapshot restored successfully!', 'success');
    } else {
      addToast(res.error || 'Data restoration failed', 'danger');
    }
    setConfirmType(null);
    setRestorePayload(null);
  };

  const handleExportCSV = async () => {
    const res = await exportCSVAction(exportMonth);
    if (!res.success || !res.data) {
      addToast(res.error || 'Failed to generate CSV export', 'danger');
      return;
    }

    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportMonth === 'lifetime'
      ? `Spendly_Report_AllTime_${new Date().toISOString().split('T')[0]}.csv`
      : `Spendly_Report_${exportMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('CSV Statement downloaded successfully.', 'success');
  };

  const handleExportHTML = async () => {
    const res = await exportHTMLAction(exportMonth);
    if (!res.success || !res.data) {
      addToast(res.error || 'Failed to generate statement HTML', 'danger');
      return;
    }

    const blob = new Blob([res.data], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exportMonth === 'lifetime'
      ? `Spendly_Statement_AllTime_${new Date().toISOString().split('T')[0]}.html`
      : `Spendly_Statement_${exportMonth}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Printable statement generated successfully.', 'success');
  };

  const handleConfirmDangerAction = async () => {
    if (!confirmType) return;

    try {
      if (confirmType === 'expenses') {
        await truncateExpenses.mutateAsync();
      } else if (confirmType === 'budgets') {
        await truncateBudgets.mutateAsync();
      } else if (confirmType === 'categories') {
        await truncateCategories.mutateAsync();
      } else if (confirmType === 'reset') {
        await resetDatabase.mutateAsync();
      }
    } catch {
      // Handled in hooks
    } finally {
      setConfirmType(null);
    }
  };

  const monthOptions = useMemo(() => {
    const list = [];
    const current = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
      list.push({
        value: getMonthStr(d),
        label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      });
    }
    return list;
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-6 select-none">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#707070] hover:text-[#111111] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#111111]">Backups & Data</h1>
      </div>

      {/* JSON Backup & Restore section */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Database Snapshots</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center p-4 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl hover:bg-[#EAEAEA]/30 transition-all text-center gap-2"
          >
            <Download className="h-5 w-5 text-black" />
            <span className="text-xs font-bold text-[#111111]">Export Backup</span>
            <span className="text-[9px] text-[#707070]">Download JSON file</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl hover:bg-[#EAEAEA]/30 transition-all text-center gap-2 cursor-pointer">
            <Upload className="h-5 w-5 text-black" />
            <span className="text-xs font-bold text-[#111111]">Restore Backup</span>
            <span className="text-[9px] text-[#707070]">Upload JSON file</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Statement Exports Section */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#111111] uppercase tracking-wider">Export Statements</h2>
        
        {/* Month Picker */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-[#707070] uppercase">Select Period</label>
          <select
            value={exportMonth}
            onChange={(e) => setExportMonth(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-black transition-colors"
          >
            <option value="lifetime">All Time (Lifetime)</option>
            {monthOptions.map((opt: { value: string; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl hover:bg-[#EAEAEA]/30 text-xs font-bold text-[#111111]"
          >
            <Download className="h-4 w-4" />
            CSV Sheet
          </button>
          <button
            onClick={handleExportHTML}
            className="flex items-center justify-center gap-2 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl hover:bg-[#EAEAEA]/30 text-xs font-bold text-[#111111]"
          >
            <Printer className="h-4 w-4" />
            Print HTML
          </button>
        </div>
      </div>

      {/* Danger Zone Section */}
      <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-red-500">
          <ShieldAlert className="h-5 w-5" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Danger Zone</h2>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setConfirmType('expenses')}
            className="w-full flex items-center justify-between p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl transition-all text-left text-xs font-bold text-red-600"
          >
            <span>Delete All Expenses</span>
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmType('budgets')}
            className="w-full flex items-center justify-between p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl transition-all text-left text-xs font-bold text-red-600"
          >
            <span>Delete All Budgets</span>
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmType('categories')}
            className="w-full flex items-center justify-between p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl transition-all text-left text-xs font-bold text-red-600"
          >
            <span>Delete Custom Categories</span>
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setConfirmType('reset')}
            className="w-full flex items-center justify-between p-3 bg-red-500 hover:bg-red-600 rounded-xl transition-all text-left text-xs font-bold text-white shadow-sm"
          >
            <span>Reset Complete Database</span>
            <Trash2 className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <DeleteConfirmDialog
        isOpen={!!confirmType}
        onClose={() => {
          setConfirmType(null);
          setRestorePayload(null);
        }}
        onConfirm={confirmType === 'restore' ? handleConfirmRestore : handleConfirmDangerAction}
        title={
          confirmType === 'restore'
            ? 'Restore Database Snapshot'
            : confirmType === 'reset'
              ? 'Reset Complete Database'
              : `Delete All ${confirmType === 'expenses' ? 'Expenses' : confirmType === 'budgets' ? 'Budgets' : 'Custom Categories'}`
        }
        description={
          confirmType === 'restore'
            ? 'This will wipe out all current expense lists, targets, and custom categories and restore them from the uploaded backup file. Proceed?'
            : confirmType === 'reset'
              ? 'Are you absolutely sure you want to delete all transaction details, configurations, and categories? This action is permanent!'
              : `Are you sure you want to empty all logged ${confirmType === 'expenses' ? 'expenses' : confirmType === 'budgets' ? 'budget goals' : 'custom categories'}? This cannot be undone.`
        }
      />
    </div>
  );
}
