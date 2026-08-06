import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DollarSign, Users, TrendingDown, Calendar, Search, Download } from 'lucide-react';

export default function RelatorioComissoes({ config, API_URL }) {
  const [relatorio, setRelatorio] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [configuracoes, setConfiguracoes] = useState([]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [carregando, setCarregando] = useState(false);

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const buscarRelatorio = async () => {
    setCarregando(true);
    try {
      const response = await axios.get(`${API_URL}/comissoes/relatorio?mes=${mes}&ano=${ano}`, config);
      setRelatorio(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
      setRelatorio([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarColaboradores = async () => {
    try {
      const response = await axios.get(`${API_URL}/colaboradores`, config);
      setColaboradores(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
      setColaboradores([]);
    }
  };

  const buscarConfiguracoes = async () => {
    try {
      const response = await axios.get(`${API_URL}/comissoes/configuracoes`, config);
      setConfiguracoes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      setConfiguracoes([]);
    }
  };

  useEffect(() => {
    buscarRelatorio();
    buscarColaboradores();
    buscarConfiguracoes();
  }, [mes, ano]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const formatarPercentual = (valor) => {
    return `${(valor || 0).toFixed(2)}%`;
  };

  const getTotalGeral = () => {
    return relatorio.reduce((acc, item) => acc + (item.valor_comissao_final || 0), 0);
  };

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER: RESUMO E FILTROS */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 bg-[#09090b] p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
        
        {/* RESUMO */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500"/> Resumo do Mês
            </span>
            <div className="flex items-center gap-3">
              <div className="bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400">Total a Pagar:</span>
                <span className="text-xs font-black text-emerald-500">{formatarMoeda(getTotalGeral())}</span>
              </div>
              <div className="bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800 flex items-center gap-2">
                <span className="text-[11px] font-bold text-zinc-400">Colaboradores:</span>
                <span className="text-xs font-black text-white">{relatorio.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#121215] border border-zinc-800 rounded-xl overflow-hidden focus-within:border-[#3B8ED0]/50 transition-all shadow-inner">
            <div className="flex items-center px-4 border-r border-zinc-800 bg-black/20 text-[#3B8ED0]"><Calendar size={14} /></div>
            <select 
              className="bg-transparent text-xs font-bold text-zinc-200 px-4 py-3 outline-none uppercase cursor-pointer" 
              value={mes} 
              onChange={e => setMes(parseInt(e.target.value))}
            >
              {mesesNomes.map((n, i) => <option key={n} value={i + 1} className="bg-[#09090b]">{n}</option>)}
            </select>
            <input 
              type="number" 
              className="bg-transparent border-l border-zinc-800 text-xs font-bold text-zinc-200 w-24 px-4 outline-none text-center" 
              value={ano} 
              onChange={e => setAno(parseInt(e.target.value))} 
            />
          </div>

          <button 
            onClick={buscarRelatorio} 
            className="bg-[#3B8ED0] hover:bg-[#2d74ab] text-white p-3.5 rounded-xl transition-all active:scale-95 shadow-md shadow-[#3B8ED0]/20"
          >
            <Search size={20} />
          </button>
        </div>
      </div>

      {/* TABELA DE RELATÓRIO */}
      <div className="flex-1 bg-[#09090b] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#121215] sticky top-0 z-10">
              <tr className="border-b border-zinc-800/80">
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest w-[100px]">ID</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest w-[240px]">Colaborador</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[150px]">Comissão Máx.</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[120px]">NCs</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[150px]">Perdas</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[180px]">Comissão Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {carregando ? (
                <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Carregando...</td></tr>
              ) : relatorio.length === 0 ? (
                <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest opacity-40">Nenhum dado processado</td></tr>
              ) : (
                relatorio.map(item => (
                  <tr key={item.colaborador_id} className="hover:bg-white/[0.03] transition-colors group cursor-pointer">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center text-[11px] font-mono font-bold text-[#3B8ED0] bg-[#3B8ED0]/10 px-2.5 py-1 rounded-md border border-[#3B8ED0]/20">
                        #{item.colaborador_id}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">{item.nome_colaborador}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <span className="text-xs font-bold text-zinc-400">{formatarMoeda(item.valor_maximo_comissao)}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center text-[11px] font-bold px-2.5 py-1 rounded-md ${
                        item.total_ncs > 0 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                          : 'bg-zinc-800/50 text-zinc-600'
                      }`}>
                        {item.total_ncs || 0}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <span className={`text-xs font-bold ${
                        item.total_perdas > 0 ? 'text-red-500' : 'text-zinc-600'
                      }`}>
                        {formatarPercentual(item.total_perdas)}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <span className={`text-sm font-black ${
                        item.valor_comissao_final < item.valor_maximo_comissao 
                          ? 'text-amber-500' 
                          : 'text-emerald-500'
                      }`}>
                        {formatarMoeda(item.valor_comissao_final)}
                      </span>
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
            Total de colaboradores: <span className="text-white">{relatorio.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Valor calculado com base nas NCs do período</span>
          </div>
        </div>
      </div>
    </div>
  );
}
