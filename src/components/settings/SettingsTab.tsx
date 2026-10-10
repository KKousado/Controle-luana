import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Produto, TaxaOrigem, Meta } from '../../types';
import { formatarMoeda, parseMoedaInput, formatarMoedaDigitando } from '../../lib/utils';
import {
  User,
  Moon,
  Sun,
  Smartphone,
  Download,
  Upload,
  FileSpreadsheet,
  Cake,
  Percent,
  Target,
  Plus,
  Trash2,
} from 'lucide-react';

export const SettingsTab: React.FC = () => {
  const { user } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { showToast } = useToast();

  // Estados dos extras
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [novoProdNome, setNovoProdNome] = useState('');
  const [novoProdCusto, setNovoProdCusto] = useState('R$ 0,00');
  const [novoProdPreco, setNovoProdPreco] = useState('R$ 0,00');

  const [taxas, setTaxas] = useState<TaxaOrigem[]>([]);
  const [novaTaxaOrigem, setNovaTaxaOrigem] = useState('');
  const [novaTaxaPerc, setNovaTaxaPerc] = useState('');

  const [metaFaturamento, setMetaFaturamento] = useState('R$ 0,00');
  const [limiteGastos, setLimiteGastos] = useState('R$ 0,00');

  useEffect(() => {
    if (!user) return;

    const carregarConfiguracoes = async () => {
      // 1. Produtos
      const { data: prods } = await supabase.from('produtos').select('*').eq('user_id', user.id);
      if (prods) setProdutos(prods);

      // 2. Taxas por Origem
      const { data: txs } = await supabase.from('taxas_origem').select('*').eq('user_id', user.id);
      if (txs) setTaxas(txs);

      // 3. Metas do Mês
      const mesAtualRef = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const { data: m } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', mesAtualRef)
        .maybeSingle();

      if (m) {
        setMetaFaturamento(formatarMoedaDigitando(m.meta_faturamento || 0));
        setLimiteGastos(formatarMoedaDigitando(m.limite_gastos || 0));
      }
    };

    carregarConfiguracoes();
  }, [user]);

  // Salvar Metas do Mês
  const handleSalvarMetas = async () => {
    if (!user) return;
    try {
      const mesAtualRef = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const valFat = parseMoedaInput(metaFaturamento);
      const valLim = parseMoedaInput(limiteGastos);

      const { error } = await supabase.from('metas').upsert(
        {
          user_id: user.id,
          mes: mesAtualRef,
          meta_faturamento: valFat,
          limite_gastos: valLim,
        },
        { onConflict: 'user_id,mes' }
      );

      if (error) throw error;
      showToast({ message: 'Metas do mês salvas com sucesso!', type: 'success' });
    } catch (e: any) {
      showToast({ message: 'Erro ao salvar metas.', type: 'error' });
    }
  };

  // Salvar Produto
  const handleAdicionarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !novoProdNome.trim()) return;

    try {
      const custo = parseMoedaInput(novoProdCusto);
      const preco = parseMoedaInput(novoProdPreco);

      const { data, error } = await supabase
        .from('produtos')
        .insert({
          user_id: user.id,
          nome: novoProdNome.trim(),
          custo_ingredientes: custo,
          preco_venda: preco,
        })
        .select()
        .single();

      if (error) throw error;
      setProdutos([...produtos, data]);
      setNovoProdNome('');
      setNovoProdCusto('R$ 0,00');
      setNovoProdPreco('R$ 0,00');
      showToast({ message: 'Produto cadastrado!', type: 'success' });
    } catch (e: any) {
      showToast({ message: 'Erro ao salvar produto.', type: 'error' });
    }
  };

  const handleExcluirProduto = async (id: string) => {
    await supabase.from('produtos').delete().eq('id', id);
    setProdutos(produtos.filter((p) => p.id !== id));
    showToast({ message: 'Produto removido.', type: 'info' });
  };

  // Salvar Taxa
  const handleAdicionarTaxa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !novaTaxaOrigem.trim()) return;

    try {
      const perc = parseFloat(novaTaxaPerc.replace(',', '.')) || 0;
      const { data, error } = await supabase
        .from('taxas_origem')
        .insert({
          user_id: user.id,
          origem: novaTaxaOrigem.trim(),
          percentual: perc,
        })
        .select()
        .single();

      if (error) throw error;
      setTaxas([...taxas, data]);
      setNovaTaxaOrigem('');
      setNovaTaxaPerc('');
      showToast({ message: 'Taxa configurada!', type: 'success' });
    } catch (e: any) {
      showToast({ message: 'Erro ao salvar taxa.', type: 'error' });
    }
  };

  const handleExcluirTaxa = async (id: string) => {
    await supabase.from('taxas_origem').delete().eq('id', id);
    setTaxas(taxas.filter((t) => t.id !== id));
    showToast({ message: 'Taxa removida.', type: 'info' });
  };

  // Exportar Lançamentos em CSV para Excel Brasileiro (UTF-8 com BOM, delimitador ;)
  const handleExportarCSV = async () => {
    if (!user) return;
    try {
      const { data: lancs } = await supabase
        .from('lancamentos')
        .select('*, categorias(nome)')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (!lancs || lancs.length === 0) {
        showToast({ message: 'Nenhum dado para exportar.', type: 'info' });
        return;
      }

      const headers = ['Data;Tipo;Valor (R$);Origem;Categoria;Forma Pagamento;Status;Descricao;Observacao\n'];
      const rows = lancs.map((l: any) => {
        const valorFormatado = Number(l.valor).toFixed(2).replace('.', ',');
        const catNome = l.categorias?.nome || '';
        return `"${l.data}";"${l.tipo}";"${valorFormatado}";"${l.origem}";"${catNome}";"${l.forma_pagamento || ''}";"${l.status}";"${l.descricao || ''}";"${l.observacao || ''}"`;
      });

      // UTF-8 BOM: \uFEFF
      const csvContent = '\uFEFF' + headers.join('') + rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `lancamentos-doces-da-luana-${new Date().toISOString().split('T')[0]}.csv`);
      link.click();

      showToast({ message: 'Arquivo CSV baixado com sucesso!', type: 'success' });
    } catch (e) {
      showToast({ message: 'Erro ao gerar CSV.', type: 'error' });
    }
  };

  // Backup Completo JSON
  const handleBackupJSON = async () => {
    if (!user) return;
    try {
      const [lRes, cRes, mRes, pRes, tRes] = await Promise.all([
        supabase.from('lancamentos').select('*').eq('user_id', user.id),
        supabase.from('categorias').select('*').eq('user_id', user.id),
        supabase.from('metas').select('*').eq('user_id', user.id),
        supabase.from('produtos').select('*').eq('user_id', user.id),
        supabase.from('taxas_origem').select('*').eq('user_id', user.id),
      ]);

      const backupData = {
        app: 'Doces da Luana',
        version: '1.0.0',
        exported_at: new Date().toISOString(),
        data: {
          lancamentos: lRes.data || [],
          categorias: cRes.data || [],
          metas: mRes.data || [],
          produtos: pRes.data || [],
          taxas_origem: tRes.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `backup-doces-da-luana-${new Date().toISOString().split('T')[0]}.json`);
      link.click();

      showToast({ message: 'Backup JSON gerado com sucesso!', type: 'success' });
    } catch (e) {
      showToast({ message: 'Erro ao gerar backup JSON.', type: 'error' });
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* 1. PERFIL FIXO DA LUANA (SEM LOGOUT NEM MULTIUSUÁRIO) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF2D55] to-[#FF9500] flex items-center justify-center text-white text-lg font-bold shadow-xs">
          L
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Luana</h2>
          <p className="text-xs text-gray-400">Proprietária · Doces da Luana</p>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-[#34C759]">
          Conectada
        </span>
      </div>

      {/* 2. APARÊNCIA (TEMA) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Aparência do Aplicativo
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
              themeMode === 'light'
                ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20 text-[#007AFF]'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Sun size={18} />
            <span className="text-xs font-medium">Claro</span>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
              themeMode === 'dark'
                ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20 text-[#007AFF]'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Moon size={18} />
            <span className="text-xs font-medium">Escuro</span>
          </button>

          <button
            onClick={() => setThemeMode('auto')}
            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
              themeMode === 'auto'
                ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20 text-[#007AFF]'
                : 'border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Smartphone size={18} />
            <span className="text-xs font-medium">Automático</span>
          </button>
        </div>
      </div>

      {/* 3. METAS FINANCEIRAS DO MÊS */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Target size={16} className="text-[#007AFF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Metas do Mês Vigente
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Meta de Faturamento</label>
            <input
              type="text"
              inputMode="decimal"
              value={metaFaturamento}
              onChange={(e) => setMetaFaturamento(formatarMoedaDigitando(parseMoedaInput(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Limite Máximo de Gastos</label>
            <input
              type="text"
              inputMode="decimal"
              value={limiteGastos}
              onChange={(e) => setLimiteGastos(formatarMoedaDigitando(parseMoedaInput(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleSalvarMetas}
          className="w-full py-2.5 rounded-xl bg-[#007AFF] text-white text-xs font-semibold shadow-xs active:scale-98"
        >
          Salvar Metas
        </button>
      </div>

      {/* 4. PRECIFICAÇÃO DE PRODUTOS & SUGESTÃO DE PREÇO */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Cake size={16} className="text-[#FF2D55]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Produtos & Margens (Doceria)
          </h3>
        </div>

        {/* Formulário Novo Produto */}
        <form onSubmit={handleAdicionarProduto} className="space-y-2 p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E]/60 border border-gray-100 dark:border-gray-800">
          <input
            type="text"
            required
            value={novoProdNome}
            onChange={(e) => setNovoProdNome(e.target.value)}
            placeholder="Nome (ex.: Bolo Vulcão Ninho com Nutella)"
            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-400">Custo Ingredientes</label>
              <input
                type="text"
                value={novoProdCusto}
                onChange={(e) => setNovoProdCusto(formatarMoedaDigitando(parseMoedaInput(e.target.value)))}
                className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400">Preço de Venda</label>
              <input
                type="text"
                value={novoProdPreco}
                onChange={(e) => setNovoProdPreco(formatarMoedaDigitando(parseMoedaInput(e.target.value)))}
                className="w-full px-2 py-1 rounded-lg bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold"
          >
            Cadastrar Produto
          </button>
        </form>

        {/* Lista de Produtos Cadastrados */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-48 overflow-y-auto no-scrollbar">
          {produtos.map((p) => {
            const margem = p.preco_venda > 0 ? (((p.preco_venda - p.custo_ingredientes) / p.preco_venda) * 100) : 0;
            const sugestaoPreco = p.custo_ingredientes > 0 ? (p.custo_ingredientes / 0.5) : 0; // Margem alvo 50%

            return (
              <div key={p.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{p.nome}</p>
                  <p className="text-[11px] text-gray-400">
                    Custo: {formatarMoeda(p.custo_ingredientes)} • Margem: <span className="text-[#34C759] font-semibold">{margem.toFixed(0)}%</span>
                  </p>
                  <p className="text-[10px] text-[#007AFF]">
                    Sugestão (50% margem): {formatarMoeda(sugestaoPreco)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm">{formatarMoeda(p.preco_venda)}</span>
                  <button onClick={() => handleExcluirProduto(p.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TAXAS DE CANAIS (iFood, Cartão de Crédito) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Percent size={16} className="text-[#FF9500]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Taxas por Origem (iFood, Cartão)
          </h3>
        </div>

        <form onSubmit={handleAdicionarTaxa} className="flex space-x-2">
          <input
            type="text"
            required
            value={novaTaxaOrigem}
            onChange={(e) => setNovaTaxaOrigem(e.target.value)}
            placeholder="Ex.: iFood / Stone"
            className="flex-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-xs"
          />
          <input
            type="text"
            required
            value={novaTaxaPerc}
            onChange={(e) => setNovaTaxaPerc(e.target.value)}
            placeholder="%"
            className="w-16 px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-xs text-center"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#007AFF] text-white text-xs font-semibold"
          >
            Adicionar
          </button>
        </form>

        <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
          {taxas.map((tx) => (
            <div key={tx.id} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg bg-gray-50 dark:bg-[#2C2C2E]">
              <span className="font-medium text-gray-700 dark:text-gray-300">{tx.origem}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[#FF9500]">{tx.percentual}%</span>
                <button onClick={() => handleExcluirTaxa(tx.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. DADOS, CSV E BACKUP */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Dados e Exportações
        </h3>

        <div className="space-y-2">
          {/* Exportar CSV */}
          <button
            onClick={handleExportarCSV}
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-800 dark:text-gray-200 active:scale-98 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <FileSpreadsheet size={18} className="text-[#34C759]" />
              <span>Exportar Planilha Excel (.CSV)</span>
            </div>
            <Download size={14} className="text-gray-400" />
          </button>

          {/* Backup JSON */}
          <button
            onClick={handleBackupJSON}
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-semibold text-gray-800 dark:text-gray-200 active:scale-98 transition-all"
          >
            <div className="flex items-center space-x-2.5">
              <Download size={18} className="text-[#007AFF]" />
              <span>Fazer Backup Completo (.JSON)</span>
            </div>
            <Download size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
