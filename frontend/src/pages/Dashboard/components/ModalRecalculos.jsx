import React, { useState, useEffect, useRef, useMemo } from 'react';
import { round2, round1 } from '../utils/calculations';

const CAMPOS_ALVO = [
  { key: 'custo', label: 'Custo' },
  { key: 'sugerido', label: 'Sugerido' },
  { key: 'atual', label: 'Atual' }
];

const TIPOS_AJUSTE = [
  { key: 'percentual', label: '%' },
  { key: 'valor_fixo', label: 'R$' }
];

export default function ModalRecalculos({ isOpen, onClose, produtos, onAplicarRecalculo, triggerRef }) {
  const [campoAlvo, setCampoAlvo] = useState('sugerido');
  const [tipoAjuste, setTipoAjuste] = useState('percentual');
  const [valorAjuste, setValorAjuste] = useState('');
  const [preview, setPreview] = useState(null);
  
  const modalRef = useRef(null);
  const inputRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const wasOpenRef = useRef(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  // 🎯 Calcula posição ANTES de mostrar o modal
  useEffect(() => {
    if (isOpen) {
      let x, y;
      
      if (triggerRef?.current) {
        const btnRect = triggerRef.current.getBoundingClientRect();
        const modalWidth = 320;
        const modalHeight = 280;
        
        x = btnRect.left;
        y = btnRect.bottom + 8;
        
        if (y + modalHeight > window.innerHeight) {
          y = btnRect.top - modalHeight - 8;
        }
        
        if (x + modalWidth > window.innerWidth) {
          x = window.innerWidth - modalWidth - 16;
        }
        
        x = Math.max(8, x);
        y = Math.max(8, y);
      } else {
        x = (window.innerWidth - 320) / 2;
        y = (window.innerHeight - 250) / 2;
      }
      
      setPosition({ x, y });
      
      // Pequeno delay pra posição setar antes de mostrar
      requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      });
      
      wasOpenRef.current = true;
    } else {
      setVisible(false);
      setValorAjuste('');
      setPreview(null);
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (!isOpen || valorAjuste === '' || !produtos.length) {
      setPreview(null);
      return;
    }

    const valor = parseFloat(valorAjuste.replace(',', '.'));
    if (isNaN(valor) || !isFinite(valor)) {
      setPreview(null);
      return;
    }

    const amostra = produtos[0];
    const valorAtual = amostra[campoAlvo];
    const novoValor = tipoAjuste === 'percentual' 
      ? Math.max(0, round2(valorAtual * (1 + valor / 100)))
      : Math.max(0, round2(valorAtual + valor));

    setPreview({
      valorAtual,
      novoValor,
      totalProdutos: produtos.length
    });
  }, [isOpen, valorAjuste, campoAlvo, tipoAjuste, produtos]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    draggingRef.current = true;
    const modalRect = modalRef.current.getBoundingClientRect();
    offsetRef.current = { x: e.clientX - modalRect.left, y: e.clientY - modalRect.top };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    setPosition({ x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y });
  };

  const handleMouseUp = () => {
    draggingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleAplicar = () => {
    const valor = parseFloat(valorAjuste.replace(',', '.'));
    if (isNaN(valor) || !isFinite(valor) || produtos.length === 0) return;
    onAplicarRecalculo({ campoAlvo, tipoAjuste, valorAjuste: valor });
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAplicar(); }
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  const podeAplicar = valorAjuste !== '' && 
    !isNaN(parseFloat(valorAjuste.replace(',', '.'))) && 
    isFinite(parseFloat(valorAjuste.replace(',', '.'))) &&
    produtos.length > 0;

  const formatar = (val) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getCor = (novo, antigo) => {
    if (novo > antigo) return 'text-emerald-400';
    if (novo < antigo) return 'text-rose-400';
    return 'text-zinc-400';
  };

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`, 
          position: 'fixed',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'opacity 150ms ease-out, transform 150ms ease-out'
        }}
        className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-800 rounded-xl shadow-2xl overflow-hidden w-[320px] pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          onMouseDown={handleMouseDown} 
          className="px-4 py-3 border-b border-zinc-800/50 flex justify-between items-center cursor-move select-none"
        >
          <span className="text-sm font-medium text-zinc-300">Ajuste em lote</span>
          <button 
            onClick={onClose} 
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded hover:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="p-4 space-y-4">
          
          {/* Campo Alvo */}
          <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
            {CAMPOS_ALVO.map(campo => (
              <button
                key={campo.key}
                onClick={() => setCampoAlvo(campo.key)}
                className={`flex-1 py-1.5 text-xs rounded-md transition-all ${
                  campoAlvo === campo.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {campo.label}
              </button>
            ))}
          </div>

          {/* Tipo + Valor */}
          <div className="flex gap-2">
            <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-800">
              {TIPOS_AJUSTE.map(tipo => (
                <button
                  key={tipo.key}
                  onClick={() => setTipoAjuste(tipo.key)}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all font-medium ${
                    tipoAjuste === tipo.key
                      ? 'bg-zinc-800 text-zinc-200'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>

            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={valorAjuste}
              onChange={e => setValorAjuste(e.target.value.replace(/[^0-9.\-,]/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder={tipoAjuste === 'percentual' ? '10' : '2,50'}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-700 font-mono placeholder:text-zinc-600"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 flex items-center justify-between">
              <div className="text-xs text-zinc-500">
                {preview.totalProdutos} ite{preview.totalProdutos > 1 ? 'ns' : 'm'}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">{formatar(preview.valorAtual)}</span>
                <span className="text-zinc-600">→</span>
                <span className={`font-medium ${getCor(preview.novoValor, preview.valorAtual)}`}>
                  {formatar(preview.novoValor)}
                </span>
              </div>
            </div>
          )}

          {/* Botão Aplicar */}
          <button
            onClick={handleAplicar}
            disabled={!podeAplicar}
            className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
              podeAplicar
                ? 'bg-zinc-100 hover:bg-white text-zinc-900'
                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}