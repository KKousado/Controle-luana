import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number): string {
  if (isNaN(valor)) return 'R$ 0,00';
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatarData(dataStr: string): string {
  if (!dataStr) return '';
  // Se for YYYY-MM-DD
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  const date = new Date(dataStr);
  return date.toLocaleDateString('pt-BR');
}

export function formatarDataExtenso(dataStr: string): string {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-').map(Number);
  const date = new Date(ano, mes - 1, dia);
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dataComparacao = new Date(ano, mes - 1, dia);
  
  const diffTime = dataComparacao.getTime() - hoje.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === -1) return 'Ontem';
  if (diffDays === 1) return 'Amanhã';

  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function getIntervaloPeriodo(
  periodo: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado',
  customInicio?: string,
  customFim?: string
): { inicio: string; fim: string; inicioAnterior: string; fimAnterior: string } {
  const hoje = new Date();
  const formatISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let dInicio = new Date(hoje);
  let dFim = new Date(hoje);

  if (periodo === 'hoje') {
    dInicio = new Date(hoje);
    dFim = new Date(hoje);
  } else if (periodo === 'semana') {
    const diaSemana = hoje.getDay(); // 0 = domingo
    const distanciaSegunda = diaSemana === 0 ? 6 : diaSemana - 1;
    dInicio.setDate(hoje.getDate() - distanciaSegunda);
    dFim = new Date(dInicio);
    dFim.setDate(dInicio.getDate() + 6);
  } else if (periodo === 'mes') {
    dInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    dFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  } else if (periodo === 'ano') {
    dInicio = new Date(hoje.getFullYear(), 0, 1);
    dFim = new Date(hoje.getFullYear(), 11, 31);
  } else if (periodo === 'personalizado' && customInicio && customFim) {
    const p1 = customInicio.split('-').map(Number);
    const p2 = customFim.split('-').map(Number);
    dInicio = new Date(p1[0], p1[1] - 1, p1[2]);
    dFim = new Date(p2[0], p2[1] - 1, p2[2]);
  }

  // Período anterior (mesma quantidade de dias)
  const diffDays = Math.round((dFim.getTime() - dInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dFimAnterior = new Date(dInicio);
  dFimAnterior.setDate(dInicio.getDate() - 1);
  const dInicioAnterior = new Date(dFimAnterior);
  dInicioAnterior.setDate(dFimAnterior.getDate() - diffDays + 1);

  return {
    inicio: formatISO(dInicio),
    fim: formatISO(dFim),
    inicioAnterior: formatISO(dInicioAnterior),
    fimAnterior: formatISO(dFimAnterior),
  };
}

export function parseMoedaInput(valorStr: string): number {
  if (!valorStr) return 0;
  const limpo = valorStr.replace(/\D/g, '');
  if (!limpo) return 0;
  return Number(limpo) / 100;
}

export function formatarMoedaDigitando(centavos: number): string {
  return (centavos).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}
