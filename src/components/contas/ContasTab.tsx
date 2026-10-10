import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Lancamento } from '../../types';
import { formatarMoeda, formatarData } from '../../lib/utils';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const ContasTab: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [pendentes, setPendentes] = useState<Lancamento[]>([]);
  const [subAba, setSubAba] = useState<'a_receber' | 'a_pagar'>('a_receber');
  const [isLoading, setIsLoading] = useState(true);

  const carregarContas = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('lancamentos')
        .select('*, categorias(*)')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .order('vencimento', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setPendentes((data as Lancamento[]) || []);
    } catch (e: any) {
      console.error(e);
      showToast({ message: 'Erro ao carregar contas pendentes.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarContas();
  }, [user]);

  const handleBaixarConta = async (conta: Lancamento) => {
    try {
      const { error } = await supabase
        .from('lancamentos')
        .update({ status: 'pago' })
        .eq('id', conta.id);

      if (error) throw error;
      showToast({
        message: conta.tipo === 'entrada' ? 'Recebimento confirmado!' : 'Pagamento liquidado!',
        type: 'success',
      });
      carregarContas();
    } catch (err: any) {
      showToast({ message: 'Erro ao liquidar conta.', type: 'error' });
    }
  };

  const contasFiltradas = pendentes.filter((c) =>
    subAba === 'a_receber' ? c.tipo === 'entrada' : c.tipo === 'saida'
  );

  const totalAReceber = pendentes
    .filter((c) => c.tipo === 'entrada')
    .reduce((s, c) => s + Number(c.valor), 0);

  const totalAPagar = pendentes
    .filter((c) => c.tipo === 'saida')
    .reduce((s, c) => s + Number(c.valor), 0);

  // Status visual do vencimento
  const getStatusVencimento = (vencStr?: string | null) => {
    if (!vencStr) return { label: 'Sem data de vencimento', color: 'text-gray-400', bg: 'bg-gray-100' };

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const [ano, mes, dia] = vencStr.split('-').map(Number);
    const venc = new Date(ano, mes - 1, dia);

    const diff = Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) {
      return { label: `Atrasada há ${Math.abs(diff)} dias`, color: 'text-[#FF3B30]', bg: 'bg-red-50 dark:bg-red-950/20' };
    }
    if (diff === 0) {
      return { label: 'Vence hoje!', color: 'text-[#FF9500]', bg: 'bg-orange-50 dark:bg-orange-950/20' };
    }
    if (diff === 1) {
      return { label: 'Vence amanhã', color: 'text-[#FFCC00]', bg: 'bg-yellow-50 dark:bg-yellow-950/20' };
    }
    return { label: `Vence em ${diff} dias`, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800' };
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Resumo Rápido */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total a Receber</p>
          <p className="text-base font-extrabold text-[#34C759] mt-0.5">
            {formatarMoeda(totalAReceber)}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total a Pagar</p>
          <p className="text-base font-extrabold text-[#FF3B30] mt-0.5">
            {formatarMoeda(totalAPagar)}
          </p>
        </div>
      </div>

      {/* Segmented Control iOS */}
      <div className="flex p-1 rounded-xl bg-gray-200/80 dark:bg-[#2C2C2E]">
        <button
          onClick={() => setSubAba('a_receber')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            subAba === 'a_receber'
              ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          A Receber ({pendentes.filter((c) => c.tipo === 'entrada').length})
        </button>
        <button
          onClick={() => setSubAba('a_pagar')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            subAba === 'a_pagar'
              ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-xs'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          A Pagar ({pendentes.filter((c) => c.tipo === 'saida').length})
        </button>
      </div>

      {/* Lista de Contas */}
      {contasFiltradas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Nenhuma conta {subAba === 'a_receber' ? 'a receber' : 'a pagar'} pendente!
          </p>
          <p className="text-xs text-gray-400 mt-1">Tudo em dia na confeitaria 🎉</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contasFiltradas.map((conta) => {
            const statusVenc = getStatusVencimento(conta.vencimento);

            return (
              <div
                key={conta.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex items-center justify-between space-x-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {conta.descricao || (conta.tipo === 'entrada' ? 'Receita pendente' : 'Despesa pendente')}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {conta.origem} • {conta.forma_pagamento || 'pix'}
                  </p>

                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusVenc.bg} ${statusVenc.color}`}
                    >
                      {statusVenc.label}
                    </span>
                    {conta.vencimento && (
                      <span className="text-[11px] text-gray-400">
                        ({formatarData(conta.vencimento)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2 shrink-0">
                  <span
                    className={`text-base font-extrabold ${
                      conta.tipo === 'entrada' ? 'text-[#34C759]' : 'text-[#FF3B30]'
                    }`}
                  >
                    {formatarMoeda(conta.valor)}
                  </span>

                  <button
                    onClick={() => handleBaixarConta(conta)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#007AFF] text-white text-xs font-semibold shadow-xs active:scale-95 transition-all"
                  >
                    <CheckCircle2 size={13} />
                    <span>{conta.tipo === 'entrada' ? 'Recebi' : 'Paguei'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
