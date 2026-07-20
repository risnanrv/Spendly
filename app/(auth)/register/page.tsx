'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/utils/validation';
import { authClient } from '@/lib/auth-client';
import { Loader2, Lock, Mail, User, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      if (response?.error) {
        setError(response.error.message || 'Failed to create an account.');
      } else {
        router.replace('/expenses');
        router.refresh();
      }
    } catch (err: any) {
      const { mapAuthError } = require('@/utils/auth-errors');
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-[#111111] select-none">
      {/* Left side panel (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#F7F7F7] overflow-hidden items-center justify-center p-12 border-r border-[#EAEAEA]">
        <div className="z-10 max-w-md">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center shadow-md mb-8">
            <span className="text-2xl font-extrabold tracking-tighter text-white">S</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-4 text-[#111111]">
            Smart budgeting, simple tracking.
          </h2>
          <p className="text-[#707070] leading-relaxed mb-6 text-sm">
            Take control of your spending habits with Spendly. Rebuilt from the ground up as a responsive, installable SaaS PWA.
          </p>
          {/* Decorative Preview */}
          <div className="rounded-2xl border border-[#EAEAEA] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#EAEAEA] pb-3">
              <span className="text-xs font-bold text-[#707070] uppercase">Quick Insights</span>
              <span className="text-xs text-green-600 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 font-bold">Saved 12%</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-[#707070]">
                <span>Monthly Budget Status</span>
                <span className="text-[#111111]">₹34,000 / ₹40,000</span>
              </div>
              <div className="w-full bg-[#F7F7F7] border border-[#EAEAEA] h-2 rounded-full overflow-hidden">
                <div className="bg-black h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 bg-white">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111111]">Create an Account</h1>
            <p className="text-[#707070] text-sm leading-relaxed">
              Sign up today and get started managing your finances like a pro.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="name">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] placeholder-[#A0A0A0] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  {...register('name')}
                  disabled={loading}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] placeholder-[#A0A0A0] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  {...register('email')}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707070]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-sm text-[#111111] placeholder-[#A0A0A0] focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  {...register('password')}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#111111] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-black hover:bg-black/90 active:scale-[0.98] transition-all rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#707070]">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-black hover:underline transition-colors">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
