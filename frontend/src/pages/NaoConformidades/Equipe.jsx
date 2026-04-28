import React, { useState } from 'react';
import axios from 'axios';
import { Trash2, UserPlus, Users } from 'lucide-react';

export default function Equipe({ colaboradores, buscarColabs }) {
  const [novoNome, setNovoNome] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.250:9000';

  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const adicionar = () => {
    if (!novoNome.trim()) return;
    setLoading(true);
    
    axios.post(`${API_URL}/api/nc/colaboradores`, { nome: novoNome }, config)
      .then(() => {
        setNovoNome(""); 
        buscarColabs();
      })
      .catch(err => {
        console.error("Erro ao adicionar:", err);
        alert("Falha ao adiciona Colaborador.");
      })
      .finally(() => setLoading(false));
  };

  const remover = (nome) => {
    if (window.confirm(`Deseja remover ${tratarNome(nome)} da equipe?`)) {
      axios.delete(`${API_URL}/api/nc/colaboradores/${nome}`, config)
        .then(() => buscarColabs())
        .catch(err => alert("Erro ao remover colaborador."));
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-6 animate-in fade-in duration-300">
      <div className="bg-[#0f0f11] border border-white/10 w-full rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-[#3B8ED0]" />
              <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Colaboradores</h3>
            </div>
            {/* Clareado para zinc-300 */}
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
              Gerenciamento de Equipe
            </span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black bg-[#3B8ED0]/10 text-[#3B8ED0] px-3 py-1 rounded-full border border-[#3B8ED0]/20 uppercase">
            {colaboradores.length} Ativos
          </span>
        </div>

        {/* CORPO PRINCIPAL */}
        <div className="p-8 flex flex-col gap-8 bg-black/20">
          
          {/* INPUT DE ADICIONAR */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
              <UserPlus size={14} /> Novo Colaborador
            </label>
            <div className="flex gap-3 bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-1.5 shadow-inner">
              <input 
                className="flex-1 bg-transparent p-3 text-sm text-white outline-none placeholder:text-zinc-500 font-medium"
                placeholder="Digite o nome completo..."
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionar()}
              />
              <button 
                onClick={adicionar} 
                disabled={!novoNome.trim() || loading}
                className="bg-[#3B8ED0] text-white px-6 rounded-xl hover:bg-[#2d74ab] active:scale-95 transition-all flex items-center justify-center font-black text-[11px] uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-[#3B8ED0]/20"
              >
                {loading ? "..." : "Adicionar"}
              </button>
            </div>
          </div>

          {/* LISTA DE EQUIPE */}
          <div className="flex flex-col gap-3">
            <h4 className="text-[10px] font-black text-zinc-300 uppercase tracking-widest border-b border-white/5 pb-2 mb-2">
              Quadro de Funcionários
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {colaboradores.length === 0 ? (
                <div className="col-span-full text-center py-10 opacity-40">
                  <p className="text-xs font-black text-zinc-300 uppercase tracking-[0.3em]">Nenhum colaborador cadastrado</p>
                </div>
              ) : (
                colaboradores.map(nome => (
                  <div 
                    key={nome} 
                    className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl group hover:border-[#3B8ED0]/30 transition-all border-l-4 border-l-transparent hover:border-l-[#3B8ED0]"
                  >
                    {/* Nome clareado para white nativo em vez de cinza */}
                    <span className="font-black text-sm text-white uppercase tracking-tight">
                      {tratarNome(nome)}
                    </span>
                    <button 
                      onClick={() => remover(nome)} 
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-all"
                      title="Remover Colaborador"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}