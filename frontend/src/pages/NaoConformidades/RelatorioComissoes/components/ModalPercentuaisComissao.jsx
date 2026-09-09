import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Modal para configuração dos percentuais de comissão (fiscal e dinheiro)
 * antes da exportação do relatório.
 * 
 * @param {boolean} isOpen - Controla visibilidade do modal
 * @param {function} onClose - Callback ao fechar
 * @param {function} onConfirm - Callback ao confirmar com os valores
 * @param {object} valoresIniciais - Valores pré-preenchidos (opcional)
 */
export default function ModalPercentuaisComissao({ 
  isOpen, 
  onClose, 
  onConfirm,
  valoresIniciais = { percentualFiscal: 100, percentualDinheiro: 0 }
}) {
  const [percentualFiscal, setPercentualFiscal] = useState(valoresIniciais.percentualFiscal || 100);
  const [percentualDinheiro, setPercentualDinheiro] = useState(valoresIniciais.percentualDinheiro || 0);
  const [erro, setErro] = useState('');

  // Resetar valores quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setPercentualFiscal(valoresIniciais.percentualFiscal || 100);
      setPercentualDinheiro(valoresIniciais.percentualDinheiro || 0);
      setErro('');
    }
  }, [isOpen, valoresIniciais]);

  // Validar soma dos percentuais
  useEffect(() => {
    const fiscal = parseFloat(percentualFiscal) || 0;
    const dinheiro = parseFloat(percentualDinheiro) || 0;
    const soma = fiscal + dinheiro;

    if (Math.abs(soma - 100) > 0.01) {
      setErro(`A soma dos percentuais deve ser 100%. Atual: ${soma.toFixed(2)}%`);
    } else {
      setErro('');
    }
  }, [percentualFiscal, percentualDinheiro]);

  const handleConfirmar = () => {
    const fiscal = parseFloat(percentualFiscal) || 0;
    const dinheiro = parseFloat(percentualDinheiro) || 0;
    
    if (Math.abs(fiscal + dinheiro - 100) > 0.01) {
      return; // Não permite confirmar se inválido
    }

    onConfirm({
      percentualFiscal: fiscal,
      percentualDinheiro: dinheiro
    });
    onClose();
  };

  const handleFechar = () => {
    onClose();
  };

  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === 'Escape' && handleFechar();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 w-full max-w-md rounded-xl shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-3 border-b border-zinc-800 flex justify-between items-center bg-[#09090b] rounded-t-xl">
          <h2 className="text-zinc-200 text-sm font-bold uppercase tracking-wide flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-[#3B8ED0] rounded-sm"></div>
            Percentuais da Comissão
          </h2>
          <button 
            onClick={handleFechar}
            className="text-zinc-500 hover:text-rose-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs font-medium text-zinc-400 leading-relaxed">
            Defina como a comissão será dividida entre valor fiscal e valor em dinheiro.
            A soma dos percentuais deve ser igual a <span className="text-white font-bold">100%</span>.
          </p>

          {/* Input Fiscal */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
              Percentual Fiscal (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={percentualFiscal}
              onChange={(e) => setPercentualFiscal(e.target.value)}
              className="bg-[#202024] border border-zinc-700 p-3 rounded-lg text-sm text-zinc-200 outline-none focus:border-[#3B8ED0] transition-colors font-bold"
              placeholder="Ex: 70"
            />
          </div>

          {/* Input Dinheiro */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">
              Percentual em Dinheiro (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={percentualDinheiro}
              onChange={(e) => setPercentualDinheiro(e.target.value)}
              className="bg-[#202024] border border-zinc-700 p-3 rounded-lg text-sm text-zinc-200 outline-none focus:border-[#3B8ED0] transition-colors font-bold"
              placeholder="Ex: 30"
            />
          </div>

          {/* Resumo Visual */}
          <div className="bg-[#202024] border border-zinc-800 rounded-lg p-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Soma Total</span>
              <span className={`text-sm font-black ${(parseFloat(percentualFiscal) || 0) + (parseFloat(percentualDinheiro) || 0) === 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {((parseFloat(percentualFiscal) || 0) + (parseFloat(percentualDinheiro) || 0)).toFixed(2)}%
              </span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-[#3B8ED0] transition-all duration-300"
                style={{ width: `${Math.min(parseFloat(percentualFiscal) || 0, 100)}%` }}
              ></div>
              <div 
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(parseFloat(percentualDinheiro) || 0, 100)}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-[#3B8ED0] rounded-full"></div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Fiscal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase">Dinheiro</span>
              </div>
            </div>
          </div>

          {/* Mensagem de Erro */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-1">
              <p className="text-xs font-bold text-red-500">{erro}</p>
            </div>
          )}
        </div>

        {/* Footer com Ações */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-[#09090b] rounded-b-xl flex justify-end gap-3">
          <button
            onClick={handleFechar}
            className="px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors uppercase tracking-wide"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!!erro}
            className="px-5 py-2.5 bg-[#3B8ED0] hover:bg-[#2d74ab] disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs font-bold uppercase tracking-wide rounded-lg transition-all active:scale-95 shadow-md shadow-[#3B8ED0]/20"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
