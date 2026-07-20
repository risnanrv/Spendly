'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, changePasswordSchema, type ProfileInput, type ChangePasswordInput } from '@/utils/validation';
import { useSettings, useUpdateProfile } from '@/hooks/useSettings';
import { authClient } from '@/lib/auth-client';
import { useToastStore } from '@/stores/toast.store';
import { ChevronLeft, User, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { motion } from 'framer-motion';

export default function ProfileSettingsPage() {
  const { data: settingsData, isLoading } = useSettings();
  const updateProfile = useUpdateProfile();
  const { addToast } = useToastStore();

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: pwRegister,
    handleSubmit: handlePwSubmit,
    reset: resetPwForm,
    formState: { errors: pwErrors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  useEffect(() => {
    if (settingsData) {
      setProfileValue('name', settingsData.userName);
    }
  }, [settingsData, setProfileValue]);

  const onUpdateProfile = async (data: ProfileInput) => {
    await updateProfile.mutateAsync(data.name);
  };

  const onChangePassword = async (data: ChangePasswordInput) => {
    setIsChangingPw(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
      });

      if (result.error) {
        addToast(result.error.message || 'Failed to change password', 'danger');
      } else {
        addToast('Password updated successfully!', 'success');
        resetPwForm();
      }
    } catch (err: any) {
      addToast(err?.message || 'Something went wrong changing password', 'danger');
    } finally {
      setIsChangingPw(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 select-none max-w-md mx-auto">
        <div className="h-6 w-36 rounded animate-shimmer" />
        <SkeletonCard type="budget" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-base font-semibold text-[#0A0A0A]">Profile Settings</h1>
      </div>

      {/* Profile Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6"
      >
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-6">
          {/* Display Name initials avatar block */}
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-center font-bold text-2xl mb-2">
              {settingsData?.userName ? settingsData.userName[0].toUpperCase() : <User className="h-8 w-8" />}
            </div>
            <span className="text-xs font-semibold text-[#0A0A0A]">{settingsData?.userName}</span>
            <span className="text-[10px] text-[#6B6B6B] font-medium leading-none mt-0.5">{settingsData?.email}</span>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#6B6B6B]" htmlFor="profile-name">
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              className="w-full px-4 py-3 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all font-medium"
              {...profileRegister('name')}
              disabled={profileSubmitting}
            />
            {profileErrors.name && (
              <p className="text-[10px] text-red-500 font-semibold">{profileErrors.name.message}</p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-3.5 bg-[#0A0A0A] hover:bg-[#1C1C1C] rounded-xl font-semibold text-xs text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            disabled={profileSubmitting}
          >
            {profileSubmitting ? 'Saving changes...' : 'Save Profile Changes'}
          </motion.button>
        </form>
      </motion.div>

      {/* Change Password Card */}
      <div className="bg-white border border-[#E8E8E8] rounded-3xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] border border-[#E8E8E8] flex items-center justify-center">
            <Lock className="h-3.5 w-3.5 text-[#0A0A0A]" />
          </div>
          <h2 className="text-xs font-bold text-[#0A0A0A] uppercase tracking-wider">Change Password</h2>
        </div>

        <form onSubmit={handlePwSubmit(onChangePassword)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#6B6B6B]" htmlFor="current-password">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPw ? 'text' : 'password'}
                placeholder="Enter current password"
                className="w-full px-4 py-3 pr-10 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all"
                {...pwRegister('currentPassword')}
                disabled={isChangingPw}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.currentPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{pwErrors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#6B6B6B]" htmlFor="new-password">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="w-full px-4 py-3 pr-10 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all"
                {...pwRegister('newPassword')}
                disabled={isChangingPw}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.newPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{pwErrors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold uppercase tracking-wider text-[#6B6B6B]" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="Repeat new password"
                className="w-full px-4 py-3 pr-10 bg-[#F5F5F5] border border-[#E8E8E8] rounded-xl text-xs text-[#0A0A0A] focus:outline-none focus:border-[#0A0A0A] focus:bg-white transition-all"
                {...pwRegister('confirmPassword')}
                disabled={isChangingPw}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.confirmPassword && (
              <p className="text-[10px] text-red-500 font-semibold">{pwErrors.confirmPassword.message}</p>
            )}
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isChangingPw}
            className="w-full py-3.5 bg-[#0A0A0A] hover:bg-[#1C1C1C] rounded-xl font-semibold text-xs text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isChangingPw ? 'Updating password...' : 'Update Account Password'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
