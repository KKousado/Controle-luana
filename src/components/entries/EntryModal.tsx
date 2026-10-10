import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BottomSheet } from '../common/BottomSheet';
import { CategoryIcon } from '../common/CategoryIcon';
import { TipoLancamento, FormaPagamento, StatusLancamento, Categoria, Lancamento } from '../../types';
import { parseMoedaInput, formatarMoedaDigitando } from '../../lib/utils';
import { Calendar, Tag, CreditCard, Repeat, AlertCircle, FileText } from 'lucide-react';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipo: TipoLancamento;
  editingLancamento?: Lancamento | null;
  onSuccess: () => void;
}

const SUGESTOES_ENTRADA = ['Balcão', 'Encomenda', 'WhatsApp', 'Instagram', 'iFood', 'Evento', 'Revenda'];
const SUGESTOES_SAIDA = ['Atacadão', 'Mercado Central', 'Embalagens Silva', 'Fornecedor Chocolate', 'Gás Ultragas', 'Energia Elétrica', 'Entrega Motoboy'];

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  onClose,
  tipo,
  editingLancamento,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [valorDisplay, setValorDisplay] = useState('R$ 0,00');
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [origem, setOrigem] = useState('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [status, setStatus] = useState<StatusLancamento>('pago');
  const [vencimento, setVencimento] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [observacao, setObservacao] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [historicoOrigens, setHistoricoOrigens] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar dados de categorias e histórico de origens
  useEffect(() => {
    if (!isOpen || !user) return;

    const carregarAuxiliares = async () => {
      // 1. Categorias do tipo selecionado
      const { data: cats } = await supabase
        .from('categorias')
        .select('*')
        .eq('tipo', tipo)
        .order('nome', { ascending: true });

      if (cats) setCategorias(cats);

      // 2. Histórico de origens utilizadas recentemente
      const { data: lancs } = await supabase
        .from('lancamentos')
        .select('origem')
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })
        .limit(20);

      if (lancs) {
        const unique = Array.from(new Set(lancs.map((l) => l.origem).filter(Boolean)));
        setHistoricoOrigens(unique);
      }
    };

    carregarAuxiliares();
  }, [isOpen, tipo, user]);

  // Preencher formulário ao abrir (novo ou edição)
  useEffect(() => {
    if (!isOpen) return;

    if (editingLancamento) {
      setValorDisplay(formatarMoedaDigitando(editingLancamento.valor));
      setData(editingLancamento.data);
      setDescricao(editingLancamento.descricao || '');
      setOrigem(editingLancamento.origem || '');
      setCategoriaId(editingLancamento.categoria_id || '');
      setFormaPagamento(editingLancamento.forma_pagamento || 'pix');
      setStatus(editingLancamento.status || 'pago');
      setVencimento(editingLancamento.vencimento || '');
      setRecorrente(editingLancamento.recorrente || false);
      setObservacao(editingLancamento.observacao || '');
    } else {
      setValorDisplay('R$ 0,00');
      setData(new Date().toISOString().split('T')[0]);
      setDescricao('');
      setOrigem('');
      setCategoriaId('');
      setFormaPagamento('pix');
      setStatus('pago');
      setVencimento('');
      setRecorrente(false);
      setObservacao('');
    }
  }, [isOpen, editingLancamento]);

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const valorNumerico = parseMoedaInput(raw);
    setValorDisplay(formatarMoedaDigitando(valorNumerico));
  };

  const sugestoes = tipo === 'entrada' ? SUGESTOES_ENTRADA : SUGESTOES_SAIDA;
  const listaOrigens = Array.from(new Set([...historicoOrigens, ...sugestoes]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const valorNumerico = parseMoedaInput(valorDisplay);
    if (valorNumerico <= 0) {
      showToast({ message: 'Informe um valor maior que R$ 0,00.', type: 'error' });
      return;
    }

    if (!origem.trim()) {
      showToast({ message: 'A origem é obrigatória.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: user.id,
        tipo,
        valor: valorNumerico,
        data,
        vencimento: status === 'pendente' && vencimento ? vencimento : null,
        descricao: descricao.trim() || (tipo === 'entrada' ? 'Receita' : 'Despesa'),
        origem: origem.trim(),
        categoria_id: categoriaId || null,
        forma_pagamento: formaPagamento,
        status,
        recorrente,
        observacao: observacao.trim() || null,
      };

      if (editingLancamento) {
        const { error } = await supabase
          .from('lancamentos')
          .update(payload)
          .eq('id', editingLancamento.id);

        if (error) throw error;
        showToast({ message: 'Lançamento atualizado com sucesso!', type: 'success' });
      } else {
        const { error } = await supabase.from('lancamentos').insert(payload);
        if (error) throw error;
        showToast({
          message: tipo === 'entrada' ? 'Entrada adicionada!' : 'Saída registrada!',
          type: 'success',
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast({ message: err?.message || 'Erro ao salvar lançamento.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingLancamento
          ? `Editar ${editingLancamento.tipo === 'entrada' ? 'Entrada' : 'Saída'}`
          : tipo === 'entrada'
          ? 'Nova Entrada 💰'
          : 'Nova Saída 💸'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo de Valor com visual Grande estilo iOS */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-[#2C2C2E]/60 border border-black/5 dark:border-white/5">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Valor do lançamento
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoFocus
            value={valorDisplay}
            onChange={handleValorChange}
            className={`text-3xl font-extrabold text-center bg-transparent focus:outline-none w-full ${
              tipo === 'entrada' ? 'text-[#34C759]' : 'text-[#FF3B30]'
            }`}
            placeholder="R$ 0,00"
          />
        </div>

        {/* Status: Recebido / Pendente Toggle */}
        <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-[#2C2C2E]">
          <button
            type="button"
            onClick={() => setStatus('pago')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === 'pago'
                ? 'bg-white dark:bg-[#3A3A3C] shadow-xs text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tipo === 'entrada' ? 'Recebido (Pago)' : 'Pago'}
          </button>
          <button
            type="button"
            onClick={() => setStatus('pendente')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === 'pendente'
                ? 'bg-white dark:bg-[#3A3A3C] shadow-xs text-[#FF9500]'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tipo === 'entrada' ? 'Pendente (A receber)' : 'Pendente (A pagar)'}
          </button>
        </div>

        {/* Origem com Autocompletar */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            {tipo === 'entrada' ? 'Origem da entrada *' : 'Origem do gasto *'}
          </label>
          <input
            type="text"
            required
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            placeholder={tipo === 'entrada' ? 'Ex.: Balcão, iFood, WhatsApp' : 'Ex.: Mercado, Atacadão, Gás'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
          {/* Tags de sugestões rápidas */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {listaOrigens.slice(0, 6).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setOrigem(item)}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                  origem === item
                    ? 'bg-[#007AFF] text-white border-transparent'
                    : 'bg-white dark:bg-[#2C2C2E] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <FileText size={14} className="text-gray-400" />
            Descrição (opcional)
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={tipo === 'entrada' ? 'Ex.: Bolo de Cenoura com Brigadeiro' : 'Ex.: 10kg Leite Moça e Ninho'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <Tag size={14} className="text-gray-400" />
            Categoria
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto no-scrollbar p-1">
            {categorias.map((cat) => {
              const isSelected = categoriaId === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategoriaId(cat.id)}
                  className={`flex items-center space-x-2 p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-[#007AFF] bg-blue-50/50 dark:bg-blue-900/20 text-[#007AFF]'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.cor || '#007AFF' }}
                  >
                    <CategoryIcon name={cat.icone} size={14} />
                  </div>
                  <span className="text-xs font-medium truncate">{cat.nome}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Data e Vencimento */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-gray-400" />
              Data
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none"
            />
          </div>

          {status === 'pendente' && (
            <div>
              <label className="block text-xs font-semibold text-[#FF9500] mb-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                Vencimento
              </label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <CreditCard size={14} className="text-gray-400" />
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['pix', 'dinheiro', 'debito', 'credito', 'transferencia'] as FormaPagamento[]).map((forma) => (
              <button
                type="button"
                key={forma}
                onClick={() => setFormaPagamento(forma)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-medium capitalize border transition-all ${
                  formaPagamento === forma
                    ? 'border-[#007AFF] bg-[#007AFF] text-white shadow-xs'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300'
                }`}
              >
                {forma}
              </button>
            ))}
          </div>
        </div>

        {/* Recorrente Switch */}
        {tipo === 'saida' && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Repeat size={16} className="text-[#AF52DE]" />
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">Gasto recorrente mensal</p>
                <p className="text-[10px] text-gray-500">Gera lançamento pendente todo mês automaticamente</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={recorrente}
              onChange={(e) => setRecorrente(e.target.checked)}
              className="w-5 h-5 rounded text-[#007AFF] focus:ring-0 cursor-pointer"
            />
          </div>
        )}

        {/* Observação */}
        <div>
          <input
            type="text"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observações adicionais (opcional)"
            className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none"
          />
        </div>

        {/* Botão de Salvar Pílula iOS */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-md active:scale-95 transition-all text-sm ${
            tipo === 'entrada' ? 'bg-[#34C759] shadow-green-500/20' : 'bg-[#FF3B30] shadow-red-500/20'
          }`}
        >
          {isSubmitting ? 'Salvando...' : editingLancamento ? 'Salvar Alterações' : `Adicionar ${tipo === 'entrada' ? 'Entrada' : 'Saída'}`}
        </button>
      </form>
    </BottomSheet>
  );
};
