'use client';

import React from 'react';
import { useToastStore } from '@/stores/toast.store';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      default:
        return <Info className="h-4 w-4 text-sky-400" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20';
      case 'danger':
        return 'border-red-500/20';
      case 'warning':
        return 'border-amber-500/20';
      default:
        return 'border-sky-500/20';
    }
  };

  return (
    <div className="fixed bottom-20 right-4 md:top-4 md:right-4 md:bottom-auto z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            layout
            className={`flex items-start gap-3 p-3.5 bg-[#111111] border ${getBorderColor(
              toast.type
            )} backdrop-blur-md rounded-xl shadow-xl pointer-events-auto w-full`}
          >
            <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white shrink-0 p-0.5 rounded-lg active:scale-95 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
