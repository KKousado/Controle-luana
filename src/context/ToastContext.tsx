import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = (options: ToastOptions) => {
    setToast(options);
    const duration = options.duration || 4000;
    setTimeout(() => {
      setToast((current) => (current === options ? null : current));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-slide-up pointer-events-auto">
          <div className="ios-glass-card shadow-2xl rounded-2xl px-4 py-3 flex items-center justify-between border border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#1C1C1E]/95">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 mr-3">
              {toast.message}
            </span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  setToast(null);
                }}
                className="text-sm font-semibold text-[#007AFF] hover:underline px-2 py-1 rounded active:opacity-60"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
