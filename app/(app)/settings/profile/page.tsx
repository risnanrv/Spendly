'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, changePasswordSchema, type ProfileInput, type ChangePasswordInput } from '@/utils/validation';
import { useSettings, useUpdateProfile } from '@/hooks/useSettings';
import { authClient } from '@/lib/auth-client';
import { useToastStore } from '@/stores/toast.store';
import { ChevronLeft, User, Loader2, Lock, Eye, EyeOff } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#707070] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
        <span className="text-sm font-semibold">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 select-none pb-12">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#707070] hover:text-[#111111] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#111111]">Profile Settings</h1>
      </div>

      {/* ── Profile Details Card ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-20 h-20 rounded-full bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-black font-bold text-3xl mb-2">
              {settingsData?.userName ? settingsData.userName[0].toUpperCase() : <User className="h-10 w-10 text-[#707070]" />}
            </div>
            <span className="text-xs text-[#707070]">{settingsData?.email}</span>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="profile-name">
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              {...profileRegister('name')}
              disabled={profileSubmitting}
            />
            {profileErrors.name && (
              <p className="text-xs text-red-500 font-medium">{profileErrors.name.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-black hover:bg-black/90 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            disabled={profileSubmitting}
          >
            {profileSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </form>
      </div>

      {/* ── Change Password Card ── */}
      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center">
            <Lock className="h-4 w-4 text-[#111111]" />
          </div>
          <h2 className="text-sm font-bold text-[#111111]">Change Password</h2>
        </div>

        <form onSubmit={handlePwSubmit(onChangePassword)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="current-password">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPw ? 'text' : 'password'}
                placeholder="Enter current password"
                className="w-full px-4 py-2.5 pr-10 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                {...pwRegister('currentPassword')}
                disabled={isChangingPw}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-black transition-colors"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.currentPassword && (
              <p className="text-xs text-red-500 font-medium">{pwErrors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="new-password">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 pr-10 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                {...pwRegister('newPassword')}
                disabled={isChangingPw}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-black transition-colors"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.newPassword && (
              <p className="text-xs text-red-500 font-medium">{pwErrors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="confirm-password">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="Repeat new password"
                className="w-full px-4 py-2.5 pr-10 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                {...pwRegister('confirmPassword')}
                disabled={isChangingPw}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-black transition-colors"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwErrors.confirmPassword && (
              <p className="text-xs text-red-500 font-medium">{pwErrors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isChangingPw}
            className="w-full px-5 py-2.5 bg-black hover:bg-black/90 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {isChangingPw ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
