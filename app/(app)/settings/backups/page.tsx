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
import { backupService, exportService } from '@/lib/services';
import { auth } from '@/firebase/config';
import { getMonthStr } from '@/utils/date';
import { useToastStore } from '@/stores/toast.store';
import { PasswordConfirmDialog } from '@/components/ui/PasswordConfirmDialog';
import { BulkDeleteCategoriesDialog } from '@/components/categories/BulkDeleteCategoriesDialog';
import { useCategories } from '@/hooks/useCategories';
import { ChevronLeft, Download, Upload, Printer, Trash2, ShieldAlert, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BackupsSettingsPage() {
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();

  const [confirmType, setConfirmType] = useState<
    'expenses' | 'budgets' | 'categories' | 'reset' | 'restore' | 'bulkDelete' | null
  >(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const { data: categories } = useCategories();
  const [restorePayload, setRestorePayload] = useState<any>(null);
  const [exportMonth, setExportMonth] = useState<string>('lifetime');
  const [showDanger, setShowDanger] = useState(false);

  const truncateExpenses = useTruncateExpenses();
  const truncateBudgets = useTruncateBudgets();
  const truncateCategories = useTruncateCategories();
  const resetDatabase = useResetDatabase();

  const handleExportJSON = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      addToast('User session not found', 'danger');
      return;
    }

    try {
      const data = await backupService.getBackupData(userId);
      const payloadString = JSON.stringify(data, null, 2);
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
    } catch (err: any) {
      addToast(err.message || 'Failed to extract database backup', 'danger');
    }
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
    const userId = auth.currentUser?.uid;
    if (!userId || !restorePayload) return;

    try {
      await backupService.restoreBackup(userId, restorePayload);
      if (queryClient) {
        queryClient.invalidateQueries();
      }
      addToast('Backup data merged successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Data merge failed', 'danger');
    }
    setConfirmType(null);
    setRestorePayload(null);
  };

  const handleExportCSV = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      addToast('User session not found', 'danger');
      return;
    }

    try {
      const csvData = await exportService.exportCSV(userId, exportMonth);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        exportMonth === 'lifetime'
          ? `Spendly_Report_AllTime_${new Date().toISOString().split('T')[0]}.csv`
          : `Spendly_Report_${exportMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('CSV Statement downloaded successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to generate CSV export', 'danger');
    }
  };

  const handleExportHTML = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      addToast('User session not found', 'danger');
      return;
    }

    try {
      const htmlData = await exportService.exportHTML(userId, exportMonth);
      const blob = new Blob([htmlData], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        exportMonth === 'lifetime'
          ? `Spendly_Statement_AllTime_${new Date().toISOString().split('T')[0]}.html`
          : `Spendly_Statement_${exportMonth}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('Printable statement generated successfully.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to generate statement HTML', 'danger');
    }
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

  const handlePasswordConfirmSuccess = () => {
    if (confirmType === 'restore') {
      handleConfirmRestore();
    } else if (confirmType === 'bulkDelete') {
      setIsBulkDeleteOpen(true);
      setConfirmType(null);
    } else {
      handleConfirmDangerAction();
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
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-[#0A0A0A]">Backups & Statement Exports</h1>
      </div>

      {/* Database Snapshots card */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
          Database Snapshots
        </span>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            className="flex flex-col items-center justify-center p-4 bg-[#F5F5F5] border border-[#E8E8E8] rounded-2xl hover:bg-[#E8E8E8]/40 transition-all text-center gap-2"
          >
            <Download className="h-5 w-5 text-[#0A0A0A]" />
            <span className="text-xs font-semibold text-[#0A0A0A]">Export Backup</span>
            <span className="text-[9px] text-[#6B6B6B]">Download JSON snapshot</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 bg-[#F5F5F5] border border-[#E8E8E8] rounded-2xl hover:bg-[#E8E8E8]/40 transition-all text-center gap-2 cursor-pointer">
            <Upload className="h-5 w-5 text-[#0A0A0A]" />
            <span className="text-xs font-semibold text-[#0A0A0A]">Restore Backup</span>
            <span className="text-[9px] text-[#6B6B6B]">Upload JSON snapshot</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Export Statement Section */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider block">
          Statement Period
        </span>
        
        {/* Period selection select box */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-wider pl-0.5">Select Period</label>
          <div className="relative">
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs font-semibold text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] appearance-none cursor-pointer"
            >
              <option value="lifetime">All Time (Lifetime)</option>
              {monthOptions.map((opt: { value: string; label: string }) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B] pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 py-3 bg-[#F5F5F5] border border-[#E8E8E8] hover:bg-[#E8E8E8]/40 rounded-xl text-xs font-semibold text-[#0A0A0A] transition-all"
          >
            <Download className="h-4 w-4" />
            CSV Sheet
          </button>
          <button
            onClick={handleExportHTML}
            className="flex items-center justify-center gap-2 py-3 bg-[#F5F5F5] border border-[#E8E8E8] hover:bg-[#E8E8E8]/40 rounded-xl text-xs font-semibold text-[#0A0A0A] transition-all"
          >
            <Printer className="h-4 w-4" />
            Print HTML
          </button>
        </div>
      </div>

      {/* Collapsible Danger Zone Section */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <button
          onClick={() => setShowDanger(!showDanger)}
          className="w-full flex items-center justify-between p-5 bg-white text-red-500 font-semibold text-xs"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
            <span className="uppercase tracking-wider text-[10px] font-bold">Danger Zone Actions</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-[#6B6B6B] transition-transform ${showDanger ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showDanger && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden bg-neutral-50/50 border-t border-[#E8E8E8] p-5 space-y-2.5"
            >
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
                <span>Delete All Categories</span>
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmType('bulkDelete')}
                className="w-full flex items-center justify-between p-3 bg-red-50/50 hover:bg-red-50 border border-red-100 rounded-xl transition-all text-left text-xs font-bold text-red-600"
              >
                <span>Delete Selected Categories</span>
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmType('reset')}
                className="w-full flex items-center justify-between p-3 bg-red-500 hover:bg-red-600 rounded-xl transition-all text-left text-xs font-bold text-white shadow-sm"
              >
                <span>Reset Complete Database</span>
                <Trash2 className="h-4 w-4 text-white" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Dialogs */}
      <PasswordConfirmDialog
        isOpen={!!confirmType}
        onClose={() => {
          setConfirmType(null);
          setRestorePayload(null);
        }}
        onConfirm={handlePasswordConfirmSuccess}
        title={
          confirmType === 'restore'
            ? 'Confirm Restore Backup'
            : confirmType === 'reset'
              ? 'Confirm Reset Database'
              : confirmType === 'bulkDelete'
                ? 'Confirm Bulk Category Deletion'
                : `Confirm Delete All ${confirmType === 'expenses' ? 'Expenses' : confirmType === 'budgets' ? 'Budgets' : 'Categories'}`
        }
        description={
          confirmType === 'restore'
            ? 'This will merge backup expenses, categories, and budgets into your current account. Existing records will remain untouched. Please verify your password to continue.'
            : confirmType === 'reset'
              ? 'This will permanently wipe all your transaction details, budgets, settings, and categories. This action is irreversible. Please verify your password to confirm.'
              : confirmType === 'bulkDelete'
                ? 'You are about to delete multiple selected categories. Please verify your password to continue.'
                : `This will permanently empty all logged ${confirmType === 'expenses' ? 'expenses' : confirmType === 'budgets' ? 'budget goals' : 'categories'}. Please verify your password to continue.`
        }
      />

      <BulkDeleteCategoriesDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        allCategories={categories || []}
        onSuccess={() => {
          queryClient.invalidateQueries();
        }}
      />
    </div>
  );
}
