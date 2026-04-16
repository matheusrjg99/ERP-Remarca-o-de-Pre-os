import React, { useState, useEffect, useRef } from 'react';

export default function CustomizeModal({ isOpen, onClose, colunas, preferencias, onAtualizarPreferencias }) {
  // Inicializamos com 'custo', mas agora permitimos selecionar o cabeçalho
  const [colunasSelecionadas, setColunasSelecionadas] = useState(['custo']);
  const [aba, setAba] = useState('basica'); 
  
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

  // Pega a preferência da primeira coluna selecionada para exibir nos inputs
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
        regras = regras.map(r => r.id === novaRegra.id ? { ...novaRegra } : r);
      } else {
        regras.push({ ...novaRegra, id: Date.now() + Math.random() });
      }
      return { ...curr, regras };
    });

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
    if (key === '__header__') return 'CABEÇALHO';
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
        {/* Header do Modal */}
        <div onMouseDown={handleMouseDown} className="bg-zinc-800/60 px-4 py-3 border-b border-zinc-700 flex justify-between items-center cursor-move">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <h2 className="text-sm font-semibold text-white">Personalizar Visual</h2>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors text-lg p-1">&times;</button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto p-4 gap-4 custom-scrollbar">
          
          {/* SELEÇÃO DE COLUNAS + CABEÇALHO */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Onde aplicar o estilo?</label>
            <div className="flex flex-wrap gap-1.5">
              {/* Botão Especial para o Cabeçalho */}
              <button 
                onClick={() => toggleColuna('__header__')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${colunasSelecionadas.includes('__header__') ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-900/20' : 'bg-zinc-950 border-zinc-800 text-amber-500/70 hover:border-amber-600'}`}
              >
                TOP: CABEÇALHO
              </button>

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

          {/* ABAS */}
          <div className="flex bg-zinc-950 rounded-md p-1 border border-zinc-800">
            <button onClick={() => setAba('basica')} className={`flex-1 text-xs py-1.5 rounded transition-all ${aba === 'basica' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>Estilo Fixo</button>
            <button 
              disabled={colunasSelecionadas.includes('__header__') && colunasSelecionadas.length === 1}
              onClick={() => setAba('condicional')} 
              className={`flex-1 text-xs py-1.5 rounded transition-all ${aba === 'condicional' ? 'bg-zinc-800 text-white font-medium shadow-sm' : 'text-zinc-500 hover:text-zinc-300'} disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Regras (IF)
            </button>
          </div>

          {/* CONTEÚDO: ESTILO BÁSICO */}
          {aba === 'basica' && (
            <div className="flex flex-col gap-3 bg-zinc-950/50 p-3 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">Cor de Fundo</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono">{prefAtual.bg || '#18181b'}</span>
                    <input type="color" value={prefAtual.bg || '#18181b'} onChange={(e) => aplicarEmMassa(c => ({ ...c, bg: e.target.value }))} className="w-7 h-7 rounded-md cursor-pointer bg-zinc-800 border-2 border-zinc-700 p-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">Cor do Texto</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono">{prefAtual.text || '#ffffff'}</span>
                    <input type="color" value={prefAtual.text || '#ffffff'} onChange={(e) => aplicarEmMassa(c => ({ ...c, text: e.target.value }))} className="w-7 h-7 rounded-md cursor-pointer bg-zinc-800 border-2 border-zinc-700 p-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-zinc-400 font-medium">Tamanho da Fonte</span>
                <div className="flex items-center gap-2">
                   <input type="range" min="8" max="20" value={prefAtual.size || 12} onChange={(e) => aplicarEmMassa(c => ({ ...c, size: parseInt(e.target.value) }))} className="w-24 accent-blue-500" />
                   <span className="text-[11px] text-white bg-zinc-800 px-2 py-0.5 rounded min-w-[35px] text-center">{prefAtual.size || 12}px</span>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO: CONDICIONAL */}
          {aba === 'condicional' && (
            <div className="flex flex-col gap-3">
               {/* FORMULÁRIO DE REGRA */}
               <div className="flex flex-col gap-2 bg-zinc-950 p-3 border border-zinc-800 rounded-lg shadow-inner">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{novaRegra.id ? '✏️ Editando Regra' : '✨ Nova Condição'}</span>
                    {novaRegra.id && <button onClick={() => setNovaRegra({...novaRegra, id: null, valor: ''})} className="text-[9px] text-zinc-500 hover:text-zinc-300 underline">Cancelar</button>}
                </div>
                
                <div className="grid grid-cols-12 gap-2">
                  <select value={novaRegra.colunaAlvo} onChange={e => setNovaRegra({...novaRegra, colunaAlvo: e.target.value})} className="col-span-12 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 outline-none">
                    {colunas.filter(c => c.key !== 'check').map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>

                  <select value={novaRegra.operador} onChange={e => setNovaRegra({...novaRegra, operador: e.target.value})} className="col-span-7 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 outline-none">
                    <option value=">">Maior que {'>'}</option>
                    <option value="<">Menor que {'<'}</option>
                    <option value=">=">Maior ou Igual {'>='}</option>
                    <option value="<=">Menor ou Igual {'<='}</option>
                    <option value="=">Exatamente Igual =</option>
                  </select>

                  <input type="number" placeholder="Valor" value={novaRegra.valor} onChange={e => setNovaRegra({...novaRegra, valor: e.target.value})} className="col-span-5 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 outline-none" />
                </div>

                <div className="mt-2 p-3 rounded-md flex items-center justify-between border border-dashed border-zinc-800 transition-all" style={{ backgroundColor: novaRegra.bg }}>
                   <span className="text-[10px] uppercase font-black tracking-tighter" style={{ color: novaRegra.text, fontSize: `${novaRegra.size}px` }}>
                      TEXTO DE EXEMPLO
                   </span>
                   <div className="flex gap-2">
                      <input type="color" value={novaRegra.bg} title="Fundo" onChange={e => setNovaRegra({...novaRegra, bg: e.target.value})} className="w-5 h-5 rounded-full cursor-pointer border-0 p-0" />
                      <input type="color" value={novaRegra.text} title="Texto" onChange={e => setNovaRegra({...novaRegra, text: e.target.value})} className="w-5 h-5 rounded-full cursor-pointer border-0 p-0" />
                   </div>
                </div>

                <button onClick={addOuSalvarRegra} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded mt-1 transition-all">
                  {novaRegra.id ? 'ATUALIZAR REGRA' : 'ADICIONAR À LISTA'}
                </button>
              </div>

              {/* LISTAGEM DE REGRAS */}
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {(!prefAtual.regras || prefAtual.regras.length === 0) ? (
                  <p className="text-[10px] text-zinc-600 italic text-center py-2">Sem regras para {getNomeColuna(colunasSelecionadas[0])}</p>
                ) : (
                  prefAtual.regras.map((r) => (
                    <div key={r.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800 p-2 rounded-md group hover:border-zinc-600 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded shadow-sm border border-zinc-800" style={{ backgroundColor: r.bg }}></div>
                        <span className="text-[10px] text-zinc-300 font-medium">
                          if <span className="text-blue-400">{getNomeColuna(r.colunaAlvo)}</span> {r.operador} {r.valor}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => editarRegra(r)} className="p-1 hover:bg-zinc-800 rounded text-blue-400" title="Editar">✏️</button>
                        <button onClick={() => removeRegra(r.id)} className="p-1 hover:bg-zinc-800 rounded text-rose-500" title="Excluir">&times;</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* BOTÃO DE RESET */}
          <button 
            onClick={() => {
              if(window.confirm('Deseja resetar o visual das colunas selecionadas?')) {
                aplicarEmMassa(c => ({ bg: null, text: null, size: null, regras: [] }));
              }
            }} 
            className="mt-auto w-full text-[10px] font-bold text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 py-2 rounded border border-zinc-800 hover:border-rose-900/30 transition-all uppercase tracking-widest"
          >
            Limpar Formatação
          </button>
        </div>
      </div>
    </div>
  );
}