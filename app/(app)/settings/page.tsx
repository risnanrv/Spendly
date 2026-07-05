'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSettings, useSaveAppearance } from '@/hooks/useSettings';
import { authClient } from '@/lib/auth-client';
import {
  User,
  PiggyBank,
  FolderOpen,
  Database,
  ChevronRight,
  LogOut,
  Loader2,
  Globe,
  Sun,
} from 'lucide-react';

const CURRENCY_OPTIONS = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'Pound Sterling (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
];

export default function SettingsIndexPage() {
  const router = useRouter();
  const { data: settingsData, isLoading } = useSettings();
  const saveAppearance = useSaveAppearance();

  const handleCurrencyChange = async (currency: string) => {
    if (!settingsData) return;
    await saveAppearance.mutateAsync({
      theme: 'light', // Force Light Theme
      currency,
    });
  };

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
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111111]">
          Settings
        </h1>
        <p className="text-xs text-[#707070] mt-1">
          Personalize preferences, budgets, backups, and profile.
        </p>
      </div>

      {/* User profile Summary Header */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-black font-bold text-xl shrink-0">
          {settingsData?.userName ? settingsData.userName[0].toUpperCase() : <User className="h-6 w-6 text-[#707070]" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold text-[#111111] leading-tight truncate">
            {settingsData?.userName || 'Spendly User'}
          </span>
          <span className="text-xs text-[#707070] truncate mt-0.5">
            {settingsData?.email}
          </span>
        </div>
      </div>

      {/* Group 1: Account Settings */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Account</span>
        <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden divide-y divide-[#EAEAEA] shadow-sm">
          <Link
            href="/settings/profile"
            className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-[#111111]">Profile Details</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[#707070]" />
          </Link>
        </div>
      </div>

      {/* Group 2: Configurations */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Configuration</span>
        <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden divide-y divide-[#EAEAEA] shadow-sm">
          <Link
            href="/settings/budgets"
            className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center">
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
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                <FolderOpen className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-[#111111]">Manage Categories</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[#707070]" />
          </Link>
        </div>
      </div>

      {/* Group 3: Global Preferences (inline) */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Preferences</span>
        <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden divide-y divide-[#EAEAEA] shadow-sm">
          {/* Currency selection */}
          <div className="flex items-center justify-between p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-500 flex items-center justify-center">
                <Globe className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-[#111111]">Primary Currency</span>
            </div>
            <select
              value={settingsData?.currency || 'INR'}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="px-2 py-1.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-xl text-xs font-bold text-[#111111] focus:outline-none focus:border-black cursor-pointer appearance-none text-right"
            >
              {CURRENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value}
                </option>
              ))}
            </select>
          </div>

          {/* Theme display */}
          <div className="flex items-center justify-between p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                <Sun className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-[#111111]">App Appearance</span>
            </div>
            <span className="text-xs font-bold text-[#707070] mr-1">Light Mode Only</span>
          </div>
        </div>
      </div>

      {/* Group 4: Backups & About */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-bold text-[#707070] uppercase tracking-wider pl-1">Data & System</span>
        <div className="bg-white border border-[#EAEAEA] rounded-2xl overflow-hidden divide-y divide-[#EAEAEA] shadow-sm">
          <Link
            href="/settings/backups"
            className="w-full flex items-center justify-between p-4 hover:bg-[#F7F7F7] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-[#111111]">Backups & Statements</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[#707070]" />
          </Link>
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
