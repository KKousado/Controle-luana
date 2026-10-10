import React from 'react';
import { Cake, RefreshCw, AlertCircle } from 'lucide-react';

interface SplashScreenProps {
  error?: string | null;
  onRetry?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ error, onRetry }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F2F2F7] dark:bg-black px-6 select-none">
      <div className="flex flex-col items-center max-w-sm text-center">
        {/* Animated App Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#FF2D55] via-[#FF9500] to-[#C67D34] flex items-center justify-center shadow-xl shadow-orange-500/20">
            <Cake className="w-12 h-12 text-white animate-pulse" strokeWidth={1.75} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white dark:bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-md">
            <span className="text-sm">✨</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
          Doces da Luana
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8">
          Controle Financeiro Confeitaria
        </p>

        {error ? (
          <div className="ios-glass-card p-5 rounded-2xl w-full border border-red-500/20 bg-white/80 dark:bg-[#1C1C1E]/80 shadow-lg animate-fade-in">
            <div className="flex items-center justify-center text-[#FF3B30] mb-3">
              <AlertCircle className="w-8 h-8" strokeWidth={2} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              Não foi possível conectar
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {error.includes('Invalid login credentials')
                ? 'Verifique se o usuário luana@docesdaluana.app foi cadastrado no painel Supabase com a mesma senha definida nas configurações.'
                : error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-3 px-4 rounded-xl bg-[#007AFF] text-white font-semibold text-sm flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar novamente</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full space-y-3">
            <div className="h-4 bg-gray-300/60 dark:bg-gray-800/60 rounded-full animate-pulse w-3/4 mx-auto" />
            <div className="h-3 bg-gray-200/50 dark:bg-gray-800/40 rounded-full animate-pulse w-1/2 mx-auto" />
            <div className="pt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
              <div className="w-2 h-2 rounded-full bg-[#FF2D55] animate-ping" />
              <span>Conectando como Luana...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
