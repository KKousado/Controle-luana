export type TipoLancamento = 'entrada' | 'saida';
export type FormaPagamento = 'pix' | 'dinheiro' | 'debito' | 'credito' | 'transferencia';
export type StatusLancamento = 'pago' | 'pendente';

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  tipo: TipoLancamento;
  cor: string;
  icone: string;
  created_at?: string;
}

export interface Lancamento {
  id: string;
  user_id: string;
  tipo: TipoLancamento;
  valor: number;
  data: string; // YYYY-MM-DD
  vencimento?: string | null;
  descricao?: string | null;
  origem: string;
  categoria_id?: string | null;
  forma_pagamento?: FormaPagamento | null;
  status: StatusLancamento;
  recorrente: boolean;
  observacao?: string | null;
  created_at?: string;
  categoria?: Categoria | null;
}

export interface Meta {
  id: string;
  user_id: string;
  mes: string; // YYYY-MM-01
  meta_faturamento: number;
  limite_gastos: number;
}

export interface Produto {
  id: string;
  user_id: string;
  nome: string;
  custo_ingredientes: number;
  preco_venda: number;
  created_at?: string;
}

export interface TaxaOrigem {
  id: string;
  user_id: string;
  origem: string;
  percentual: number;
}

export type PeriodoFiltro = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';

export interface ResumoPeriodo {
  entradas: number;
  saidas: number;
  saldo: number;
  margem: number | null;
  entradasAnterior?: number;
  saidasAnterior?: number;
  saldoAnterior?: number;
  margemAnterior?: number | null;
  deltaEntradas?: number; // %
  deltaSaidas?: number; // %
  deltaSaldo?: number; // %
}
