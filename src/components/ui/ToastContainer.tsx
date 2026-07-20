import React from 'react';
import { useToastStore } from '@/stores/toast.store';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-white" />;
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-white" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-white" />;
      default:
        return <Info className="h-4 w-4 text-white" />;
    }
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500';
      case 'danger':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      default:
        return 'bg-neutral-500';
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:top-6 md:right-6 md:bottom-auto z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-xs pointer-events-none select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            layout
            className="flex items-center gap-3 p-4 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.24)] pointer-events-auto w-full relative overflow-hidden"
          >
            {/* Minimal left side indicator line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${getAccentColor(toast.type)}`} />
            
            <div className="shrink-0 pl-1 text-white">{getIcon(toast.type)}</div>
            
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white leading-tight">
                {toast.message}
              </p>
            </div>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white shrink-0 p-1 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
