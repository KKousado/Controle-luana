import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BottomSheet } from '../common/BottomSheet';
import { useToast } from '../../context/ToastContext';
import { Download, FileText, Share2, MessageCircle, Check } from 'lucide-react';
import { formatarMoeda } from '../../lib/utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetElementId: string;
  reportTitle?: string;
  resumoData?: {
    periodoTexto: string;
    entradas: number;
    saidas: number;
    saldo: number;
    margem: number | null;
    topGastos?: { origem: string; total: number }[];
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  targetElementId,
  reportTitle = 'Doces da Luana · Relatório Financeiro',
  resumoData,
}) => {
  const { showToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // 1. Exportar como Imagem PNG em Alta Resolução (Scale 2.5)
  const handleExportPNG = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(targetElementId);
      if (!element) throw new Error('Elemento não encontrado para captura.');

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#000000' : '#F2F2F7',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Doces-da-Luana-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imgData;
      link.click();

      showToast({ message: 'Imagem baixada com sucesso!', type: 'success' });
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast({ message: 'Erro ao gerar imagem PNG.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Exportar como Documento PDF A4 Formatado
  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(targetElementId);
      if (!element) throw new Error('Elemento não encontrado para captura.');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      // Cabeçalho institucional Luana
      pdf.setFontSize(16);
      pdf.setTextColor(40, 40, 40);
      pdf.text(reportTitle, 14, 15);
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 21);

      pdf.addImage(imgData, 'JPEG', 10, 26, imgWidth, Math.min(imgHeight, pageHeight - 35));

      pdf.save(`Relatorio-Doces-da-Luana-${new Date().toISOString().split('T')[0]}.pdf`);

      showToast({ message: 'PDF gerado com sucesso!', type: 'success' });
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast({ message: 'Erro ao exportar PDF.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Compartilhamento Direto / WhatsApp
  const handleShareWhatsApp = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById(targetElementId);
      let sharedFile = false;

      // Se o navegador suporta Web Share com arquivos (ex.: iPhone Safari)
      if (element && navigator.canShare) {
        try {
          const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#F2F2F7' });
          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));

          if (blob) {
            const file = new File([blob], 'relatorio-doces-da-luana.png', { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Relatório Doces da Luana',
                text: 'Resumo financeiro da Doces da Luana',
                files: [file],
              });
              sharedFile = true;
              showToast({ message: 'Compartilhado com sucesso!', type: 'success' });
              onClose();
              return;
            }
          }
        } catch (e) {
          console.log('Fallback para link do WhatsApp');
        }
      }

      // Fallback: abrir texto resumido no WhatsApp com link wa.me
      if (!sharedFile) {
        let msg = `*Doces da Luana · Relatório Financeiro*\n`;
        if (resumoData) {
          msg += `🗓 *Período:* ${resumoData.periodoTexto}\n`;
          msg += `💰 *Entradas:* ${formatarMoeda(resumoData.entradas)}\n`;
          msg += `💸 *Saídas:* ${formatarMoeda(resumoData.saidas)}\n`;
          msg += `📊 *Saldo:* ${formatarMoeda(resumoData.saldo)}\n`;
          if (resumoData.margem !== null) {
            msg += `📈 *Margem de Lucro:* ${resumoData.margem.toFixed(1)}%\n`;
          }
          if (resumoData.topGastos && resumoData.topGastos.length > 0) {
            msg += `\n*Principais Gastos:*\n`;
            resumoData.topGastos.slice(0, 3).forEach((g, idx) => {
              msg += `${idx + 1}. ${g.origem}: ${formatarMoeda(g.total)}\n`;
            });
          }
        } else {
          msg += `Acesse o app para consultar os detalhes completos.`;
        }

        const encoded = encodeURIComponent(msg);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        showToast({ message: 'Resumo enviado para o WhatsApp!', type: 'success' });
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      showToast({ message: 'Erro ao compartilhar.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Exportar e Compartilhar">
      <div className="space-y-3 pb-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Escolha como deseja visualizar ou enviar as métricas e relatórios da doceria.
        </p>

        {/* Botão Imagem PNG */}
        <button
          onClick={handleExportPNG}
          disabled={isGenerating}
          className="w-full p-4 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs active:scale-98 transition-all text-left"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#007AFF] flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Baixar Imagem (PNG)</p>
              <p className="text-xs text-gray-400">Alta resolução para salvar na galeria</p>
            </div>
          </div>
        </button>

        {/* Botão Relatório PDF */}
        <button
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="w-full p-4 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs active:scale-98 transition-all text-left"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 text-[#FF3B30] flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Baixar Relatório (PDF)</p>
              <p className="text-xs text-gray-400">Documento formatado A4 completo</p>
            </div>
          </div>
        </button>

        {/* Botão Enviar por WhatsApp */}
        <button
          onClick={handleShareWhatsApp}
          disabled={isGenerating}
          className="w-full p-4 rounded-2xl bg-[#25D366]/10 dark:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-between shadow-xs active:scale-98 transition-all text-left"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Enviar por WhatsApp</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compartilha no celular com texto e imagem</p>
            </div>
          </div>
        </button>

        {isGenerating && (
          <div className="text-center pt-2 text-xs text-gray-400 animate-pulse">
            Preparando arquivo, aguarde alguns instantes...
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
