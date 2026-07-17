'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/hooks/useSettings';
import { authClient } from '@/lib/auth-client';
import {
  User,
  PiggyBank,
  FolderOpen,
  Database,
  ChevronRight,
  LogOut,
  Loader2,
} from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#707070] gap-3 select-none">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="text-sm font-semibold">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111]">
          Settings
        </h1>
        <p className="text-xs text-[#707070] mt-1">
          Manage your account profile, budget targets, category configs, and statements.
        </p>
      </div>

      {/* User profile Summary Header */}
      <div className="bg-[#F7F7F7] border border-[#EAEAEA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-white border border-[#EAEAEA] flex items-center justify-center text-black font-bold text-xl shrink-0">
          {settingsData?.userName ? settingsData.userName[0].toUpperCase() : <User className="h-6 w-6 text-[#707070]" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold text-[#111111] leading-tight truncate">
            {settingsData?.userName || 'Spendly User'}
          </span>
          <span className="text-xs text-[#707070] truncate mt-0.5 font-medium">
            {settingsData?.email}
          </span>
        </div>
      </div>

      {/* Settings Navigation Menu */}
      <div className="space-y-4">
        {/* Profile */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Profile</span>
          <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden shadow-sm">
            <Link
              href="/settings/profile"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] text-[#111111] border border-[#EAEAEA] flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#111111]">Profile Details</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#707070]" />
            </Link>
          </div>
        </div>

        {/* Configurations */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Configuration</span>
          <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden divide-y divide-[#EAEAEA] shadow-sm">
            <Link
              href="/settings/budgets"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] text-[#111111] border border-[#EAEAEA] flex items-center justify-center">
                  <PiggyBank className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#111111]">Target Budgets</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#707070]" />
            </Link>

            <Link
              href="/settings/categories"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] text-[#111111] border border-[#EAEAEA] flex items-center justify-center">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#111111]">Manage Categories</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#707070]" />
            </Link>
          </div>
        </div>

        {/* Data & Backups */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Data & System</span>
          <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden shadow-sm">
            <Link
              href="/settings/backups"
              className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#F7F7F7] text-[#111111] border border-[#EAEAEA] flex items-center justify-center">
                  <Database className="h-4 w-4" />
                </div>
                <span className="text-sm font-bold text-[#111111]">Backups & Statements</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#707070]" />
            </Link>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 bg-red-50 border border-red-100 hover:bg-red-100/50 rounded-2xl font-bold text-sm text-red-500 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
      >
        <LogOut className="h-4.5 w-4.5 text-red-500" />
        Sign Out Account
      </button>
    </div>
  );
}
