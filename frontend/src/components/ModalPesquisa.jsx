import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import api from '../api/axios';

const ListaRow = memo(({ cod, descricao, index, isSelected, onMouseDown, onMouseEnter, onDoubleClick }) => {
  return (
    <tr 
      onMouseDown={(e) => onMouseDown(index, cod, e)}
      onMouseEnter={() => onMouseEnter(index)}
      onDoubleClick={() => onDoubleClick(cod)}
      className={`cursor-pointer select-none ${isSelected ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
    >
      <td className="p-1.5 w-16 text-center">{cod}</td>
      {/* Aqui tiramos o 'truncate' e colocamos 'whitespace-nowrap' para forçar a rolagem em vez de cortar */}
      <td className="p-1.5 whitespace-nowrap" title={descricao}>{descricao}</td>
    </tr>
  );
});

export default function ModalPesquisa({ isOpen, onClose, onSelect, ambiente }) {
  const [filtros, setFiltros] = useState({ descricao: '', codigo: '', fornecedor: '', classificacao: '', disponibilidade: ['De linha'] });
  const [resultados, setResultados] = useState([]);
  const [selecionadosDireita, setSelecionadosDireita] = useState([]);
  const [selecaoAtivaEsquerda, setSelecaoAtivaEsquerda] = useState([]); 
  const [selecaoAtivaDireita, setSelecaoAtivaDireita] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fornecedoresList, setFornecedoresList] = useState([]);
  const [showFornDropdown, setShowFornDropdown] = useState(false);
  const [classificacoesList, setClassificacoesList] = useState([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const [dragInfoEsquerda, setDragInfoEsquerda] = useState({ active: false, start: -1, current: -1, ctrl: false, selecting: true });
  const [dragInfoDireita, setDragInfoDireita] = useState({ active: false, start: -1, current: -1, ctrl: false, selecting: true });

  const getCodigo = (p) => p.codpro || p.CODPRO;
  const getDescricao = (p) => p.DESCRICAOLONGA || p.DESCRPROD || p.descr;

  const stateRefEsq = useRef({ selecaoAtivaEsquerda, dragInfoEsquerda, resultados });
  const stateRefDir = useRef({ selecaoAtivaDireita, dragInfoDireita, selecionadosDireita });
  const dropdownFornRef = useRef(null);
  const dropdownClassRef = useRef(null);

  useEffect(() => { stateRefEsq.current = { selecaoAtivaEsquerda, dragInfoEsquerda, resultados }; }, [selecaoAtivaEsquerda, dragInfoEsquerda, resultados]);
  useEffect(() => { stateRefDir.current = { selecaoAtivaDireita, dragInfoDireita, selecionadosDireita }; }, [selecaoAtivaDireita, dragInfoDireita, selecionadosDireita]);

  useEffect(() => {
    if (isOpen) {
      setResultados([]); setSelecionadosDireita([]); setSelecaoAtivaEsquerda([]); setSelecaoAtivaDireita([]);
      setFiltros({ descricao: '', codigo: '', fornecedor: '', classificacao: '', disponibilidade: ['De linha'] });
      setShowFornDropdown(false); setShowClassDropdown(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleClickFora = (e) => {
      if (dropdownFornRef.current && !dropdownFornRef.current.contains(e.target)) setShowFornDropdown(false);
      if (dropdownClassRef.current && !dropdownClassRef.current.contains(e.target)) setShowClassDropdown(false);
    };
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  useEffect(() => {
    const handleMouseUpGlobal = () => {
      if (stateRefEsq.current.dragInfoEsquerda.active) {
        const { dragInfoEsquerda: drag, selecaoAtivaEsquerda: sel, resultados: res } = stateRefEsq.current;
        const minIdx = Math.min(drag.start, drag.current);
        const maxIdx = Math.max(drag.start, drag.current);
        let newSelSet = new Set(drag.ctrl ? sel : []);
        for (let i = minIdx; i <= maxIdx; i++) {
          if (!res[i]) continue;
          const code = getCodigo(res[i]);
          if (drag.selecting) newSelSet.add(code); else newSelSet.delete(code);
        }
        setSelecaoAtivaEsquerda(Array.from(newSelSet));
        setDragInfoEsquerda({ active: false, start: -1, current: -1, ctrl: false, selecting: true });
      }
      if (stateRefDir.current.dragInfoDireita.active) {
        const { dragInfoDireita: drag, selecaoAtivaDireita: sel, selecionadosDireita: res } = stateRefDir.current;
        const minIdx = Math.min(drag.start, drag.current);
        const maxIdx = Math.max(drag.start, drag.current);
        let newSelSet = new Set(drag.ctrl ? sel : []);
        for (let i = minIdx; i <= maxIdx; i++) {
          if (!res[i]) continue;
          const code = getCodigo(res[i]);
          if (drag.selecting) newSelSet.add(code); else newSelSet.delete(code);
        }
        setSelecaoAtivaDireita(Array.from(newSelSet));
        setDragInfoDireita({ active: false, start: -1, current: -1, ctrl: false, selecting: true });
      }
    };
    window.addEventListener('mouseup', handleMouseUpGlobal);
    return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
  }, []);

  const handleFiltrar = async () => {
    setLoading(true); setSelecaoAtivaEsquerda([]); setShowFornDropdown(false); setShowClassDropdown(false);
    try {
      const res = await api.get('/api/pesquisar', {
        params: { termo: filtros.descricao, codigo: filtros.codigo, fornecedor: filtros.fornecedor, classificacao: filtros.classificacao, disponibilidade: filtros.disponibilidade.join(','), ambiente }
      });
      const novosResultados = Array.isArray(res.data) ? res.data : [res.data];
      const codigosNaDireita = selecionadosDireita.map(getCodigo);
      setResultados(novosResultados.filter(p => !codigosNaDireita.includes(getCodigo(p))));
    } catch (err) { alert("Erro ao pesquisar os produtos."); } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleFiltrar(); };

  const buscarFornecedores = async (termo = "") => {
    try {
      const res = await api.get(`/api/fornecedores?termo=${termo}&ambiente=${ambiente}`);
      setFornecedoresList(Array.isArray(res.data) ? res.data : [res.data]);
      setShowFornDropdown(true);
    } catch (error) { console.error(error); }
  };

  const handleFornecedorAction = (e) => {
    if (e.key === 'Tab' || e.key === 'F3') {
      e.preventDefault(); 
      if (fornecedoresList.length === 0 || filtros.fornecedor) {
        buscarFornecedores(filtros.fornecedor); 
      } else {
        setShowFornDropdown(true); 
      }
    } else if (e.key === 'Enter') {
      handleFiltrar();
    }
  };

  const buscarClassificacoes = async () => {
    try {
      const res = await api.get(`/api/classificacoes?ambiente=${ambiente}`);
      setClassificacoesList(Array.isArray(res.data) ? res.data : [res.data]);
      setShowClassDropdown(true);
    } catch (error) { console.error(error); }
  };

  const handleClassificacaoAction = (e) => {
    if (e.key === 'Tab' || e.key === 'F3') {
      e.preventDefault();
      if (classificacoesList.length === 0) buscarClassificacoes();
      else setShowClassDropdown(true);
    } else if (e.key === 'Enter') {
      handleFiltrar();
    }
  };

  const toggleDisponibilidade = (status) => {
    setFiltros(prev => {
      const disp = prev.disponibilidade;
      if (disp.includes(status)) return { ...prev, disponibilidade: disp.filter(item => item !== status) };
      return { ...prev, disponibilidade: [...disp, status] };
    });
  };

  const moverParaDireita = useCallback(() => {
    const { selecaoAtivaEsquerda: sel, resultados: res } = stateRefEsq.current;
    if (sel.length === 0) return;
    const itensParaMover = res.filter(p => sel.includes(getCodigo(p)));
    setSelecionadosDireita(prev => [...prev, ...itensParaMover]);
    setResultados(prev => prev.filter(p => !sel.includes(getCodigo(p))));
    setSelecaoAtivaEsquerda([]);
  }, []);

  const moverTodosParaDireita = useCallback(() => {
    const { resultados: res } = stateRefEsq.current;
    if (res.length === 0) return;
    setSelecionadosDireita(prev => [...prev, ...res]);
    setResultados([]); setSelecaoAtivaEsquerda([]);
  }, []);

  const moverParaEsquerda = useCallback(() => {
    const { selecaoAtivaDireita: sel, selecionadosDireita: resDir } = stateRefDir.current;
    if (sel.length === 0) return;
    const itensParaDevolver = resDir.filter(p => sel.includes(getCodigo(p)));
    setResultados(prev => [...prev, ...itensParaDevolver]);
    setSelecionadosDireita(prev => prev.filter(p => !sel.includes(getCodigo(p))));
    setSelecaoAtivaDireita([]);
  }, []);

  const moverTodosParaEsquerda = useCallback(() => {
    const { selecionadosDireita: resDir } = stateRefDir.current;
    if (resDir.length === 0) return;
    setResultados(prev => [...prev, ...resDir]);
    setSelecionadosDireita([]); setSelecaoAtivaDireita([]);
  }, []);

  const handleConfirmar = () => {
    if (selecionadosDireita.length === 0) return;
    onSelect(selecionadosDireita.map(getCodigo));
    onClose();
  };

  const handleMouseDownEsq = useCallback((index, cod, e) => { e.preventDefault(); setDragInfoEsquerda({ active: true, start: index, current: index, ctrl: e.ctrlKey || e.metaKey, selecting: !stateRefEsq.current.selecaoAtivaEsquerda.includes(cod) }); }, []);
  const handleMouseEnterEsq = useCallback((index) => { if (stateRefEsq.current.dragInfoEsquerda.active) setDragInfoEsquerda(prev => ({ ...prev, current: index })); }, []);
  const handleMouseDownDir = useCallback((index, cod, e) => { e.preventDefault(); setDragInfoDireita({ active: true, start: index, current: index, ctrl: e.ctrlKey || e.metaKey, selecting: !stateRefDir.current.selecaoAtivaDireita.includes(cod) }); }, []);
  const handleMouseEnterDir = useCallback((index) => { if (stateRefDir.current.dragInfoDireita.active) setDragInfoDireita(prev => ({ ...prev, current: index })); }, []);

  const renderEsquerda = useMemo(() => {
    if (resultados.length === 0 && !loading) return <tr><td colSpan="2" className="p-2 text-zinc-600 italic">Pesquise para listar produtos.</td></tr>;
    return resultados.map((p, i) => {
      const cod = getCodigo(p); let isSelected = selecaoAtivaEsquerda.includes(cod);
      if (dragInfoEsquerda.active) {
        const minIdx = Math.min(dragInfoEsquerda.start, dragInfoEsquerda.current); const maxIdx = Math.max(dragInfoEsquerda.start, dragInfoEsquerda.current);
        if (i >= minIdx && i <= maxIdx) isSelected = dragInfoEsquerda.selecting; else if (!dragInfoEsquerda.ctrl) isSelected = false;
      }
      return <ListaRow key={cod} cod={cod} descricao={getDescricao(p)} index={i} isSelected={isSelected} onMouseDown={handleMouseDownEsq} onMouseEnter={handleMouseEnterEsq} onDoubleClick={moverParaDireita} />;
    });
  }, [resultados, selecaoAtivaEsquerda, dragInfoEsquerda, loading, handleMouseDownEsq, handleMouseEnterEsq, moverParaDireita]);

  const renderDireita = useMemo(() => {
    if (selecionadosDireita.length === 0) return <tr><td colSpan="2" className="p-2 text-zinc-600 italic">Itens selecionados aparecerão aqui.</td></tr>;
    return selecionadosDireita.map((p, i) => {
      const cod = getCodigo(p); let isSelected = selecaoAtivaDireita.includes(cod);
      if (dragInfoDireita.active) {
        const minIdx = Math.min(dragInfoDireita.start, dragInfoDireita.current); const maxIdx = Math.max(dragInfoDireita.start, dragInfoDireita.current);
        if (i >= minIdx && i <= maxIdx) isSelected = dragInfoDireita.selecting; else if (!dragInfoDireita.ctrl) isSelected = false;
      }
      return <ListaRow key={cod} cod={cod} descricao={getDescricao(p)} index={i} isSelected={isSelected} onMouseDown={handleMouseDownDir} onMouseEnter={handleMouseEnterDir} onDoubleClick={moverParaEsquerda} />;
    });
  }, [selecionadosDireita, selecaoAtivaDireita, dragInfoDireita, handleMouseDownDir, handleMouseEnterDir, moverParaEsquerda]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 w-full max-w-5xl rounded shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="px-4 py-2 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]">
          <h2 className="text-zinc-300 text-sm font-medium flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm"></div> Pesquisa de Produtos</h2>
          <div className="flex gap-2">
             <button onClick={onClose} className="text-zinc-500 hover:text-rose-500 transition-colors">✕</button>
          </div>
        </div>

        <div className="p-4 flex gap-4 border-b border-zinc-800 bg-[#18181b] relative">
          <div className="flex-1 flex flex-col gap-3">
            <input autoFocus className="w-full bg-[#202024] border border-zinc-700 p-2 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" placeholder="Descrição do Produto" value={filtros.descricao} onChange={e => setFiltros({...filtros, descricao: e.target.value})} onKeyDown={handleKeyDown} />
            <div className="flex gap-3">
              
              <input className="w-32 bg-[#202024] border border-zinc-700 p-2 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" placeholder="Código" value={filtros.codigo} onChange={e => setFiltros({...filtros, codigo: e.target.value})} onKeyDown={handleKeyDown} />
              
              <div className="flex-1 relative" ref={dropdownFornRef}>
                <input 
                  className="w-full bg-[#202024] border border-zinc-700 p-2 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" 
                  placeholder="Fornecedor" 
                  value={filtros.fornecedor} 
                  onChange={e => setFiltros({...filtros, fornecedor: e.target.value})} 
                  onKeyDown={handleFornecedorAction}
                  onBlur={() => setTimeout(() => setShowFornDropdown(false), 200)}
                />
                {showFornDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-xl max-h-48 overflow-y-auto z-50 custom-scrollbar">
                    {fornecedoresList.length === 0 ? <div className="p-2 text-xs text-zinc-400">Nenhum encontrado.</div> : 
                      fornecedoresList.map((f, idx) => {
                        const oidStr = f.OID || f.oid || '';
                        const nomeStr = f.NOME || f.nome || '';
                        return (
                          <div key={idx} onClick={() => { setFiltros({...filtros, fornecedor: nomeStr}); setShowFornDropdown(false); }} className="p-2 text-xs text-zinc-200 hover:bg-blue-600 cursor-pointer border-b border-zinc-700/50 last:border-0 truncate">
                            {nomeStr}
                          </div>
                        )
                      })
                    }
                  </div>
                )}
              </div>

              <div className="flex-1 relative" ref={dropdownClassRef}>
                <input 
                  className="w-full bg-[#202024] border border-zinc-700 p-2 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" 
                  placeholder="Classificação" 
                  value={filtros.classificacao} 
                  onChange={e => {
                    setFiltros({...filtros, classificacao: e.target.value});
                    if (classificacoesList.length === 0) buscarClassificacoes();
                    else setShowClassDropdown(true);
                  }} 
                  onKeyDown={handleClassificacaoAction}
                  onClick={() => { if(classificacoesList.length === 0) buscarClassificacoes(); else setShowClassDropdown(true); }}
                />
                {showClassDropdown && (
                  <div className="absolute top-full left-0 w-[400px] mt-1 bg-zinc-800 border border-zinc-700 rounded shadow-xl max-h-64 overflow-y-auto z-50 custom-scrollbar">
                    {classificacoesList
                      .filter(c => {
                         if (!filtros.classificacao || filtros.classificacao.includes(' - ')) return true;
                         const busca = filtros.classificacao.replace(".", "").toLowerCase();
                         const cod = (c.codigo || c.clasprod || '').toLowerCase();
                         const desc = (c.descr || '').toLowerCase();
                         return cod.includes(busca) || desc.includes(busca);
                      })
                      .map((c, idx) => {
                        const codStr = c.codigo || c.clasprod || '';
                        const nivel = codStr.length; 
                        const padding = nivel <= 2 ? 'pl-2 font-bold text-zinc-100 bg-zinc-900/50' : nivel <= 4 ? 'pl-6 text-zinc-200' : 'pl-10 text-zinc-400 text-[11px]';

                        return (
                          <div key={idx} onClick={() => { setFiltros({...filtros, classificacao: `${codStr} - ${c.descr}`}); setShowClassDropdown(false); }} className={`py-1.5 pr-2 flex gap-2 hover:bg-blue-600 hover:text-white cursor-pointer border-b border-zinc-700/30 ${padding}`}>
                            <span className="opacity-50 w-14 font-mono">{codStr}</span>
                            <span className="truncate">{c.descr}</span>
                          </div>
                        )
                    })}
                  </div>
                )}
              </div>

            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleFiltrar} className="px-8 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-medium shadow-sm">{loading ? '...' : 'Filtrar'}</button>
              <button onClick={handleConfirmar} className="px-8 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-medium shadow-sm">OK</button>
              <button onClick={onClose} className="px-8 bg-zinc-700 hover:bg-zinc-600 text-white py-1.5 rounded text-sm font-medium shadow-sm">Cancelar</button>
            </div>
          </div>

          <div className="w-56 p-2">
            <span className="text-sm text-zinc-300 mb-2 block">Disponibilidade:</span>
            <div className="space-y-1.5 text-sm text-zinc-400">
              {['De linha', 'Encomenda', 'Fora de linha', 'Fora do mix', 'Não disponível para venda'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer hover:text-zinc-200">
                  <input type="checkbox" className="w-4 h-4 rounded-sm border-zinc-600 bg-transparent accent-blue-600" checked={filtros.disponibilidade.includes(status)} onChange={() => toggleDisponibilidade(status)} />
                  {status}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 flex gap-3 bg-[#18181b] min-h-[300px]">
          {/* Aqui mudamos de overflow-y-auto para overflow-auto, ativando rolagem tanto horizontal quanto vertical */}
          <div className="flex-1 border border-zinc-700 bg-[#09090b] overflow-auto custom-scrollbar">
             <table className="w-full text-xs text-left select-none">
                <tbody>{renderEsquerda}</tbody>
             </table>
          </div>

          <div className="flex flex-col justify-center gap-2">
             <button onClick={moverTodosParaDireita} className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold" title="Mover Todos">&gt;&gt;</button>
             <button onClick={moverParaDireita} className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold" title="Mover Selecionados">&gt;</button>
             <button onClick={moverParaEsquerda} className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold" title="Devolver Selecionados">&lt;</button>
             <button onClick={moverTodosParaEsquerda} className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold" title="Devolver Todos">&lt;&lt;</button>
          </div>

          {/* Aqui também ativamos a barra horizontal com overflow-auto */}
          <div className="flex-1 border border-zinc-700 bg-[#09090b] overflow-auto custom-scrollbar">
            <table className="w-full text-xs text-left select-none">
                <tbody>{renderDireita}</tbody>
             </table>
          </div>
        </div>

      </div>
    </div>
  );
}