'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/utils/validation';
import { authClient } from '@/lib/auth-client';
import { Loader2, Lock, Mail, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    setLoading(true);
    try {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (response?.error) {
        setError(response.error.message || 'Invalid email or password.');
      } else {
        router.replace('/expenses');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
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
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111111]">Welcome Back</h1>
            <p className="text-[#707070] text-sm leading-relaxed">
              Sign in with your email and password to access your expenses.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#707070]" htmlFor="password">
                  Password
                </label>
              </div>
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
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#707070]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-black hover:underline transition-colors">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
