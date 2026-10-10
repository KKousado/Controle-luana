import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatarMoeda } from '../../lib/utils';
import { ExportModal } from '../common/ExportModal';
import { Share2, Calendar, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const ReportsTab: React.FC = () => {
  const { user } = useAuth();
  const [comparativoMeses, setComparativoMeses] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [mesAtual, setMesAtual] = useState<any>(null);
  const [mesAnterior, setMesAnterior] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const carregarRelatorioMensal = async () => {
      // Buscar últimos 6 meses para comparativo
      const hoje = new Date();
      const mesesList = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const fimD = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const inicioStr = d.toISOString().split('T')[0];
        const fimStr = fimD.toISOString().split('T')[0];
        const label = d.toLocaleDateString('pt-BR', { month: 'short' });

        const { data: lancs } = await supabase
          .from('lancamentos')
          .select('tipo, valor')
          .eq('user_id', user.id)
          .eq('status', 'pago')
          .gte('data', inicioStr)
          .lte('data', fimStr);

        let entradas = 0;
        let saidas = 0;
        (lancs || []).forEach((l) => {
          if (l.tipo === 'entrada') entradas += Number(l.valor);
          if (l.tipo === 'saida') saidas += Number(l.valor);
        });

        mesesList.push({
          mes: label,
          anoMes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          entradas,
          saidas,
          saldo: entradas - saidas,
          margem: entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0,
        });
      }

      setComparativoMeses(mesesList);
      if (mesesList.length >= 2) {
        setMesAtual(mesesList[mesesList.length - 1]);
        setMesAnterior(mesesList[mesesList.length - 2]);
      }
    };

    carregarRelatorioMensal();
  }, [user]);

  return (
    <div className="space-y-4 pb-20">
      {/* Botão de Exportar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 text-xs font-semibold text-[#007AFF] shadow-xs active:scale-95"
        >
          <Share2 size={13} />
          <span>Exportar Relatório</span>
        </button>
      </div>

      <div id="reports-capture-area" className="space-y-4">
        {/* Card Destaque Comparativo */}
        {mesAtual && mesAnterior && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Comparativo Mensal ({mesAnterior.mes} vs {mesAtual.mes})
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Entradas */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400">Faturamento</span>
                <p className="text-base font-bold text-[#34C759]">
                  {formatarMoeda(mesAtual.entradas)}
                </p>
                <p className="text-[11px] text-gray-400">
                  Anterior: {formatarMoeda(mesAnterior.entradas)}
                </p>
              </div>

              {/* Saídas */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400">Gastos</span>
                <p className="text-base font-bold text-[#FF3B30]">
                  {formatarMoeda(mesAtual.saidas)}
                </p>
                <p className="text-[11px] text-gray-400">
                  Anterior: {formatarMoeda(mesAnterior.saidas)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico Comparativo 6 Meses */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Histórico dos Últimos 6 Meses
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparativoMeses} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(val: number) => formatarMoeda(val)}
                  contentStyle={{ borderRadius: '12px', backgroundColor: '#1C1C1E', color: '#FFF' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="entradas" fill="#34C759" name="Entradas" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#FF3B30" name="Saídas" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Resumo Mensal */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs overflow-x-auto no-scrollbar">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Tabela de Resultados
          </h3>
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400">
                <th className="pb-2 font-medium">Mês</th>
                <th className="pb-2 font-medium text-right">Entradas</th>
                <th className="pb-2 font-medium text-right">Saídas</th>
                <th className="pb-2 font-medium text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {comparativoMeses.map((m) => (
                <tr key={m.anoMes} className="py-2">
                  <td className="py-2.5 font-bold uppercase">{m.mes}</td>
                  <td className="py-2.5 text-right font-medium text-[#34C759]">
                    {formatarMoeda(m.entradas)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-[#FF3B30]">
                    {formatarMoeda(m.saidas)}
                  </td>
                  <td
                    className={`py-2.5 text-right font-bold ${
                      m.saldo >= 0 ? 'text-gray-900 dark:text-white' : 'text-[#FF3B30]'
                    }`}
                  >
                    {formatarMoeda(m.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        targetElementId="reports-capture-area"
        reportTitle="Doces da Luana · Comparativo Semestral"
      />
    </div>
  );
};
