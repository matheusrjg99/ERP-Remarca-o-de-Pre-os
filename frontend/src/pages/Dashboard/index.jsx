import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import api from '../../api/axios';
import LogoSophon from '../../components/LogoSophon';
import ToggleSwitch from './components/ToggleSwitch';
import ResizableHeader from './components/ResizableHeader';
import ProductRow from './components/ProductRow';

import { adaptarProdutoDeEntrada } from './utils/adapters';
import { COLUNAS } from './utils/columnsConfig';
import { recalcularProduto } from './utils/calculations';

// CARGA PREGUIÇOSA (Lazy Loading) DOS MODAIS
const CustomizeModal = lazy(() => import('./components/CustomizeModal'));
const ModalPesquisa = lazy(() => import('../../components/ModalPesquisa'));
const ModalSelecaoNota = lazy(() => import('./components/ModalSelecaoNota'));
const ModalUsuarios = lazy(() => import('../../components/ModalUsuarios'));
const ModalLogs = lazy(() => import('../../components/ModalLogs'));

export default function Dashboard({ onLogout, onVoltarMenu }) {
  const usuarioLogadoId = localStorage.getItem('usuario') || "matheus"; 

  const [registro, setRegistro] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [selecionados, setSelecionados] = useState([]); 
  const [ambiente, setAmbiente] = useState('demo');
  const [opcoes, setOpcoes] = useState({ mkp: false, custo: false });
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [preferencias, setPreferencias] = useState({});
  const estiloHeader = useMemo(() => preferencias['__header__'] || {}, [preferencias]);
  
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [modalPesquisaOpen, setModalPesquisaOpen] = useState(false); 
  
  const [modalNotaOpen, setModalNotaOpen] = useState(false);
  const [notasDisponiveis, setNotasDisponiveis] = useState([]);

  // ESTADOS DE ADMINISTRAÇÃO
  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [modalLogsOpen, setModalLogsOpen] = useState(false);
  
  const nivelAcesso = localStorage.getItem('nivel_acesso');

  // ==========================================
  // LÓGICA DE PREFERÊNCIAS SALVAS NO BANCO
  // ==========================================
  
  useEffect(() => {
    const carregarPrefsDoBanco = async () => {
      try {
        const res = await api.get('/api/usuario/preferencias');
        if (res.data && Object.keys(res.data).length > 0) {
          setPreferencias(res.data);
          localStorage.setItem(`prefs_${usuarioLogadoId}`, JSON.stringify(res.data));
        } else {
          const cache = localStorage.getItem(`prefs_${usuarioLogadoId}`);
          if (cache) setPreferencias(JSON.parse(cache));
        }
      } catch (e) {
        console.error("Modo offline para preferências.");
        const cache = localStorage.getItem(`prefs_${usuarioLogadoId}`);
        if (cache) setPreferencias(JSON.parse(cache));
      }
    };
    
    carregarPrefsDoBanco();
  }, [usuarioLogadoId]);

  const handleAtualizarPreferencias = useCallback(async (novasPreferencias) => {
    setPreferencias(novasPreferencias);
    localStorage.setItem(`prefs_${usuarioLogadoId}`, JSON.stringify(novasPreferencias));
    
    try {
      await api.put('/api/usuario/preferencias', { preferencias: novasPreferencias });
    } catch (error) {
      console.error("Erro ao sincronizar preferências com o banco de dados.", error);
    }
  }, [usuarioLogadoId]);

  // ==========================================

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setModalPesquisaOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const buscar = async (isNumOrd = false, overrideRegistro = null) => {
    try {
      const termoBusca = overrideRegistro || registro;
      if (!termoBusca) return;

      const url = `/api/produto/${termoBusca}?ambiente=${ambiente}${isNumOrd ? '&is_numord=true' : ''}`;
      const res = await api.get(url);

      if (res.data && res.data.action === "select_note") {
        setNotasDisponiveis(res.data.notes);
        setModalNotaOpen(true);
        return;
      }

      const dados = Array.isArray(res.data) ? res.data : [res.data];
      setProdutos(dados.map(adaptarProdutoDeEntrada));
      setSelecionados([]);
      setSortConfig({ key: null, direction: 'asc' }); 
    } catch { 
      alert("Erro na busca ou registro não encontrado."); 
    }
  };

  const handleSelectNota = (numord) => {
    setModalNotaOpen(false);  
    buscar(true, numord); 
  };

  const handleProdutosSelecionadosDoModal = useCallback(async (codigos) => {
    setLoadingAcao(true);
    try {
      const res = await api.post(`/api/produtos-lote?ambiente=${ambiente}`, { 
        codigos: codigos 
      });
      
      const dados = Array.isArray(res.data) ? res.data : [res.data];
      
      setProdutos(dados.map(adaptarProdutoDeEntrada));
      setSelecionados([]); 
      setSortConfig({ key: null, direction: 'asc' });

    } catch (err) {
      alert("Erro ao buscar os detalhes dos produtos em lote.");
    } finally {
      setLoadingAcao(false);
    }
  }, [ambiente]);

  const requestSort = useCallback((key) => {
    setSortConfig((prevConfig) => {
      let novaDirecao = 'asc';
      if (prevConfig.key === key && prevConfig.direction === 'asc') novaDirecao = 'desc';

      setProdutos((prevProdutos) => {
        return [...prevProdutos].sort((a, b) => {
          let valA = a[key] !== null && a[key] !== undefined ? a[key] : ''; 
          let valB = b[key] !== null && b[key] !== undefined ? b[key] : '';
          
          if (typeof valA === 'number' && typeof valB === 'number') {
             return novaDirecao === 'asc' ? valA - valB : valB - valA;
          }
          
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          
          if (valA < valB) return novaDirecao === 'asc' ? -1 : 1;
          if (valA > valB) return novaDirecao === 'asc' ? 1 : -1;
          return 0;
        });
      });

      return { key, direction: novaDirecao };
    });
  }, []);

  const handleCellEdit = useCallback((index, campoEditado, valorDigitado) => {
    setProdutos((prevProdutos) => {
      const novosProdutos = [...prevProdutos];
      novosProdutos[index] = recalcularProduto(novosProdutos[index], campoEditado, valorDigitado);
      return novosProdutos;
    });
  }, []);

  const toggleSelecionarTudo = useCallback(() => {
    setSelecionados((prev) => prev.length === produtos.length ? [] : produtos.map(p => p.id));
  }, [produtos]);

  const toggleCheck = useCallback((id) => {
    setSelecionados((prev) => prev.includes(id) ? prev.filter(cod => cod !== id) : [...prev, id]);
  }, []);

  const handleRemarcarSelecionados = async () => {
    if (selecionados.length === 0) return;
    setLoadingAcao(true);
    let erros = 0;
    
    const produtosMarcados = produtos.filter(p => selecionados.includes(p.id));

    for (let p of produtosMarcados) {
      try {
        if (opcoes.mkp) {
          await api.put(`/api/atualizar-mkp`, null, { params: { codigo: p.id, novo_mkp: p.markup.toFixed(4), ambiente } });
        }
        
        if (opcoes.custo) {
          await api.put(`/api/atualizar-custo`, null, { params: { codigo: p.id, novo_custo: p.custo.toFixed(4), ambiente } });
        }
        
        const precoRemarcacao = p.precoEditado ? p.atual : p.sugerido;
        await api.put(`/api/remarcar`, null, { params: { codigo: p.id, novo_preco: precoRemarcacao.toFixed(4), ambiente } });

      } catch (error) { 
        console.error(`Erro ao processar o produto ${p.id}:`, error);
        erros++; 
      }
    }
      
    setOpcoes({...opcoes, mkp: false});
    setOpcoes({...opcoes, custo: false});

    if (erros === 0 || produtosMarcados.length > erros) {
      try {
        const codigosAtualizados = produtosMarcados.map(p => p.id);
        const promises = codigosAtualizados.map(codigo => api.get(`/api/produto/${codigo}?ambiente=${ambiente}`));
        const responses = await Promise.all(promises);
        
        const produtosFresquinhos = responses.map(res => {
          const dados = Array.isArray(res.data) ? res.data[0] : res.data;
          return adaptarProdutoDeEntrada(dados);
        });

        setProdutos(prevProdutos => prevProdutos.map(p => {
          const atualizado = produtosFresquinhos.find(novo => novo.id === p.id);
          return atualizado ? atualizado : p;
        }));
      } catch (err) {
        console.error("Erro ao dar refresh nos itens atualizados", err);
      }
    }

    setLoadingAcao(false);
    
    if (erros > 0) {
      alert(`Processo concluído, mas ${erros} itens tiveram erro. Verifique o console (F12).`);
    } else {
      setSelecionados([]); 
    }
  };

  const tabelaRenderizada = useMemo(() => {
    if (produtos.length === 0) {
      return <tr><td colSpan={COLUNAS.length} className="py-16 text-center text-zinc-500">Nenhum produto listado. Pressione <kbd className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 mx-1 text-zinc-300">F3</kbd> para pesquisa avançada.</td></tr>;
    }
    return produtos.map((p, i) => (
      <ProductRow 
        key={p.id} 
        produto={p} 
        colunas={COLUNAS} 
        index={i} 
        isSelected={selecionados.includes(p.id)} 
        onToggleCheck={toggleCheck} 
        onCellEdit={handleCellEdit} 
        preferencias={preferencias} 
      />
    ));
  }, [produtos, selecionados, preferencias, handleCellEdit, toggleCheck]);


  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-300 font-sans selection:bg-blue-500/30 pb-10">

      <Suspense fallback={<div className="hidden">Loading...</div>}>
        {modalConfigOpen && (
          <CustomizeModal 
            isOpen={modalConfigOpen}
            onClose={() => setModalConfigOpen(false)}
            colunas={COLUNAS}
            preferencias={preferencias}
            onAtualizarPreferencias={handleAtualizarPreferencias} 
          />
        )}

        {modalPesquisaOpen && (
          <ModalPesquisa 
            isOpen={modalPesquisaOpen}
            onClose={() => setModalPesquisaOpen(false)}
            onSelect={handleProdutosSelecionadosDoModal}
            ambiente={ambiente}
          />
        )}

        {modalNotaOpen && (
          <ModalSelecaoNota 
            isOpen={modalNotaOpen}
            onClose={() => setModalNotaOpen(false)}
            notas={notasDisponiveis}
            onSelect={handleSelectNota}
          />
        )}

        {modalUserOpen && (
          <ModalUsuarios 
            isOpen={modalUserOpen}
            onClose={() => setModalUserOpen(false)}
          />
        )}

        {modalLogsOpen && (
          <ModalLogs 
            isOpen={modalLogsOpen}
            onClose={() => setModalLogsOpen(false)}
            ambiente={ambiente}
          />
        )}
      </Suspense>

      <nav className="bg-[#09090b] border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onVoltarMenu} 
            className="flex items-center justify-center hover:opacity-80 transition-opacity focus:outline-none group"
            title="Voltar ao Portal"
          >
            <LogoSophon className="h-6 w-auto text-zinc-100 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all" />
          </button>
          <div className="h-4 w-[1px] bg-zinc-800"></div>
          <span className="text-xs font-semibold text-zinc-500 tracking-widest uppercase">Remarcação</span>
        </div>

        <div className="flex items-center gap-4">
          
          {/* MENU ADMIN (Dropdown Limpo) */}
          {nivelAcesso === 'ADMIN' && (
            <div className="relative group mr-2">
              {/* Botão Gatilho Limpo */}
              <button className="bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 py-1.5 px-4 rounded-md text-sm font-medium text-zinc-300 transition-all shadow-sm">
                Admin
              </button>

              {/* Corpo do Dropdown com "Ponte Invisível" (pt-2) */}
              <div className="absolute right-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right group-hover:translate-y-0 translate-y-1">
                <div className="bg-[#121215] border border-zinc-800/80 rounded-lg shadow-2xl p-1.5 flex flex-col gap-1">
                  
                  <button 
                    onClick={() => setModalUserOpen(true)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Usuários
                  </button>
                  
                  <button 
                    onClick={() => setModalLogsOpen(true)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 rounded-md transition-all text-left"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Logs
                  </button>
                  
                </div>
              </div>
            </div>
          )}

          <div className="h-5 w-[1px] bg-zinc-800"></div>
          
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 py-1 px-3 rounded-md shadow-sm">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">BD:</span>
            <span className={`w-1.5 h-1.5 rounded-full ${ambiente === 'producao' ? 'bg-emerald-500' : ambiente === 'demo' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
            <select className="bg-transparent text-sm font-medium text-zinc-300 outline-none cursor-pointer pr-4" value={ambiente} onChange={e => setAmbiente(e.target.value)}>
              <option value="producao" className="bg-zinc-900">ENTER</option><option value="demo" className="bg-zinc-900">DEMO</option><option value="treina" className="bg-zinc-900">TREINA</option>
            </select>
          </div>
          
          <button onClick={onLogout} className="text-sm font-medium text-rose-500 hover:text-rose-400 transition-colors px-2">Sair</button>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-6 py-8">

        <div className="bg-[#18181b] border border-zinc-800/80 rounded-lg p-3 mb-6 flex flex-wrap justify-between gap-4 shadow-sm">
          <div className="flex gap-2 w-full max-w-md">
            <input 
              className="w-full bg-[#09090b] border border-zinc-800 rounded px-4 py-2 outline-none focus:border-blue-500 font-mono text-zinc-200" 
              placeholder="Pesquisar ou F3..." 
              value={registro} 
              onChange={e => setRegistro(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && buscar()} 
            />
            <button onClick={() => buscar()} className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded text-white font-medium shadow-sm transition-colors">Buscar</button>
            <button onClick={() => setModalPesquisaOpen(true)} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-3 py-2 rounded text-zinc-300 font-medium shadow-sm transition-colors" title="Pesquisa Avançada (F3)">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>
          <div className="flex items-center gap-4">

          <button 
            onClick={() => setModalConfigOpen(true)} 
            className={`flex items-center justify-center border w-8 h-8 rounded-md text-sm transition-all shadow-sm ${
              modalConfigOpen 
                ? 'bg-blue-600 border-blue-500 text-white rotate-90' 
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            ⚙️
          </button>

            <div className="flex gap-5 pr-4 border-r border-zinc-800">
              <ToggleSwitch label="Atualizar MKP" checked={opcoes.mkp} onChange={() => setOpcoes({...opcoes, mkp: !opcoes.mkp})} />
              <ToggleSwitch label="Atualizar Custo" checked={opcoes.custo} onChange={() => setOpcoes({...opcoes, custo: !opcoes.custo})} />
            </div>
            <button onClick={toggleSelecionarTudo} className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">{selecionados.length === produtos.length && produtos.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}</button>
            <button onClick={handleRemarcarSelecionados} disabled={selecionados.length === 0 || loadingAcao} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-2 rounded font-medium shadow-sm transition-colors">{loadingAcao ? 'Processando...' : `Remarcar (${selecionados.length})`}</button>
          </div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800/80 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-230px)] relative custom-scrollbar">
            <table className="w-full text-[12px] text-left table-fixed">
              <thead className="sticky top-0 z-20 shadow-md">
                <tr 
                  style={{ 
                    backgroundColor: estiloHeader.bg || 'transparent',
                    transition: 'background-color 0.2s' 
                  }}
                >
                  {COLUNAS.map((col) => (
                    <ResizableHeader
                      key={col.key}
                      label={col.key === 'check' ? (
                        <input 
                          type="checkbox" 
                          onChange={toggleSelecionarTudo} 
                          checked={produtos.length > 0 && selecionados.length === produtos.length} 
                          className="accent-blue-600 cursor-pointer" 
                        />
                      ) : col.label}
                      sortKey={col.key} 
                      sortable={col.sortable} 
                      currentSort={sortConfig} 
                      requestSort={requestSort} 
                      initialWidth={col.width} 
                      align={col.align} 
                      userId={usuarioLogadoId}
                      estiloHeader={estiloHeader} 
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {tabelaRenderizada}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}