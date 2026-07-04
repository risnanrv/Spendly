'use client';

import React from 'react';
import { useToastStore } from '@/stores/toast.store';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'danger':
        return <AlertCircle className="h-5 w-5 text-danger" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-success/20';
      case 'danger':
        return 'border-danger/20';
      case 'warning':
        return 'border-warning/20';
      default:
        return 'border-info/20';
    }
  };

  return (
    <div className="fixed bottom-20 right-4 md:top-4 md:right-4 md:bottom-auto z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 p-4 bg-brand-surface/90 border ${getBorderColor(
            toast.type
          )} backdrop-blur-md rounded-xl shadow-lg pointer-events-auto animate-in slide-in-from-right duration-250`}
        >
          <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-text-tertiary hover:text-white shrink-0 p-0.5 rounded-lg active:scale-95 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
