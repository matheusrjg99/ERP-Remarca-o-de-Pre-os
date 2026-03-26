import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ModalLogs({ isOpen, onClose, ambiente }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pegando a data de hoje para o valor padrão inicial YYYY-MM-DD
  const hoje = new Date().toISOString().split('T')[0];
  
  const [filtros, setFiltros] = useState({ 
    data_inicio: hoje, 
    data_fim: hoje, 
    usuario_filtro: '', 
    operacao: '', 
    termo: '' 
  });

  const buscarLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/logs', {
        params: { ...filtros, ambiente }
      });
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao buscar logs. Verifique a conexão ou permissões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isOpen) buscarLogs(); 
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-sans text-zinc-300">
      <div className="bg-[#18181b] border border-zinc-700 w-full max-w-7xl rounded shadow-2xl flex flex-col h-[90vh]">
        
        {/* CABEÇALHO */}
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]">
          <h2 className="font-bold flex items-center gap-2 text-zinc-100">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span> Trilha de Auditoria (Logs)
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-2xl">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* PAINEL LATERAL DE FILTROS AVANÇADOS */}
          <div className="w-72 bg-[#09090b] border-r border-zinc-800 p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            <h3 className="text-blue-400 text-[10px] uppercase font-bold tracking-widest mb-2">Filtros da Pesquisa</h3>
            
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Data Início</label>
              <input type="date" className="w-full bg-[#18181b] border border-zinc-700 p-2 rounded text-sm outline-none focus:border-blue-500 text-zinc-200" value={filtros.data_inicio} onChange={e => setFiltros({...filtros, data_inicio: e.target.value})} />
            </div>
            
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Data Fim</label>
              <input type="date" className="w-full bg-[#18181b] border border-zinc-700 p-2 rounded text-sm outline-none focus:border-blue-500 text-zinc-200" value={filtros.data_fim} onChange={e => setFiltros({...filtros, data_fim: e.target.value})} />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Usuário Responsável</label>
              <input className="w-full bg-[#18181b] border border-zinc-700 p-2 rounded text-sm outline-none focus:border-blue-500 text-zinc-200" placeholder="Login do usuário" value={filtros.usuario_filtro} onChange={e => setFiltros({...filtros, usuario_filtro: e.target.value})} />
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Tipo de Operação</label>
              <select className="w-full bg-[#18181b] border border-zinc-700 p-2 rounded text-sm outline-none text-zinc-200 cursor-pointer" value={filtros.operacao} onChange={e => setFiltros({...filtros, operacao: e.target.value})}>
                <option value="">Todas as Operações</option>
                <option value="ESCRITA/UPDATE">Alterações (Preço/Custo/User)</option>
                <option value="CONSULTA_NOTA">Consultas de Notas</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Texto Livre (Detalhes)</label>
              <input className="w-full bg-[#18181b] border border-zinc-700 p-2 rounded text-sm outline-none focus:border-blue-500 text-zinc-200" placeholder="Ex: Código do produto..." value={filtros.termo} onChange={e => setFiltros({...filtros, termo: e.target.value})} />
            </div>

            <button onClick={buscarLogs} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 mt-4 py-2.5 rounded font-bold text-white transition-all shadow-lg active:scale-95">
              {loading ? 'Buscando...' : 'Aplicar Filtros'}
            </button>
            
            {/* CORRIGIDO AQUI: mudei </label> para </button> */}
            <button onClick={() => setFiltros({ data_inicio: hoje, data_fim: hoje, usuario_filtro: '', operacao: '', termo: '' })} className="w-full bg-transparent border border-zinc-700 hover:bg-zinc-800/50 py-2 rounded font-medium text-zinc-400 text-sm transition-all">
              Limpar Filtros
            </button>
          </div>

          {/* ÁREA DA TABELA DE RESULTADOS */}
          <div className="flex-1 bg-[#18181b] flex flex-col overflow-hidden p-4">
            <div className="flex-1 border border-zinc-800 bg-[#09090b] rounded overflow-hidden flex flex-col shadow-inner">
              
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-zinc-900/80 text-zinc-500 uppercase font-bold sticky top-0 z-10 border-b border-zinc-800">
                    <tr>
                      <th className="p-3 w-16 text-center">ID</th>
                      <th className="p-3 w-40">Data / Hora</th>
                      <th className="p-3 w-32">Usuário</th>
                      <th className="p-3 w-40">Operação</th>
                      <th className="p-3">Detalhes da Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {loading ? (
                      <tr><td colSpan="5" className="p-8 text-center text-zinc-600 animate-pulse">Carregando trilha de auditoria...</td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-zinc-600">Nenhum registro encontrado para os filtros aplicados.</td></tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-800/20 transition-colors group">
                          <td className="p-3 text-center text-zinc-600 font-mono border-r border-zinc-800/50">{log.id}</td>
                          <td className="p-3 text-zinc-400">{log.data_hora}</td>
                          <td className="p-3 text-blue-400 font-medium">{log.usuario_login}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${log.operacao === 'ESCRITA/UPDATE' ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                              {log.operacao}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-300 min-w-[300px] whitespace-normal leading-relaxed">
                            {log.detalhes}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* RODAPÉ DA TABELA */}
              <div className="bg-zinc-900/50 p-2 text-[10px] text-zinc-500 text-right border-t border-zinc-800 tracking-wider">
                Mostrando os últimos {logs.length} registros (Limite: 500)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}