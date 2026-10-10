import React, { useState } from 'react';
import { Lancamento } from '../../types';
import { formatarMoeda, formatarDataExtenso, formatarData } from '../../lib/utils';
import { CategoryIcon } from '../common/CategoryIcon';
import { Trash2, Edit3, CheckCircle2, Clock, MoreVertical, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface EntryListProps {
  lancamentos: Lancamento[];
  onEdit: (lancamento: Lancamento) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (lancamento: Lancamento) => void;
}

export const EntryList: React.FC<EntryListProps> = ({
  lancamentos,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const [selectedItemForMenu, setSelectedItemForMenu] = useState<string | null>(null);

  if (lancamentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-[#1C1C1E] flex items-center justify-center mb-3 text-gray-400">
          🧁
        </div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Nenhum lançamento no período
        </p>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          Toque no botão '+' para adicionar uma venda, encomenda ou despesa.
        </p>
      </div>
    );
  }

  // Agrupar lançamentos por dia (estilo Inset Grouped List do iOS)
  const gruposPorData = lancamentos.reduce<Record<string, Lancamento[]>>((acc, item) => {
    const dataKey = item.data;
    if (!acc[dataKey]) acc[dataKey] = [];
    acc[dataKey].push(item);
    return acc;
  }, {});

  const datasOrdenadas = Object.keys(gruposPorData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {datasOrdenadas.map((dataKey) => {
        const itens = gruposPorData[dataKey];
        const totalDia = itens.reduce((s, i) => {
          if (i.status !== 'pago') return s;
          return i.tipo === 'entrada' ? s + i.valor : s - i.valor;
        }, 0);

        return (
          <div key={dataKey} className="space-y-1.5">
            {/* Header da Seção do Dia */}
            <div className="flex items-center justify-between px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span>{formatarDataExtenso(dataKey)} · {formatarData(dataKey)}</span>
              <span className={`text-[11px] font-medium ${totalDia >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                {totalDia >= 0 ? `+${formatarMoeda(totalDia)}` : formatarMoeda(totalDia)}
              </span>
            </div>

            {/* Inset Grouped Card */}
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xs border border-black/5 dark:border-white/5 divide-y divide-gray-100 dark:divide-gray-800/60 overflow-hidden">
              {itens.map((item) => {
                const isEntrada = item.tipo === 'entrada';
                const isPendente = item.status === 'pendente';
                const showMenu = selectedItemForMenu === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-[#2C2C2E]/40 transition-colors relative"
                  >
                    {/* Lado Esquerdo: Ícone + Info */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Ícone colorido da Categoria */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                        style={{
                          backgroundColor: item.categoria?.cor
                            ? `${item.categoria.cor}20`
                            : isEntrada
                            ? '#34C75920'
                            : '#FF3B3020',
                          color: item.categoria?.cor || (isEntrada ? '#34C759' : '#FF3B30'),
                        }}
                      >
                        <CategoryIcon
                          name={item.categoria?.icone || (isEntrada ? 'cake' : 'tag')}
                          size={18}
                        />
                      </div>

                      {/* Descrição e Origem */}
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {item.descricao || (isEntrada ? 'Receita' : 'Despesa')}
                          </p>
                          {item.recorrente && (
                            <span className="text-[9px] bg-purple-100 dark:bg-purple-900/40 text-[#AF52DE] px-1.5 py-0.5 rounded-full font-bold">
                              REC
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          <span className="font-medium text-gray-600 dark:text-gray-300">
                            {item.origem}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{item.forma_pagamento || 'pix'}</span>
                          {isPendente && item.vencimento && (
                            <>
                              <span>•</span>
                              <span className="text-[#FF9500] font-medium flex items-center gap-0.5">
                                <Clock size={11} />
                                {formatarData(item.vencimento)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lado Direito: Valor + Ações */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold tracking-tight ${
                            isPendente
                              ? 'text-[#FF9500]'
                              : isEntrada
                              ? 'text-[#34C759]'
                              : 'text-[#FF3B30]'
                          }`}
                        >
                          {isEntrada ? `+ ${formatarMoeda(item.valor)}` : `- ${formatarMoeda(item.valor)}`}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {isPendente ? 'Pendente' : 'Pago'}
                        </p>
                      </div>

                      {/* Menu de Ações Rápido */}
                      <button
                        onClick={() => setSelectedItemForMenu(showMenu ? null : item.id)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        aria-label="Opções"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Popover Menu Flutuante de Ação */}
                    {showMenu && (
                      <div
                        className="absolute right-4 top-12 z-20 bg-white dark:bg-[#2C2C2E] shadow-xl rounded-xl border border-black/10 dark:border-white/10 p-1 flex flex-col space-y-1 animate-fade-in"
                        onClick={() => setSelectedItemForMenu(null)}
                      >
                        <button
                          onClick={() => onToggleStatus(item)}
                          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg text-left"
                        >
                          <CheckCircle2 size={13} className="text-[#34C759]" />
                          <span>Marcar como {isPendente ? 'Pago' : 'Pendente'}</span>
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3A3A3C] rounded-lg text-left"
                        >
                          <Edit3 size={13} className="text-[#007AFF]" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={() => onDelete(item.id)}
                          className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-[#FF3B30] hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-left"
                        >
                          <Trash2 size={13} />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
