'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileInput } from '@/utils/validation';
import { useSettings, useUpdateProfile } from '@/hooks/useSettings';
import { ChevronLeft, User, Loader2 } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { data: settingsData, isLoading } = useSettings();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (settingsData) {
      setValue('name', settingsData.userName);
    }
  }, [settingsData, setValue]);

  const onUpdateProfile = async (data: ProfileInput) => {
    await updateProfile.mutateAsync(data.name);
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
    <div className="max-w-md mx-auto space-y-6 select-none">
      {/* Back Header */}
      <div className="flex items-center gap-2">
        <Link href="/settings" className="p-2 -ml-2 text-[#707070] hover:text-[#111111] transition-all">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-[#111111]">Profile Settings</h1>
      </div>

      <div className="bg-white border border-[#EAEAEA] rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSubmit(onUpdateProfile)} className="space-y-4">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-20 h-20 rounded-full bg-[#F7F7F7] border border-[#EAEAEA] flex items-center justify-center text-black font-bold text-3xl mb-2">
              {settingsData?.userName ? settingsData.userName[0].toUpperCase() : <User className="h-10 w-10 text-[#707070]" />}
            </div>
            <span className="text-xs text-[#707070]">{settingsData?.email}</span>
          </div>

          {/* User Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="profile-name">
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              className="w-full px-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-black hover:bg-black/90 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
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
    </div>
  );
}
