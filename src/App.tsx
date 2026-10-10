import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { SplashScreen } from './components/common/SplashScreen';
import { Header } from './components/common/Header';
import { TabBar, TabType } from './components/navigation/TabBar';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { EntriesTab } from './components/entries/EntriesTab';
import { ContasTab } from './components/contas/ContasTab';
import { ReportsTab } from './components/reports/ReportsTab';
import { SettingsTab } from './components/settings/SettingsTab';
import { EntryModal } from './components/entries/EntryModal';
import { TipoLancamento } from './types';

export const App: React.FC = () => {
  const { isLoading, error, retryAuth } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('inicio');

  // Controle do modal rápido de entrada / saída
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<TipoLancamento>('entrada');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Splash Screen de carregamento ou erro elegante com botão "Tentar novamente"
  if (isLoading || error) {
    return <SplashScreen error={error} onRetry={retryAuth} />;
  }

  const handleOpenNewModal = (tipo: TipoLancamento) => {
    setModalTipo(tipo);
    setIsEntryModalOpen(true);
  };

  const getHeaderProps = () => {
    switch (currentTab) {
      case 'inicio':
        return { title: 'Olá, Luana 👋', subtitle: 'Doces da Luana · Controle Financeiro' };
      case 'lancamentos':
        return { title: 'Extrato', subtitle: 'Histórico de Entradas e Saídas' };
      case 'contas':
        return { title: 'Contas', subtitle: 'Contas a Pagar e a Receber' };
      case 'relatorios':
        return { title: 'Relatórios', subtitle: 'Desempenho e Comparativos' };
      case 'ajustes':
        return { title: 'Ajustes', subtitle: 'Configurações e Ferramentas' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black text-[#1C1C1E] dark:text-[#F2F2F7] flex flex-col antialiased selection:bg-[#FF9500]/30">
      {/* Header Fixo Transparente com Efeito de Vidro */}
      <Header {...getHeaderProps()} />

      {/* Conteúdo Central Responsivo Mobile-First */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-3 pb-24 overflow-x-hidden">
        {currentTab === 'inicio' && (
          <DashboardTab
            key={`dashboard-${refreshTrigger}`}
            onOpenNewModal={handleOpenNewModal}
            onNavigateToContas={() => setCurrentTab('contas')}
          />
        )}

        {currentTab === 'lancamentos' && (
          <EntriesTab key={`entries-${refreshTrigger}`} />
        )}

        {currentTab === 'contas' && (
          <ContasTab key={`contas-${refreshTrigger}`} />
        )}

        {currentTab === 'relatorios' && (
          <ReportsTab key={`reports-${refreshTrigger}`} />
        )}

        {currentTab === 'ajustes' && (
          <SettingsTab key={`settings-${refreshTrigger}`} />
        )}
      </main>

      {/* Barra de Navegação Inferior iOS */}
      <TabBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewModal={handleOpenNewModal}
      />

      {/* Modal Bottom Sheet Rápido */}
      <EntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        tipo={modalTipo}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </div>
  );
};

export default App;
