'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ShieldCheck, Eye, EyeOff, X } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface PasswordConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

const REAUTH_CACHE_KEY = 'spendly_reauth_expiry';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function isReauthCached(): boolean {
  if (typeof window === 'undefined') return false;
  const expiry = sessionStorage.getItem(REAUTH_CACHE_KEY);
  if (!expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

export function setReauthCache(): void {
  if (typeof window === 'undefined') return;
  const expiry = Date.now() + CACHE_DURATION_MS;
  sessionStorage.setItem(REAUTH_CACHE_KEY, expiry.toString());
}

export function PasswordConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Verify Password',
  description = 'For your security, please enter your password to confirm this action.',
}: PasswordConfirmDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated within 5 minutes, proceed immediately
  useEffect(() => {
    if (isOpen) {
      if (isReauthCached()) {
        onConfirm();
        onClose();
      } else {
        // Reset states
        setPassword('');
        setError(null);
        setIsSubmitting(false);
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await authClient.reauthenticate(password);
      if (res.error) {
        setError(res.error.message || 'Incorrect password. Please try again.');
      } else {
        setReauthCache();
        onConfirm();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (isReauthCached()) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-[#EAEAEA]">
          <div className="flex items-center gap-2 text-[#111111]">
            <ShieldCheck className="h-4.5 w-4.5 text-[#0A0A0A]" />
            <h3 className="text-sm font-bold tracking-tight">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#707070] hover:text-[#111111] p-1 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-[#707070] leading-relaxed">
            {description}
          </p>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#707070]" htmlFor="confirm-password-input">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg text-xs text-[#111111] focus:outline-none focus:border-black transition-colors"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#707070] hover:text-[#111111] transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg font-semibold text-xs text-[#707070] transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-black hover:bg-black/90 rounded-lg font-semibold text-xs text-white flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  Verifying...
                </>
              ) : (
                'Confirm Action'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
