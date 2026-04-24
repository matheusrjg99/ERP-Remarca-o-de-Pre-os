import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { Search, Edit3, Trash2, MessageSquare, User, Calendar, ChevronUp, ChevronDown, ChevronsUpDown, ShieldCheck, XCircle, BarChart3 } from 'lucide-react';
import ModalEdicao from "./ModalEdicao";
import ModalContestacao from "./ModalContestacao";

const Consulta = ({ registros, buscarRegistros, mes, setMes, ano, setAno, colaboradores }) => {
  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  
  const [selecionado, setSelecionado] = useState(null);
  const [editando, setEditando] = useState(null);
  const [filtroColab, setFiltroColab] = useState("");
  const [ordem, setOrdem] = useState({ chave: 'id', direcao: 'desc' });

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  // --- LÓGICA DE ESTATÍSTICAS (CAPITALIZE) ---
  const stats = useMemo(() => {
    return {
      total: registros.length,
      pendentes: registros.filter(r => r.qtd_contestacoes > 0 && r.status_contestacao === 'ABERTO').length,
      resolvidos: registros.filter(r => r.status_contestacao && r.status_contestacao !== 'ABERTO').length
    };
  }, [registros]);

  // --- LÓGICA DE FILTRAGEM E ORDENAÇÃO ---
  const registrosProcessados = useMemo(() => {
    let dadosFiltrados = registros.filter(reg => 
      filtroColab === "" ? true : reg.colaborador === filtroColab
    );

    if (ordem.chave) {
      dadosFiltrados.sort((a, b) => {
        let valA = a[ordem.chave] || '';
        let valB = b[ordem.chave] || '';
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return ordem.direcao === 'asc' ? -1 : 1;
        if (valA > valB) return ordem.direcao === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return dadosFiltrados;
  }, [registros, filtroColab, ordem]);

  const alternarOrdenacao = (chave) => {
    setOrdem(prev => ({
      chave,
      direcao: prev.chave === chave && prev.direcao === 'asc' ? 'desc' : 'asc'
    }));
  };

  const acaoExcluir = (id) => {
    const senha = prompt("SENHA DE ADMIN PARA EXCLUIR:");
    if (senha === "66197700") {
      axios.delete(`${API_URL}/api/nc/registros/${id}`, config).then(() => buscarRegistros());
    }
  };

  const Th = ({ label, chave, width = "auto" }) => (
    <th 
      className={`px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-white transition-all select-none ${width}`}
      onClick={() => alternarOrdenacao(chave)}
    >
      <div className="flex items-center gap-2">
        {label}
        {ordem.chave === chave ? (
          ordem.direcao === 'asc' ? <ChevronUp size={12} className="text-[#3B8ED0]" /> : <ChevronDown size={12} className="text-[#3B8ED0]" />
        ) : <ChevronsUpDown size={12} className="opacity-10" />}
      </div>
    </th>
  );

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER: RESUMO (ESQUERDA) E FILTROS (DIREITA) */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 bg-[#09090b] p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
        
        {/* RESUMO (Preenche o vazio da esquerda) */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <BarChart3 size={14} className="text-[#3B8ED0]"/> Resumo
            </span>
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400">Total de Registros:</span>
                <span className="text-xs font-black text-white">{stats.total}</span>
              </div>
              <div className="bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/20 flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-500/70">Pendentes:</span>
                <span className="text-xs font-black text-amber-500">{stats.pendentes}</span>
              </div>
              <div className="bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-500/70">Resolvidos:</span>
                <span className="text-xs font-black text-emerald-500">{stats.resolvidos}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS (Direita) */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden focus-within:border-[#3B8ED0]/50 transition-all shadow-inner">
            <div className="flex items-center px-4 border-r border-zinc-800 bg-black/20 text-[#3B8ED0]"><Calendar size={14} /></div>
            <select className="bg-transparent text-xs font-bold text-zinc-200 px-4 py-3 outline-none uppercase cursor-pointer" value={mes} onChange={e => setMes(e.target.value)}>
              {mesesNomes.map((n, i) => <option key={n} value={i + 1} className="bg-[#09090b]">{n}</option>)}
            </select>
            <input type="number" className="bg-transparent border-l border-zinc-800 text-xs font-bold text-zinc-200 w-24 px-4 outline-none text-center" value={ano} onChange={e => setAno(e.target.value)} />
          </div>

          <div className="flex bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden min-w-[280px] focus-within:border-[#3B8ED0]/50 transition-all shadow-inner">
            <div className="flex items-center px-4 border-r border-zinc-800 bg-black/20 text-[#3B8ED0]"><User size={14} /></div>
            <select className="bg-transparent text-xs font-bold text-zinc-200 px-4 py-3 outline-none w-full uppercase cursor-pointer" value={filtroColab} onChange={e => setFiltroColab(e.target.value)}>
              <option value="" className="bg-[#09090b]">Todos os Operadores</option>
              {colaboradores.map(n => <option key={n} value={n} className="bg-[#09090b]">{tratarNome(n)}</option>)}
            </select>
          </div>

          <button onClick={buscarRegistros} className="bg-[#3B8ED0] hover:bg-[#2d74ab] text-white p-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#3B8ED0]/20">
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* TABELA PREMIUM */}
      <div className="flex-1 bg-[#09090b] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#121215] sticky top-0 z-10">
              <tr className="border-b border-zinc-800/80">
                <Th label="ID" chave="id" width="w-[100px]" />
                <Th label="Data" chave="data" width="w-[140px]" />
                <Th label="Colaborador" chave="colaborador" width="w-[240px]" />
                <Th label="Ocorrência" chave="descricao" />
                <Th label="Status" chave="status_contestacao" width="w-[160px]" />
                <th className="px-6 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right w-[140px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {registrosProcessados.length === 0 ? (
                <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest opacity-40">Nenhum dado processado</td></tr>
              ) : (
                registrosProcessados.map(reg => (
                  <tr key={reg.id} onDoubleClick={() => setSelecionado(reg)} className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center text-[11px] font-mono font-bold text-[#3B8ED0] bg-[#3B8ED0]/10 px-2.5 py-1 rounded-md border border-[#3B8ED0]/20">
                        #{reg.id}
                      </span>
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-[12px] font-mono text-zinc-500">{reg.data}</span>
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">{tratarNome(reg.colaborador)}</span>
                    </td>
                    
                    {/* OCORRÊNCIA EM ALTA DEFINIÇÃO (BRANCO PURO / SEM ITÁLICO / FONTE MAIOR) */}
                    <td className="px-6 py-5">
                      <p className="text-[15px] text-white font-semibold leading-relaxed group-hover:drop-shadow-[0_0_1px_rgba(255,255,255,0.5)] transition-all">
                        {reg.descricao}
                      </p>
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap">
                      {reg.status_contestacao === 'DEFERIDO' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-black text-[9px] uppercase tracking-widest">
                          <ShieldCheck size={14} /> Aceito
                        </span>
                      ) : reg.status_contestacao === 'INDEFERIDO' ? (
                        <span className="inline-flex items-center gap-1.5 text-red-500 font-black text-[9px] uppercase tracking-widest">
                          <XCircle size={14} /> Mantido
                        </span>
                      ) : reg.qtd_contestacoes > 0 ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 font-black px-2.5 py-1.5 rounded-lg border border-amber-500/20 text-[9px] uppercase tracking-widest animate-pulse">
                          <MessageSquare size={13} fill="currentColor" /> {reg.qtd_contestacoes} MSG
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Regular</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setSelecionado(reg)} className="p-2 text-zinc-400 hover:text-[#3B8ED0] hover:bg-[#3B8ED0]/10 rounded-lg transition-all" title="Contestar"><MessageSquare size={16}/></button>
                        <button onClick={() => setEditando(reg)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-all" title="Editar"><Edit3 size={16}/></button>
                        <button onClick={() => acaoExcluir(reg.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Excluir"><Trash2 size={16}/></button>
                      </div>
                    </td>
                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* RODAPÉ INTEGRADO */}
        <div className="bg-[#121215] border-t border-zinc-800/80 px-6 py-3 flex justify-between items-center">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Total do período: <span className="text-white">{registrosProcessados.length}</span> entradas
          </p>
          <div className="flex gap-4">
              <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Aguardando Auditoria</span>
              </div>
          </div>
        </div>
      </div>

      {/* MODAIS */}
      {editando && <ModalEdicao registro={editando} colaboradores={colaboradores} aoFechar={() => setEditando(null)} aoSalvar={(d) => {
          axios.put(`${API_URL}/api/nc/registros/${editando.id}`, d, config).then(() => { setEditando(null); buscarRegistros(); });
      }} />}

      {selecionado && <ModalContestacao registro={selecionado} aoFechar={() => setSelecionado(null)} aoAtualizarLista={buscarRegistros} />}
    </div>
  );
};

export default Consulta;