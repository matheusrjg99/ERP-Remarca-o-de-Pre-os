import React, { useState, useEffect, useRef } from 'react';

export default function CustomizeModal({ isOpen, onClose, colunas, preferencias, onAtualizarPreferencias }) {
  const [colunasSelecionadas, setColunasSelecionadas] = useState(['custo']);
  const [aba, setAba] = useState('basica'); 
  
  // NOVA REGRA AGORA TEM TAMANHO DE FONTE E ID DE EDIÇÃO
  const [novaRegra, setNovaRegra] = useState({ 
    id: null,
    colunaAlvo: 'custo', 
    operador: '>', 
    valor: '', 
    bg: '#059669', 
    text: '#ffffff',
    size: 12 
  });

  const modalRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 20, y: 0 }); 

  useEffect(() => {
    if (isOpen) setPosition(pos => ({ ...pos, y: window.innerHeight * 0.1 }));
  }, [isOpen]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
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
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  const toggleColuna = (key) => {
    if (colunasSelecionadas.includes(key)) {
      if (colunasSelecionadas.length > 1) setColunasSelecionadas(colunasSelecionadas.filter(k => k !== key));
    } else {
      setColunasSelecionadas([...colunasSelecionadas, key]);
    }
  };

  const prefAtual = colunasSelecionadas.length > 0 ? (preferencias[colunasSelecionadas[0]] || {}) : {};

  const aplicarEmMassa = (updater) => {
    const novasPrefs = { ...preferencias };
    colunasSelecionadas.forEach(col => {
      const curr = novasPrefs[col] || {};
      novasPrefs[col] = updater(curr);
    });
    onAtualizarPreferencias(novasPrefs);
  };

  const addOuSalvarRegra = () => {
    if (novaRegra.valor === '') return;
    
    aplicarEmMassa((curr) => {
      let regras = curr.regras ? [...curr.regras] : [];
      
      if (novaRegra.id) {
        // MODO EDIÇÃO: Substitui a regra existente
        regras = regras.map(r => r.id === novaRegra.id ? { ...novaRegra } : r);
      } else {
        // MODO ADIÇÃO: Cria nova regra
        regras.push({ ...novaRegra, id: Date.now() + Math.random() });
      }
      return { ...curr, regras };
    });

    // Reseta o formulário
    setNovaRegra({ ...novaRegra, id: null, valor: '' }); 
  };

  const editarRegra = (regra) => {
    setNovaRegra({ ...regra });
    setAba('condicional');
  };

  const removeRegra = (idRegra) => {
    aplicarEmMassa((curr) => ({
      ...curr, 
      regras: curr.regras ? curr.regras.filter(r => r.id !== idRegra) : []
    }));
  };

  const getNomeColuna = (key) => {
    const col = colunas.find(c => c.key === key);
    return col ? col.label : key;
  };

  return (
    <div className="fixed inset-0 z-50 p-4 bg-transparent select-none pointer-events-none">
      <div 
        ref={modalRef}
        style={{ left: `${position.x}px`, top: `${position.y}px`, position: 'fixed', width: '380px' }}
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
      >
        <div onMouseDown={handleMouseDown} className="bg-zinc-800/60 px-4 py-3 border-b border-zinc-700 flex justify-between items-center cursor-move">
          <h2 className="text-sm font-semibold text-white">Personalizar Visual</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors text-lg p-1">&times;</button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4 custom-scrollbar">
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Colunas para aplicar:</label>
            <div className="flex flex-wrap gap-1.5">
              {colunas.filter(c => c.key !== 'check').map(c => (
                <button 
                  key={c.key} onClick={() => toggleColuna(c.key)}
                  className={`px-2 py-1 text-[10px] rounded border transition-colors ${colunasSelecionadas.includes(c.key) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex bg-zinc-950 rounded-md p-1 border border-zinc-800">
            <button onClick={() => setAba('basica')} className={`flex-1 text-xs py-1.5 rounded transition-colors ${aba === 'basica' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500'}`}>Básica</button>
            <button onClick={() => setAba('condicional')} className={`flex-1 text-xs py-1.5 rounded transition-colors ${aba === 'condicional' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-500'}`}>Condicional</button>
          </div>

          {aba === 'basica' && (
            <div className="flex flex-col gap-2.5 bg-zinc-950/50 p-3 border border-zinc-800 rounded-lg">
              <label className="flex items-center justify-between text-xs text-zinc-300">Cor de Fundo: <input type="color" value={prefAtual.bg || '#18181b'} onChange={(e) => aplicarEmMassa(c => ({ ...c, bg: e.target.value }))} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" /></label>
              <label className="flex items-center justify-between text-xs text-zinc-300">Cor do Texto: <input type="color" value={prefAtual.text || '#ffffff'} onChange={(e) => aplicarEmMassa(c => ({ ...c, text: e.target.value }))} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" /></label>
              <label className="flex items-center justify-between text-xs text-zinc-300">Tamanho Fonte (px): <input type="number" value={prefAtual.size || 12} min="8" max="24" onChange={(e) => aplicarEmMassa(c => ({ ...c, size: e.target.value }))} className="w-14 bg-zinc-950 border border-zinc-700 rounded px-2 text-center text-xs outline-none" /></label>
            </div>
          )}

          {aba === 'condicional' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 bg-zinc-950 p-3 border border-zinc-800 rounded-lg">
                <span className="text-[11px] font-medium text-zinc-400">{novaRegra.id ? '✏️ Editando Regra' : 'Criar Nova Regra'}</span>
                
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-zinc-500">Baseado na coluna:</span>
                  <select value={novaRegra.colunaAlvo} onChange={e => setNovaRegra({...novaRegra, colunaAlvo: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none">
                    {colunas.filter(c => c.key !== 'check').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>

                <div className="flex gap-2 mt-1">
                  <select value={novaRegra.operador} onChange={e => setNovaRegra({...novaRegra, operador: e.target.value})} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none flex-1">
                    <option value=">">Maior que ({'>'})</option>
                    <option value="<">Menor que ({'<'})</option>
                    <option value=">=">Maior/Igual ({'>='})</option>
                    <option value="<=">Menor/Igual ({'<='})</option>
                    <option value="=">Igual (=)</option>
                  </select>
                  <input type="number" placeholder="Valor" value={novaRegra.valor} onChange={e => setNovaRegra({...novaRegra, valor: e.target.value})} className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-300 outline-none w-20" />
                </div>

                {/* LIVE PREVIEW DA REGRA */}
                <div className="mt-2 p-2 rounded flex items-center justify-between border border-dashed border-zinc-700" style={{ backgroundColor: novaRegra.bg }}>
                   <span className="text-[10px] uppercase font-bold" style={{ color: novaRegra.text, fontSize: `${novaRegra.size}px` }}>
                      Exemplo Visual
                   </span>
                   <span className="text-[9px] text-zinc-400 bg-black/30 px-1 rounded italic">Prévia</span>
                </div>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-800/50 gap-2">
                    <label className="flex flex-col items-center gap-1 text-[9px] text-zinc-500">Fundo <input type="color" value={novaRegra.bg} onChange={e => setNovaRegra({...novaRegra, bg: e.target.value})} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0" /></label>
                    <label className="flex flex-col items-center gap-1 text-[9px] text-zinc-500">Texto <input type="color" value={novaRegra.text} onChange={e => setNovaRegra({...novaRegra, text: e.target.value})} className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0" /></label>
                    <label className="flex flex-col items-center gap-1 text-[9px] text-zinc-500">Fonte <input type="number" value={novaRegra.size} min="8" max="24" onChange={e => setNovaRegra({...novaRegra, size: e.target.value})} className="w-10 bg-zinc-900 border border-zinc-700 rounded text-center outline-none" /></label>
                    <button onClick={addOuSalvarRegra} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-2 rounded shadow-sm">
                      {novaRegra.id ? 'SALVAR' : 'ADICIONAR'}
                    </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Regras Ativas</span>
                {(!prefAtual.regras || prefAtual.regras.length === 0) ? (
                  <p className="text-[11px] text-zinc-600 italic">Nenhuma regra configurada.</p>
                ) : (
                  prefAtual.regras.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-2 rounded group">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-300 font-mono">se <strong className="text-zinc-100">{getNomeColuna(r.colunaAlvo)}</strong> {r.operador} {r.valor}</span>
                        <div className="flex gap-1">
                          <span className="w-3 h-3 rounded-full border border-zinc-700" style={{ backgroundColor: r.bg }} title={`Fonte: ${r.size}px`}></span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => editarRegra(r)} className="text-zinc-500 hover:text-blue-400 text-xs" title="Editar">✏️</button>
                        <button onClick={() => removeRegra(r.id)} className="text-zinc-500 hover:text-rose-500 text-sm">&times;</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <button onClick={() => aplicarEmMassa(c => ({ bg: null, text: null, size: null, regras: [] }))} className="mt-auto w-full text-center text-xs font-medium text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 py-1.5 rounded-md">Limpar Colunas</button>
        </div>
      </div>
    </div>
  );
}