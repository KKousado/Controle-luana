import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-[#1C1C1E] rounded-t-[26px] shadow-2xl flex flex-col max-h-[92vh] animate-slide-up border-t border-black/5 dark:border-white/10"
      >
        {/* Grabber Handle */}
        <div className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing" onClick={onClose}>
          <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#2C2C2E] flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all"
            aria-label="Fechar"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto no-scrollbar space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
