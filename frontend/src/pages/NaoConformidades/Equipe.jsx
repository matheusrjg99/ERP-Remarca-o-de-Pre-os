import React, { useState } from 'react';
import axios from 'axios';
import { Trash2, UserPlus, Users, Edit3, Save } from 'lucide-react';

export default function Equipe({ colaboradores, buscarColabs }) {
  const [novoNome, setNovoNome] = useState("");
  const [novoCargo, setNovoCargo] = useState("");
  const [novoDepartamento, setNovoDepartamento] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const adicionar = () => {
    if (!novoNome.trim()) return;
    setLoading(true);
    
    axios.post(`${API_URL}/colaboradores`, { 
      nome: novoNome, 
      cargo: novoCargo || null, 
      departamento: novoDepartamento || null 
    }, config)
      .then(() => {
        setNovoNome("");
        setNovoCargo("");
        setNovoDepartamento("");
        buscarColabs();
      })
      .catch(err => {
        console.error("Erro ao adicionar:", err);
        alert("Falha ao adicionar Colaborador.");
      })
      .finally(() => setLoading(false));
  };

  const iniciarEdicao = (colab) => {
    setEditandoId(colab.id);
    setFormEdicao({
      nome: colab.nome,
      cargo: colab.cargo || "",
      departamento: colab.departamento || ""
    });
  };

  const salvarEdicao = () => {
    if (!formEdicao.nome.trim()) return;
    setLoading(true);
    
    axios.put(`${API_URL}/colaboradores/${editandoId}`, formEdicao, config)
      .then(() => {
        setEditandoId(null);
        setFormEdicao({ nome: "", cargo: "", departamento: "" });
        buscarColabs();
      })
      .catch(err => {
        console.error("Erro ao editar:", err);
        alert("Falha ao editar colaborador.");
      })
      .finally(() => setLoading(false));
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setFormEdicao({ nome: "", cargo: "", departamento: "" });
  };

  const excluir = (id, nome) => {
    if (window.confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      setLoading(true);
      axios.delete(`${API_URL}/colaboradores/${id}`, config)
        .then(() => buscarColabs())
        .catch(err => {
          console.error("Erro ao excluir:", err);
          alert("Falha ao excluir colaborador.");
        })
        .finally(() => setLoading(false));
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
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
              <UserPlus size={14} /> Novo Colaborador
            </label>
            <div className="flex flex-col gap-3 bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-4 shadow-inner">
              <input 
                className="bg-transparent p-3 text-sm text-white outline-none placeholder:text-zinc-500 font-medium border border-zinc-700 rounded-xl"
                placeholder="Nome completo..."
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && adicionar()}
              />
              <input 
                className="bg-transparent p-3 text-sm text-white outline-none placeholder:text-zinc-500 font-medium border border-zinc-700 rounded-xl"
                placeholder="Cargo (opcional)"
                value={novoCargo}
                onChange={e => setNovoCargo(e.target.value)}
              />
              <input 
                className="bg-transparent p-3 text-sm text-white outline-none placeholder:text-zinc-500 font-medium border border-zinc-700 rounded-xl"
                placeholder="Departamento (opcional)"
                value={novoDepartamento}
                onChange={e => setNovoDepartamento(e.target.value)}
              />
              <button 
                onClick={adicionar} 
                disabled={!novoNome.trim() || loading}
                className="bg-[#3B8ED0] text-white px-6 py-3 rounded-xl hover:bg-[#2d74ab] active:scale-95 transition-all flex items-center justify-center font-black text-[11px] uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-[#3B8ED0]/20"
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
                colaboradores.map(c => (
                  editandoId === c.id ? (
                    // MODO EDIÇÃO
                    <div 
                      key={c.id} 
                      className="flex flex-col gap-2 bg-[#161618] border border-[#3B8ED0]/30 p-4 rounded-2xl"
                    >
                      <input 
                        className="bg-[#0f0f11] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#3B8ED0]"
                        value={formEdicao.nome}
                        onChange={e => setFormEdicao({...formEdicao, nome: e.target.value})}
                        placeholder="Nome"
                      />
                      <input 
                        className="bg-[#0f0f11] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#3B8ED0]"
                        value={formEdicao.cargo}
                        onChange={e => setFormEdicao({...formEdicao, cargo: e.target.value})}
                        placeholder="Cargo"
                      />
                      <input 
                        className="bg-[#0f0f11] border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#3B8ED0]"
                        value={formEdicao.departamento}
                        onChange={e => setFormEdicao({...formEdicao, departamento: e.target.value})}
                        placeholder="Departamento"
                      />
                      <div className="flex gap-2 mt-2">
                        <button 
                          onClick={salvarEdicao}
                          disabled={loading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-1 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                        >
                          <Save size={14} /> Salvar
                        </button>
                        <button 
                          onClick={cancelarEdicao}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    // MODO VISUALIZAÇÃO
                    <div 
                      key={c.id} 
                      className="flex flex-col gap-1 bg-white/[0.02] border border-white/5 p-4 rounded-2xl group hover:border-[#3B8ED0]/30 transition-all border-l-4 border-l-transparent hover:border-l-[#3B8ED0] relative"
                    >
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => iniciarEdicao(c)}
                          className="p-1.5 text-zinc-400 hover:text-[#3B8ED0] hover:bg-[#3B8ED0]/10 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit3 size={14}/>
                        </button>
                        <button 
                          onClick={() => excluir(c.id, c.nome)}
                          className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                      <span className="font-black text-sm text-white uppercase tracking-tight pr-16">
                        {tratarNome(c.nome)}
                      </span>
                      {c.cargo && (
                        <span className="text-[10px] text-zinc-500 font-medium">{c.cargo}</span>
                      )}
                      {c.departamento && (
                        <span className="text-[10px] text-zinc-500 font-medium">{c.departamento}</span>
                      )}
                    </div>
                  )
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
