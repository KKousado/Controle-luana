import React from 'react';
import { Home, ArrowLeftRight, PieChart, Clock, Settings, Plus } from 'lucide-react';

export type TabType = 'inicio' | 'lancamentos' | 'relatorios' | 'contas' | 'ajustes';

interface TabBarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenNewModal: (tipo: 'entrada' | 'saida') => void;
}

export const TabBar: React.FC<TabBarProps> = ({ currentTab, onTabChange, onOpenNewModal }) => {
  const [showQuickAction, setShowQuickAction] = React.useState(false);

  return (
    <>
      {/* Quick Action Overlay Sheet */}
      {showQuickAction && (
        <div className="fixed inset-0 z-40" onClick={() => setShowQuickAction(false)}>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-fade-in" />
          <div
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col space-y-2 w-64 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowQuickAction(false);
                onOpenNewModal('entrada');
              }}
              className="ios-glass p-3.5 rounded-2xl flex items-center space-x-3 shadow-lg border border-black/5 dark:border-white/10 active:scale-95 transition-all text-left bg-white/95 dark:bg-[#1C1C1E]/95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#34C759]/15 text-[#34C759] flex items-center justify-center font-bold">
                +
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Nova Entrada</p>
                <p className="text-xs text-gray-500">Venda, encomenda, app</p>
              </div>
            </button>

            <button
              onClick={() => {
                setShowQuickAction(false);
                onOpenNewModal('saida');
              }}
              className="ios-glass p-3.5 rounded-2xl flex items-center space-x-3 shadow-lg border border-black/5 dark:border-white/10 active:scale-95 transition-all text-left bg-white/95 dark:bg-[#1C1C1E]/95"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FF3B30]/15 text-[#FF3B30] flex items-center justify-center font-bold">
                -
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">Nova Saída</p>
                <p className="text-xs text-gray-500">Ingredientes, contas, taxas</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Tab Bar */}
      <nav
        aria-label="Barra de navegação"
        className="fixed bottom-0 left-0 right-0 z-30 ios-glass border-t border-black/5 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
          {/* Aba Início */}
          <button
            onClick={() => onTabChange('inicio')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              currentTab === 'inicio'
                ? 'text-[#007AFF] font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Home size={22} strokeWidth={currentTab === 'inicio' ? 2.5 : 1.75} />
            <span className="text-[10px] mt-1">Início</span>
          </button>

          {/* Aba Lançamentos */}
          <button
            onClick={() => onTabChange('lancamentos')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              currentTab === 'lancamentos'
                ? 'text-[#007AFF] font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <ArrowLeftRight size={22} strokeWidth={currentTab === 'lancamentos' ? 2.5 : 1.75} />
            <span className="text-[10px] mt-1">Extrato</span>
          </button>

          {/* Botão Central Flutuante (+) */}
          <div className="flex-1 flex justify-center">
            <button
              onClick={() => setShowQuickAction(!showQuickAction)}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2D55] via-[#FF9500] to-[#C67D34] text-white flex items-center justify-center shadow-md shadow-orange-500/30 active:scale-90 transition-transform -mt-4 border-2 border-white dark:border-black"
              aria-label="Adicionar lançamento"
            >
              <Plus size={26} strokeWidth={2.75} className={`transition-transform duration-200 ${showQuickAction ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {/* Aba Contas */}
          <button
            onClick={() => onTabChange('contas')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              currentTab === 'contas'
                ? 'text-[#007AFF] font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Clock size={22} strokeWidth={currentTab === 'contas' ? 2.5 : 1.75} />
            <span className="text-[10px] mt-1">Contas</span>
          </button>

          {/* Aba Relatórios */}
          <button
            onClick={() => onTabChange('relatorios')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              currentTab === 'relatorios'
                ? 'text-[#007AFF] font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <PieChart size={22} strokeWidth={currentTab === 'relatorios' ? 2.5 : 1.75} />
            <span className="text-[10px] mt-1">Relatórios</span>
          </button>

          {/* Aba Ajustes */}
          <button
            onClick={() => onTabChange('ajustes')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              currentTab === 'ajustes'
                ? 'text-[#007AFF] font-medium'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <Settings size={22} strokeWidth={currentTab === 'ajustes' ? 2.5 : 1.75} />
            <span className="text-[10px] mt-1">Ajustes</span>
          </button>
        </div>
      </nav>
    </>
  );
};
