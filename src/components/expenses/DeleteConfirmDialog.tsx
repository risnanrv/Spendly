'use client';

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isSubmitting?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Transaction',
  description = 'Are you sure you want to delete this expense record? This action cannot be undone.',
  isSubmitting = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#EAEAEA] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Warning Header Indicator */}
        <div className="p-6 pb-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-[#111111] leading-tight">
            {title}
          </h3>
          <p className="text-sm text-[#707070] mt-2">
            {description}
          </p>
        </div>

        {/* Buttons Action Footer */}
        <div className="px-6 py-4 bg-[#F7F7F7] border-t border-[#EAEAEA] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-[#F7F7F7] border border-[#EAEAEA] rounded-lg font-semibold text-sm text-[#707070] transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold text-sm text-white flex items-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Deleting...
              </>
            ) : (
              'Confirm Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
