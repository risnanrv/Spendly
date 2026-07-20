'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { authClient } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import {
  User,
  PiggyBank,
  FolderOpen,
  Database,
  ChevronRight,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

export default function SettingsIndexPage() {
  const router = useRouter();
  const { data: settingsData, isLoading } = useSettings();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 select-none max-w-md mx-auto">
        <div className="h-6 w-36 rounded animate-shimmer" />
        <SkeletonCard type="card" className="h-28 w-full" />
        <SkeletonCard type="card" className="h-44 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8 select-none pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#0A0A0A]">
          Settings
        </h1>
        <p className="text-xs text-[#6B6B6B] mt-0.5">
          Account profiles, target budgets, categories, and statement exports.
        </p>
      </div>

      {/* User profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E8E8E8] rounded-3xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center gap-4"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-lg shrink-0">
          {settingsData?.userName ? settingsData.userName[0].toUpperCase() : <User className="h-5 w-5 text-white" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[#0A0A0A] leading-tight truncate">
            {settingsData?.userName || 'Spendly User'}
          </span>
          <span className="text-[10px] text-[#6B6B6B] truncate mt-1 leading-none font-medium">
            {settingsData?.email}
          </span>
        </div>
      </motion.div>

      {/* Settings Navigation Menu (Grouped rows) */}
      <div className="space-y-6">
        {/* Profile Group */}
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-widest pl-1">Profile</span>
          <div className="bg-white border border-[#E8E8E8] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <Link
              href="/settings/profile"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F5] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#0A0A0A] border border-[#E8E8E8] flex items-center justify-center shrink-0">
                  <UserCheck className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#0A0A0A]">Profile Details</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6B6B6B] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Configuration Group */}
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-widest pl-1">Configuration</span>
          <div className="bg-white border border-[#E8E8E8] rounded-3xl overflow-hidden divide-y divide-[#E8E8E8] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <Link
              href="/settings/budgets"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F5] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#0A0A0A] border border-[#E8E8E8] flex items-center justify-center shrink-0">
                  <PiggyBank className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#0A0A0A]">Monthly Budgets</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6B6B6B] group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/settings/categories"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F5] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#0A0A0A] border border-[#E8E8E8] flex items-center justify-center shrink-0">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#0A0A0A]">Manage Categories</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6B6B6B] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Data & System Group */}
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-[#6B6B6B] uppercase tracking-widest pl-1">Data & Backups</span>
          <div className="bg-white border border-[#E8E8E8] rounded-3xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <Link
              href="/settings/backups"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F5F5F5] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#0A0A0A] border border-[#E8E8E8] flex items-center justify-center shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <span className="text-xs font-semibold text-[#0A0A0A]">Export Statements & Data</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#6B6B6B] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sign out button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleSignOut}
        className="w-full py-4 bg-white border border-[#E8E8E8] hover:bg-red-50 hover:text-red-500 hover:border-red-100 rounded-3xl font-semibold text-xs text-[#0A0A0A] flex items-center justify-center gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all"
      >
        <LogOut className="h-4 w-4" />
        Sign Out Account
      </motion.button>
    </div>
  );
}
