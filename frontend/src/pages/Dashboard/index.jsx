import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import ToggleSwitch from './components/ToggleSwitch';
import ResizableHeader from './components/ResizableHeader';
import ProductRow from './components/ProductRow';
import CustomizeModal from './components/CustomizeModal';
import ModalPesquisa from '../../components/ModalPesquisa'; 
import ModalSelecaoNota from './components/ModalSelecaoNota';
import ModalUsuarios from '../../components/ModalUsuarios';
// 1. IMPORTANDO O MODAL DE LOGS
import ModalLogs from '../../components/ModalLogs';

import { adaptarProdutoDeEntrada } from './utils/adapters';
import { COLUNAS } from './utils/columnsConfig';
import { recalcularProduto } from './utils/calculations';

export default function Dashboard({ onLogout }) {
  const usuarioLogadoId = localStorage.getItem('usuario') || "matheus"; 

  const [registro, setRegistro] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [selecionados, setSelecionados] = useState([]); 
  const [ambiente, setAmbiente] = useState('demo');
  const [opcoes, setOpcoes] = useState({ mkp: false, custo: false });
  const [loadingAcao, setLoadingAcao] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [preferencias, setPreferencias] = useState({});
  const [modalConfigOpen, setModalConfigOpen] = useState(false);
  const [modalPesquisaOpen, setModalPesquisaOpen] = useState(false); 
  
  const [modalNotaOpen, setModalNotaOpen] = useState(false);
  const [notasDisponiveis, setNotasDisponiveis] = useState([]);

  // 2. ESTADOS DE ADMINISTRAÇÃO
  const [modalUserOpen, setModalUserOpen] = useState(false);
  const [modalLogsOpen, setModalLogsOpen] = useState(false);
  
  const nivelAcesso = localStorage.getItem('nivel_acesso'); // Lê o nível salvo no Login

  // ==========================================
  // LÓGICA DE PREFERÊNCIAS SALVAS NO BANCO
  // ==========================================
  
  // 1. Ao carregar a tela, tenta puxar do banco. Se falhar, puxa do localStorage.
  useEffect(() => {
    const carregarPrefsDoBanco = async () => {
      try {
        const res = await api.get('/api/usuario/preferencias');
        if (res.data && Object.keys(res.data).length > 0) {
          setPreferencias(res.data);
          localStorage.setItem(`prefs_${usuarioLogadoId}`, JSON.stringify(res.data));
        } else {
          // Se não tem nada no banco, usa o cache local
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

  // 2. Quando o usuário altera uma cor/regra no CustomizeModal, salva no banco.
  const handleAtualizarPreferencias = useCallback(async (novasPreferencias) => {
    // Atualiza a tela (Optimistic UI) e o cache
    setPreferencias(novasPreferencias);
    localStorage.setItem(`prefs_${usuarioLogadoId}`, JSON.stringify(novasPreferencias));
    
    // Manda para o Backend de forma assíncrona
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

      <CustomizeModal 
        isOpen={modalConfigOpen}
        onClose={() => setModalConfigOpen(false)}
        colunas={COLUNAS}
        preferencias={preferencias}
        onAtualizarPreferencias={handleAtualizarPreferencias} 
      />

      <ModalPesquisa 
        isOpen={modalPesquisaOpen}
        onClose={() => setModalPesquisaOpen(false)}
        onSelect={handleProdutosSelecionadosDoModal}
        ambiente={ambiente}
      />

      <ModalSelecaoNota 
        isOpen={modalNotaOpen}
        onClose={() => setModalNotaOpen(false)}
        notas={notasDisponiveis}
        onSelect={handleSelectNota}
      />

      <ModalUsuarios 
        isOpen={modalUserOpen}
        onClose={() => setModalUserOpen(false)}
      />

      {/* 3. COLOCANDO O COMPONENTE MODAL_LOGS NA TELA */}
      <ModalLogs 
        isOpen={modalLogsOpen}
        onClose={() => setModalLogsOpen(false)}
        ambiente={ambiente}
      />

      <nav className="bg-[#09090b] border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center"><span className="text-white font-bold text-xs">ERP</span></div>
          <span className="font-semibold text-zinc-100 tracking-tight">CF</span>
        </div>

        <div className="flex items-center gap-4">
          {/* 4. BOTÕES DE ADMINISTRAÇÃO LADO A LADO */}
          {nivelAcesso === 'ADMIN' && (
            <div className="flex gap-2 mr-2">
              <button 
                onClick={() => setModalUserOpen(true)}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-700 py-1.5 px-3 rounded-md text-sm text-zinc-300 transition-all shadow-sm"
              >
                Usuários
              </button>
              <button 
                onClick={() => setModalLogsOpen(true)}
                className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-700 py-1.5 px-3 rounded-md text-sm text-zinc-300 transition-all shadow-sm"
              >
                Ver Logs
              </button>
            </div>
          )}

          {/* BOTÃO NOVO: VENDAS */}
          <a href="https://casafonseca.saga-apps.com:8443/app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 py-1.5 px-3 rounded-md shadow-sm transition-all group" title="APP Vendas">
            {/* Ícone de Sacola de Compras / Vendas */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-emerald-400 transition-colors">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-medium uppercase tracking-wider transition-colors">Vendas</span>
          </a>
          
          <a href="http://192.168.0.250:8000/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 py-1.5 px-3 rounded-md shadow-sm transition-all group" title="Acessar Outro Sistema">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-blue-400 transition-colors"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            <span className="text-xs text-zinc-400 group-hover:text-zinc-200 font-medium uppercase tracking-wider transition-colors">Não Conformidades</span>
          </a>
          <div className="h-5 w-[1px] bg-zinc-800"></div>
          
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 py-1 px-3 rounded-md shadow-sm">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">DATABASE:</span>
            <span className={`w-1.5 h-1.5 rounded-full ${ambiente === 'producao' ? 'bg-emerald-500' : ambiente === 'demo' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
            <select className="bg-transparent text-sm font-medium text-zinc-300 outline-none cursor-pointer pr-4" value={ambiente} onChange={e => setAmbiente(e.target.value)}>
              <option value="producao" className="bg-zinc-900">BDENTER</option><option value="demo" className="bg-zinc-900">BDDEMO</option><option value="treina" className="bg-zinc-900">BDTREINA</option>
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
            className="flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 w-8 h-8 rounded-md text-sm text-zinc-300 transition-all shadow-sm"
          >
            ⚙️
          </button>
          <div className="h-5 w-[1px] bg-zinc-800 mx-1"></div>

            <div className="flex gap-5 pr-4 border-r border-zinc-800">
              <ToggleSwitch label="Atualizar MKP" checked={opcoes.mkp} onChange={() => setOpcoes({...opcoes, mkp: !opcoes.mkp})} />
              <ToggleSwitch label="Atualizar Custo" checked={opcoes.custo} onChange={() => setOpcoes({...opcoes, custo: !opcoes.custo})} />
            </div>
            <button onClick={toggleSelecionarTudo} className="text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">{selecionados.length === produtos.length && produtos.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos'}</button>
            <button onClick={handleRemarcarSelecionados} disabled={selecionados.length === 0 || loadingAcao} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-5 py-2 rounded font-medium shadow-sm transition-colors">{loadingAcao ? 'Processando...' : `Remarcar Selecionados (${selecionados.length})`}</button>
          </div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800/80 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] text-left table-fixed">
              <thead>
                <tr>
                  {COLUNAS.map((col) => (
                    <ResizableHeader
                      key={col.key}
                      label={col.key === 'check' ? <input type="checkbox" onChange={toggleSelecionarTudo} checked={produtos.length > 0 && selecionados.length === produtos.length} className="accent-blue-600 cursor-pointer" /> : col.label}
                      sortKey={col.key} sortable={col.sortable} currentSort={sortConfig} requestSort={requestSort} initialWidth={col.width} align={col.align} userId={usuarioLogadoId}
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