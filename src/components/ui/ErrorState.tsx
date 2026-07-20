import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while fetching information from the database.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-[#E8E8E8] rounded-3xl max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#0A0A0A]">{title}</h3>
      <p className="text-xs text-[#6B6B6B] mt-1.5 leading-relaxed max-w-xs">{message}</p>
      {onRetry && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="mt-5 px-4 py-2 bg-[#0A0A0A] hover:bg-[#1C1C1C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry Request
        </motion.button>
      )}
    </motion.div>
  );
}
