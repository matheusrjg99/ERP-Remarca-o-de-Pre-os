import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Percent, Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';

export default function ConfiguracaoPercentuais({ config, API_URL }) {
  const [percentuais, setPercentuais] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [novoPercentual, setNovoPercentual] = useState({ descricao: '', percentual: '' });
  const [editandoDados, setEditandoDados] = useState({ descricao: '', percentual: '' });
  const [carregando, setCarregando] = useState(false);

  const buscarPercentuais = async () => {
    setCarregando(true);
    try {
      const response = await axios.get(`${API_URL}/comissoes/percentuais`, config);
      setPercentuais(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erro ao buscar percentuais:", error);
      setPercentuais([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarPercentuais();
  }, []);

  const handleCriarPercentual = async () => {
    if (!novoPercentual.descricao || !novoPercentual.percentual) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      await axios.post(`${API_URL}/comissoes/percentuais`, {
        descricao: novoPercentual.descricao,
        percentual: parseFloat(novoPercentual.percentual)
      }, config);
      
      setNovoPercentual({ descricao: '', percentual: '' });
      buscarPercentuais();
    } catch (error) {
      console.error("Erro ao criar percentual:", error);
      alert("Erro ao criar percentual");
    }
  };

  const handleEditarPercentual = async (id) => {
    if (!editandoDados.descricao || !editandoDados.percentual) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      await axios.put(`${API_URL}/comissoes/percentuais/${id}`, {
        descricao: editandoDados.descricao,
        percentual: parseFloat(editandoDados.percentual)
      }, config);
      
      setEditandoId(null);
      setEditandoDados({ descricao: '', percentual: '' });
      buscarPercentuais();
    } catch (error) {
      console.error("Erro ao editar percentual:", error);
      alert("Erro ao editar percentual");
    }
  };

  const handleDeletarPercentual = async (id) => {
    if (!window.confirm("Tem certeza que deseja desativar este percentual?")) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/comissoes/percentuais/${id}`, config);
      buscarPercentuais();
    } catch (error) {
      console.error("Erro ao desativar percentual:", error);
      alert("Erro ao desativar percentual");
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setEditandoDados({
      descricao: item.descricao,
      percentual: item.percentual.toString()
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditandoDados({ descricao: '', percentual: '' });
  };

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="mb-6 bg-[#09090b] p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Percent size={20} className="text-[#3B8ED0]" />
          <h2 className="text-lg font-black text-zinc-100 uppercase tracking-wider">Configuração de Percentuais</h2>
        </div>
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          Defina os percentuais de perda aplicáveis às comissões em caso de não conformidades
        </p>
      </div>

      {/* FORMULÁRIO DE NOVO PERCENTUAL */}
      <div className="mb-6 bg-[#121215] border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Plus size={14} /> Novo Percentual
        </h3>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Descrição</label>
            <input
              type="text"
              value={novoPercentual.descricao}
              onChange={(e) => setNovoPercentual({ ...novoPercentual, descricao: e.target.value })}
              placeholder="Ex: NC Leve, NC Grave..."
              className="w-full bg-[#09090b] border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-zinc-200 outline-none focus:border-[#3B8ED0] transition-all uppercase"
            />
          </div>
          <div className="w-[150px]">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Percentual (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={novoPercentual.percentual}
              onChange={(e) => setNovoPercentual({ ...novoPercentual, percentual: e.target.value })}
              placeholder="0.00"
              className="w-full bg-[#09090b] border border-zinc-700 rounded-xl px-4 py-3 text-xs font-bold text-zinc-200 outline-none focus:border-[#3B8ED0] transition-all"
            />
          </div>
          <button
            onClick={handleCriarPercentual}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>

      {/* TABELA DE PERCENTUAIS */}
      <div className="flex-1 bg-[#09090b] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#121215] sticky top-0 z-10">
              <tr className="border-b border-zinc-800/80">
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest w-[100px]">ID</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Descrição</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[150px]">Percentual</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[120px]">Status</th>
                <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[140px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {carregando ? (
                <tr><td colSpan="5" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Carregando...</td></tr>
              ) : percentuais.length === 0 ? (
                <tr><td colSpan="5" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest opacity-40">Nenhum percentual cadastrado</td></tr>
              ) : (
                percentuais.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center text-[11px] font-mono font-bold text-[#3B8ED0] bg-[#3B8ED0]/10 px-2.5 py-1 rounded-md border border-[#3B8ED0]/20">
                        #{item.id}
                      </span>
                    </td>
                    
                    {editandoId === item.id ? (
                      <>
                        <td className="px-6 py-5">
                          <input
                            type="text"
                            value={editandoDados.descricao}
                            onChange={(e) => setEditandoDados({ ...editandoDados, descricao: e.target.value })}
                            className="w-full bg-[#121215] border border-[#3B8ED0] rounded-lg px-3 py-2 text-xs font-bold text-zinc-200 outline-none uppercase"
                          />
                        </td>
                        <td className="px-6 py-5 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={editandoDados.percentual}
                            onChange={(e) => setEditandoDados({ ...editandoDados, percentual: e.target.value })}
                            className="w-24 bg-[#121215] border border-[#3B8ED0] rounded-lg px-3 py-2 text-xs font-bold text-zinc-200 outline-none text-right"
                          />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                            Ativo
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleEditarPercentual(item.id)} 
                              className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all" 
                              title="Salvar"
                            >
                              <Save size={16}/>
                            </button>
                            <button 
                              onClick={cancelarEdicao} 
                              className="p-2 text-zinc-400 hover:bg-zinc-700 rounded-lg transition-all" 
                              title="Cancelar"
                            >
                              <X size={16}/>
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">{item.descricao}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="text-sm font-black text-[#3B8ED0]">{item.percentual.toFixed(2)}%</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {item.ativo ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-500 font-black text-[9px] uppercase tracking-widest">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-zinc-600 font-black text-[9px] uppercase tracking-widest">
                              Inativo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => iniciarEdicao(item)} 
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-all" 
                              title="Editar"
                            >
                              <Edit2 size={16}/>
                            </button>
                            <button 
                              onClick={() => handleDeletarPercentual(item.id)} 
                              className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" 
                              title="Excluir"
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* RODAPÉ */}
        <div className="bg-[#121215] border-t border-zinc-800/80 px-6 py-3 flex justify-between items-center">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Total de percentuais: <span className="text-white">{percentuais.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Alterações afetam cálculos futuros</span>
          </div>
        </div>
      </div>
    </div>
  );
}
