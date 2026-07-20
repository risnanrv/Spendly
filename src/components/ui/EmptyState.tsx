import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: 'expenses' | 'budgets' | 'categories' | 'default';
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  illustration = 'default',
  className = '',
}: EmptyStateProps) {
  
  const renderIllustration = () => {
    switch (illustration) {
      case 'expenses':
        return (
          <svg className="w-24 h-24 text-[#A8A8A8]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="15" width="60" height="70" rx="8" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />
            <line x1="32" y1="35" x2="68" y2="35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="32" y1="50" x2="68" y2="50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="32" y1="65" x2="52" y2="65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="70" cy="70" r="12" fill="#F5F5F5" stroke="currentColor" strokeWidth="2.5" />
            <path d="M70 65V75M65 70H75" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'budgets':
        return (
          <svg className="w-24 h-24 text-[#A8A8A8]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="2.5" strokeDasharray="6 4" />
            <circle cx="50" cy="50" r="24" stroke="currentColor" strokeWidth="1.5" />
            <path d="M50 35V65M35 50H65" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'categories':
        return (
          <svg className="w-24 h-24 text-[#A8A8A8]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 30C20 24.5 24.5 20 30 20H45L55 30H80C85.5 30 90 34.5 90 40V75C90 80.5 85.5 85 80 85H30C24.5 85 20 80.5 20 75V30Z" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />
            <circle cx="55" cy="58" r="10" fill="#F5F5F5" stroke="currentColor" strokeWidth="2.5" />
            <path d="M55 53V63M50 58H60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      default:
        return (
          <svg className="w-24 h-24 text-[#A8A8A8]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="25" width="50" height="50" rx="16" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" />
            <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="2.5" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center p-8 bg-white border border-[#E8E8E8] rounded-3xl min-h-[300px] select-none ${className}`}
    >
      <div className="mb-6 flex justify-center">{renderIllustration()}</div>
      <h3 className="text-base font-semibold text-[#0A0A0A] tracking-tight">{title}</h3>
      <p className="text-xs text-[#6B6B6B] max-w-xs mt-1.5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          className="mt-6 px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1C1C1C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:shadow-none"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}
