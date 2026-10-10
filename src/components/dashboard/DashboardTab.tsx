import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { PeriodoFiltro, ResumoPeriodo, Lancamento } from '../../types';
import { formatarMoeda, getIntervaloPeriodo, formatarData } from '../../lib/utils';
import { ExportModal } from '../common/ExportModal';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Share2,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface DashboardTabProps {
  onOpenNewModal: (tipo: 'entrada' | 'saida') => void;
  onNavigateToContas: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onOpenNewModal, onNavigateToContas }) => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const [customInicio, setCustomInicio] = useState('');
  const [customFim, setCustomFim] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [resumo, setResumo] = useState<ResumoPeriodo>({
    entradas: 0,
    saidas: 0,
    saldo: 0,
    margem: null,
  });

  const [gastosPorCat, setGastosPorCat] = useState<any[]>([]);
  const [serieTemporal, setSerieTemporal] = useState<any[]>([]);
  const [topOrigensGasto, setTopOrigensGasto] = useState<any[]>([]);
  const [entradasOrigem, setEntradasOrigem] = useState<any[]>([]);
  const [metaMes, setMetaMes] = useState<{ faturamento: number; limite: number } | null>(null);
  const [contasPendentes, setContasPendentes] = useState<Lancamento[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const [showExportModal, setShowExportModal] = useState(false);

  // Carregar todos os dados do Dashboard
  const carregarDashboard = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { inicio, fim, inicioAnterior, fimAnterior } = getIntervaloPeriodo(
        periodo,
        customInicio,
        customFim
      );

      // 1. Resumo do Período Atual (só status='pago')
      const { data: lancsAtual } = await supabase
        .from('lancamentos')
        .select('tipo, valor')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .gte('data', inicio)
        .lte('data', fim);

      let entAtual = 0;
      let saiAtual = 0;
      (lancsAtual || []).forEach((l) => {
        if (l.tipo === 'entrada') entAtual += Number(l.valor);
        if (l.tipo === 'saida') saiAtual += Number(l.valor);
      });

      // 2. Resumo do Período Anterior para Comparação
      const { data: lancsAnterior } = await supabase
        .from('lancamentos')
        .select('tipo, valor')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .gte('data', inicioAnterior)
        .lte('data', fimAnterior);

      let entAnt = 0;
      let saiAnt = 0;
      (lancsAnterior || []).forEach((l) => {
        if (l.tipo === 'entrada') entAnt += Number(l.valor);
        if (l.tipo === 'saida') saiAnt += Number(l.valor);
      });

      const saldoAtual = entAtual - saiAtual;
      const saldoAnt = entAnt - saiAnt;
      const margemAtual = entAtual > 0 ? ((saldoAtual / entAtual) * 100) : null;
      const margemAnt = entAnt > 0 ? (((entAnt - saiAnt) / entAnt) * 100) : null;

      const calcDelta = (atual: number, ant: number) => {
        if (ant === 0) return atual > 0 ? 100 : 0;
        return ((atual - ant) / ant) * 100;
      };

      setResumo({
        entradas: entAtual,
        saidas: saiAtual,
        saldo: saldoAtual,
        margem: margemAtual,
        entradasAnterior: entAnt,
        saidasAnterior: saiAnt,
        saldoAnterior: saldoAnt,
        margemAnterior: margemAnt,
        deltaEntradas: calcDelta(entAtual, entAnt),
        deltaSaidas: calcDelta(saiAtual, saiAnt),
        deltaSaldo: calcDelta(saldoAtual, saldoAnt),
      });

      // 3. Gastos por Categoria
      const { data: lancsComCat } = await supabase
        .from('lancamentos')
        .select('valor, categoria_id, categorias(nome, cor, icone)')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .eq('tipo', 'saida')
        .gte('data', inicio)
        .lte('data', fim);

      const catMap: Record<string, { nome: string; cor: string; total: number }> = {};
      (lancsComCat || []).forEach((item: any) => {
        const catNome = item.categorias?.nome || 'Outros / Sem categoria';
        const catCor = item.categorias?.cor || '#8E8E93';
        if (!catMap[catNome]) {
          catMap[catNome] = { nome: catNome, cor: catCor, total: 0 };
        }
        catMap[catNome].total += Number(item.valor);
      });

      const catArray = Object.values(catMap).sort((a, b) => b.total - a.total);
      setGastosPorCat(catArray);

      // 4. Top 5 Origens de Gastos
      const { data: lancsOrigensSaida } = await supabase
        .from('lancamentos')
        .select('origem, valor')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .eq('tipo', 'saida')
        .gte('data', inicio)
        .lte('data', fim);

      const origSaidaMap: Record<string, number> = {};
      (lancsOrigensSaida || []).forEach((l) => {
        origSaidaMap[l.origem] = (origSaidaMap[l.origem] || 0) + Number(l.valor);
      });
      const topSaidaArray = Object.entries(origSaidaMap)
        .map(([origem, total]) => ({ origem, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopOrigensGasto(topSaidaArray);

      // 5. Entradas por Origem (Canais de Venda)
      const { data: lancsOrigensEntrada } = await supabase
        .from('lancamentos')
        .select('origem, valor')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .eq('tipo', 'entrada')
        .gte('data', inicio)
        .lte('data', fim);

      const origEntMap: Record<string, number> = {};
      (lancsOrigensEntrada || []).forEach((l) => {
        origEntMap[l.origem] = (origEntMap[l.origem] || 0) + Number(l.valor);
      });
      const topEntArray = Object.entries(origEntMap)
        .map(([origem, total]) => ({
          origem,
          total,
          percentual: entAtual > 0 ? (total / entAtual) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);
      setEntradasOrigem(topEntArray);

      // 6. Série Temporal (Evolução no tempo)
      const { data: todosLancs } = await supabase
        .from('lancamentos')
        .select('data, tipo, valor')
        .eq('user_id', user.id)
        .eq('status', 'pago')
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: true });

      const diaMap: Record<string, { dataStr: string; entradas: number; saidas: number; acumulado: number }> = {};
      let acumuladoGeral = 0;

      (todosLancs || []).forEach((l) => {
        const d = l.data.slice(5); // MM-DD
        if (!diaMap[d]) {
          diaMap[d] = { dataStr: d, entradas: 0, saidas: 0, acumulado: 0 };
        }
        if (l.tipo === 'entrada') {
          diaMap[d].entradas += Number(l.valor);
          acumuladoGeral += Number(l.valor);
        } else {
          diaMap[d].saidas += Number(l.valor);
          acumuladoGeral -= Number(l.valor);
        }
        diaMap[d].acumulado = acumuladoGeral;
      });

      setSerieTemporal(Object.values(diaMap));

      // 7. Metas do Mês Atual
      const mesAtualRef = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const { data: metaData } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', mesAtualRef)
        .maybeSingle();

      if (metaData) {
        setMetaMes({
          faturamento: Number(metaData.meta_faturamento || 0),
          limite: Number(metaData.limite_gastos || 0),
        });
      } else {
        setMetaMes(null);
      }

      // 8. Contas Pendentes Próximas
      const { data: pendentes } = await supabase
        .from('lancamentos')
        .select('*, categorias(*)')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .order('vencimento', { ascending: true })
        .limit(4);

      if (pendentes) setContasPendentes(pendentes as Lancamento[]);

      // 9. Gerar Insights Automáticos Inteligentes
      const novosInsights: string[] = [];
      if (saiAtual > saiAnt && saiAnt > 0) {
        const percAumento = ((saiAtual - saiAnt) / saiAnt) * 100;
        novosInsights.push(`Os gastos aumentaram ${percAumento.toFixed(0)}% em relação ao período anterior.`);
      }
      if (topSaidaArray.length > 0) {
        novosInsights.push(`Seu maior gasto no período foi com "${topSaidaArray[0].origem}" (${formatarMoeda(topSaidaArray[0].total)}).`);
      }
      if (topEntArray.length > 0) {
        novosInsights.push(`O canal de venda que mais rendeu foi "${topEntArray[0].origem}", gerando ${topEntArray[0].percentual.toFixed(0)}% do faturamento.`);
      }
      if (margemAtual !== null && margemAtual >= 35) {
        novosInsights.push(`Excelente margem de lucro de ${margemAtual.toFixed(1)}%! Sua doceria está saudável.`);
      }

      setInsights(novosInsights);
    } catch (err) {
      console.error('Erro ao carregar métricas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, [user, periodo, customInicio, customFim]);

  const periodoLabels: Record<PeriodoFiltro, string> = {
    hoje: 'Hoje',
    semana: 'Esta Semana',
    mes: 'Este Mês',
    ano: 'Este Ano',
    personalizado: 'Personalizado',
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Bar de Período & Compartilhar */}
      <div className="flex items-center justify-between">
        {/* Segmented Control iOS de Período */}
        <div className="flex p-1 rounded-xl bg-gray-200/80 dark:bg-[#2C2C2E] overflow-x-auto no-scrollbar space-x-1">
          {(['hoje', 'semana', 'mes', 'ano'] as PeriodoFiltro[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                periodo === p
                  ? 'bg-white dark:bg-[#3A3A3C] text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {periodoLabels[p]}
            </button>
          ))}
        </div>

        {/* Botão Ação iOS Compartilhar Relatório */}
        <button
          onClick={() => setShowExportModal(true)}
          className="w-9 h-9 rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 flex items-center justify-center text-[#007AFF] shadow-xs active:scale-95 transition-transform"
          aria-label="Exportar e Compartilhar"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* ÁREA CAPTURÁVEL PARA EXPORTAÇÃO */}
      <div id="dashboard-capture-area" className="space-y-4">
        {/* CARDS PRINCIPAIS (iOS Inset Grid) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card Entradas */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Entradas</span>
              <span className="w-5 h-5 rounded-full bg-[#34C759]/15 text-[#34C759] flex items-center justify-center font-bold">
                ↓
              </span>
            </div>
            <p className="text-lg font-extrabold text-[#34C759] tracking-tight">
              {formatarMoeda(resumo.entradas)}
            </p>
            {resumo.deltaEntradas !== undefined && (
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-0.5">
                {resumo.deltaEntradas >= 0 ? (
                  <span className="text-[#34C759] font-medium">▲ +{resumo.deltaEntradas.toFixed(0)}%</span>
                ) : (
                  <span className="text-[#FF3B30] font-medium">▼ {resumo.deltaEntradas.toFixed(0)}%</span>
                )}
                <span> vs ant.</span>
              </p>
            )}
          </div>

          {/* Card Saídas */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Saídas</span>
              <span className="w-5 h-5 rounded-full bg-[#FF3B30]/15 text-[#FF3B30] flex items-center justify-center font-bold">
                ↑
              </span>
            </div>
            <p className="text-lg font-extrabold text-[#FF3B30] tracking-tight">
              {formatarMoeda(resumo.saidas)}
            </p>
            {resumo.deltaSaidas !== undefined && (
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-0.5">
                {resumo.deltaSaidas <= 0 ? (
                  <span className="text-[#34C759] font-medium">▼ {resumo.deltaSaidas.toFixed(0)}%</span>
                ) : (
                  <span className="text-[#FF3B30] font-medium">▲ +{resumo.deltaSaidas.toFixed(0)}%</span>
                )}
                <span> vs ant.</span>
              </p>
            )}
          </div>

          {/* Card Saldo (Sobrou / Faltou) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Saldo ({resumo.saldo >= 0 ? 'Sobrou' : 'Faltou'})</span>
              <DollarSign size={14} className="text-[#007AFF]" />
            </div>
            <p
              className={`text-lg font-extrabold tracking-tight ${
                resumo.saldo >= 0 ? 'text-gray-900 dark:text-white' : 'text-[#FF3B30]'
              }`}
            >
              {formatarMoeda(resumo.saldo)}
            </p>
            {resumo.deltaSaldo !== undefined && (
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-0.5">
                <span className={resumo.deltaSaldo >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                  {resumo.deltaSaldo >= 0 ? '▲ +' : '▼ '}
                  {resumo.deltaSaldo.toFixed(0)}%
                </span>
                <span> vs ant.</span>
              </p>
            )}
          </div>

          {/* Card Margem de Lucro % */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Margem %</span>
              <Percent size={14} className="text-[#AF52DE]" />
            </div>
            <p className="text-lg font-extrabold text-[#AF52DE] tracking-tight">
              {resumo.margem !== null ? `${resumo.margem.toFixed(1)}%` : '—'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {resumo.margem !== null && resumo.margem >= 30 ? 'Saudável 🌟' : 'Atenção ⚠️'}
            </p>
          </div>
        </div>

        {/* METAS DO MÊS (SE CONFIGURADAS) */}
        {metaMes && (metaMes.faturamento > 0 || metaMes.limite > 0) && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                Metas do Mês
              </h3>
            </div>

            {/* Progresso de Faturamento */}
            {metaMes.faturamento > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Faturamento da Loja</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatarMoeda(resumo.entradas)} / {formatarMoeda(metaMes.faturamento)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-[#34C759] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((resumo.entradas / metaMes.faturamento) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Limite de Gastos */}
            {metaMes.limite > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Limite de Gastos</span>
                  <span
                    className={`font-semibold ${
                      resumo.saidas >= metaMes.limite * 0.85 ? 'text-[#FF3B30]' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {formatarMoeda(resumo.saidas)} / {formatarMoeda(metaMes.limite)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      resumo.saidas >= metaMes.limite ? 'bg-[#FF3B30]' : 'bg-[#FF9500]'
                    }`}
                    style={{
                      width: `${Math.min((resumo.saidas / metaMes.limite) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS INTELIGENTES */}
        {insights.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-gray-800 dark:text-gray-200">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#FF9500] mb-1.5">
              <Sparkles size={14} />
              <span>Destaques da Doceria</span>
            </div>
            <ul className="text-xs space-y-1 pl-1 text-gray-600 dark:text-gray-300">
              {insights.map((ins, i) => (
                <li key={i} className="flex items-start space-x-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{ins}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* GRÁFICO 1: GASTOS POR CATEGORIA (DONUT) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Onde estou gastando? (Por Categoria)
          </h3>
          {gastosPorCat.length > 0 ? (
            <div className="flex flex-col items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gastosPorCat}
                      dataKey="total"
                      nameKey="nome"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                    >
                      {gastosPorCat.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor || '#007AFF'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => formatarMoeda(val)}
                      contentStyle={{
                        borderRadius: '12px',
                        backgroundColor: '#1C1C1E',
                        color: '#FFF',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda compacta com % */}
              <div className="w-full grid grid-cols-2 gap-2 mt-2">
                {gastosPorCat.slice(0, 6).map((cat) => {
                  const perc = resumo.saidas > 0 ? ((cat.total / resumo.saidas) * 100).toFixed(0) : '0';
                  return (
                    <div key={cat.nome} className="flex items-center space-x-2 text-xs truncate">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                      <span className="text-gray-600 dark:text-gray-400 truncate flex-1">{cat.nome}</span>
                      <span className="font-semibold text-gray-900 dark:text-white shrink-0">{perc}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-6 text-center">Nenhum gasto registrado neste período.</p>
          )}
        </div>

        {/* GRÁFICO 2: ENTRADAS X SAÍDAS NO TEMPO */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Evolução de Entradas e Saídas
          </h3>
          {serieTemporal.length > 0 ? (
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serieTemporal} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="dataStr" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(val: number) => formatarMoeda(val)}
                    contentStyle={{ borderRadius: '12px', backgroundColor: '#1C1C1E', color: '#FFF' }}
                  />
                  <Bar dataKey="entradas" fill="#34C759" radius={[4, 4, 0, 0]} name="Entradas" />
                  <Bar dataKey="saidas" fill="#FF3B30" radius={[4, 4, 0, 0]} name="Saídas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-6 text-center">Dados insuficientes para desenhar o gráfico temporal.</p>
          )}
        </div>

        {/* GRÁFICO 3: TOP 5 FORNECEDORES / ORIGENS DE GASTOS */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Top 5 Gastos por Origem (Fornecedores)
          </h3>
          {topOrigensGasto.length > 0 ? (
            <div className="space-y-2">
              {topOrigensGasto.map((item, idx) => (
                <div key={item.origem} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {idx + 1}. {item.origem}
                    </span>
                    <span className="font-bold text-[#FF3B30]">{formatarMoeda(item.total)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-[#FF3B30]/80 rounded-full"
                      style={{
                        width: `${resumo.saidas > 0 ? (item.total / resumo.saidas) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">Nenhum dado disponível.</p>
          )}
        </div>

        {/* GRÁFICO 4: ENTRADAS POR ORIGEM (CANAIS DE VENDA) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
            Qual canal rende mais? (Entradas por Origem)
          </h3>
          {entradasOrigem.length > 0 ? (
            <div className="space-y-2">
              {entradasOrigem.slice(0, 5).map((item) => (
                <div key={item.origem} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.origem}</span>
                    <span className="font-bold text-[#34C759]">
                      {formatarMoeda(item.total)} ({item.percentual.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full bg-[#34C759] rounded-full"
                      style={{ width: `${item.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4 text-center">Nenhuma venda registrada no período.</p>
          )}
        </div>

        {/* CONTAS PENDENTES PRÓXIMAS */}
        {contasPendentes.length > 0 && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Clock size={14} className="text-[#FF9500]" />
                Contas a Vencer
              </h3>
              <button
                onClick={onNavigateToContas}
                className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center"
              >
                Ver todas <ArrowRight size={12} className="ml-0.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {contasPendentes.map((conta) => (
                <div key={conta.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {conta.descricao || conta.origem}
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      {conta.tipo === 'entrada' ? 'A receber de' : 'A pagar para'} {conta.origem}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        conta.tipo === 'entrada' ? 'text-[#34C759]' : 'text-[#FF3B30]'
                      }`}
                    >
                      {formatarMoeda(conta.valor)}
                    </p>
                    <p className="text-[10px] text-[#FF9500]">
                      {conta.vencimento ? formatarData(conta.vencimento) : 'Sem data'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE EXPORTAÇÃO */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        targetElementId="dashboard-capture-area"
        reportTitle={`Doces da Luana · ${periodoLabels[periodo]}`}
        resumoData={{
          periodoTexto: periodoLabels[periodo],
          entradas: resumo.entradas,
          saidas: resumo.saidas,
          saldo: resumo.saldo,
          margem: resumo.margem,
          topGastos: topOrigensGasto,
        }}
      />
    </div>
  );
};
