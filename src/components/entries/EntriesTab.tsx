import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Lancamento, TipoLancamento } from '../../types';
import { EntryList } from './EntryList';
import { EntryModal } from './EntryModal';
import { useToast } from '../../context/ToastContext';
import { Search, Filter, Plus, Calendar, ArrowUpDown } from 'lucide-react';

export const EntriesTab: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entrada' | 'saida'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pago' | 'pendente'>('todos');

  // Modal de edição e criação
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<TipoLancamento>('entrada');
  const [editingItem, setEditingItem] = useState<Lancamento | null>(null);

  const carregarLancamentos = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      let query = supabase
        .from('lancamentos')
        .select('*, categorias(*)')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (filtroTipo !== 'todos') {
        query = query.eq('tipo', filtroTipo);
      }
      if (filtroStatus !== 'todos') {
        query = query.eq('status', filtroStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLancamentos((data as Lancamento[]) || []);
    } catch (err: any) {
      console.error(err);
      showToast({ message: 'Erro ao carregar extrato de lançamentos.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarLancamentos();
  }, [user, filtroTipo, filtroStatus]);

  // Excluir com suporte a Desfazer (Toast Undo)
  const handleDelete = async (id: string) => {
    const itemToDelete = lancamentos.find((l) => l.id === id);
    if (!itemToDelete) return;

    // Otimista: remover da lista imediatamente
    setLancamentos((prev) => prev.filter((l) => l.id !== id));

    let undone = false;
    showToast({
      message: 'Lançamento excluído.',
      type: 'info',
      action: {
        label: 'Desfazer',
        onClick: async () => {
          undone = true;
          setLancamentos((prev) => [itemToDelete, ...prev]);
        },
      },
      duration: 4500,
    });

    // Se não desfeito após 4.5s, deletar do banco
    setTimeout(async () => {
      if (!undone) {
        await supabase.from('lancamentos').delete().eq('id', id);
      }
    }, 4600);
  };

  const handleToggleStatus = async (item: Lancamento) => {
    const novoStatus = item.status === 'pago' ? 'pendente' : 'pago';
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({ status: novoStatus })
        .eq('id', item.id);

      if (error) throw error;
      showToast({
        message: `Lançamento marcado como ${novoStatus === 'pago' ? 'Pago' : 'Pendente'}.`,
        type: 'success',
      });
      carregarLancamentos();
    } catch (e: any) {
      showToast({ message: 'Erro ao alterar status.', type: 'error' });
    }
  };

  const lancamentosFiltrados = lancamentos.filter((l) => {
    if (!busca.trim()) return true;
    const termo = busca.toLowerCase();
    return (
      l.descricao?.toLowerCase().includes(termo) ||
      l.origem.toLowerCase().includes(termo) ||
      l.categoria?.nome.toLowerCase().includes(termo) ||
      l.observacao?.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Barra de Pesquisa Estilo iOS */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar descrição, origem, categoria..."
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-200/60 dark:bg-[#2C2C2E] text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
        />
      </div>

      {/* Segmented Control iOS Filtro Tipo */}
      <div className="flex p-1 rounded-xl bg-gray-200/80 dark:bg-[#2C2C2E]">
        <button
          onClick={() => setFiltroTipo('todos')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filtroTipo === 'todos'
              ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFiltroTipo('entrada')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filtroTipo === 'entrada'
              ? 'bg-white dark:bg-[#3A3A3C] text-[#34C759] shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Entradas
        </button>
        <button
          onClick={() => setFiltroTipo('saida')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            filtroTipo === 'saida'
              ? 'bg-white dark:bg-[#3A3A3C] text-[#FF3B30] shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Saídas
        </button>
      </div>

      {/* Filtro secundário por Status */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-gray-400 font-medium">Status:</span>
        <div className="flex space-x-1.5">
          {(['todos', 'pago', 'pendente'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st)}
              className={`px-2.5 py-1 rounded-full capitalize text-[11px] font-medium border transition-all ${
                filtroStatus === st
                  ? 'bg-[#007AFF] text-white border-transparent'
                  : 'bg-white dark:bg-[#1C1C1E] text-gray-500 border-gray-200 dark:border-gray-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Agrupada */}
      {isLoading ? (
        <div className="space-y-3 pt-4">
          <div className="h-16 bg-gray-200 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-800/50 rounded-2xl animate-pulse" />
        </div>
      ) : (
        <EntryList
          lancamentos={lancamentosFiltrados}
          onEdit={(item) => {
            setEditingItem(item);
            setModalTipo(item.tipo);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Modal de Entrada / Saída */}
      <EntryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        tipo={modalTipo}
        editingLancamento={editingItem}
        onSuccess={carregarLancamentos}
      />
    </div>
  );
};
