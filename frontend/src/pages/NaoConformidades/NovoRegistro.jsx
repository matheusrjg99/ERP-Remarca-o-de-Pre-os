import React, { useState } from 'react';
import axios from 'axios';
import { Save, User, FileText, Calendar } from 'lucide-react';

export default function NovoRegistro({ aoSalvar, colaboradores }) {
  const [colaborador, setColaborador] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataCustom, setDataCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!colaborador) return alert("Selecione um Colaborador.");
    if (!descricao.trim()) return alert("A descrição é obrigatória.");

    setLoading(true);

    const payload = {
      colaborador,
      descricao,
      data_custom: dataCustom || null
    };

    axios.post(`${API_URL}/api/nc/registros`, payload, config)
      .then(() => {
        setColaborador('');
        setDescricao('');
        setDataCustom('');
        if (aoSalvar) aoSalvar(); 
      })
      .catch(err => {
        console.error("Erro ao salvar:", err);
        alert("Falha ao registrar ocorrência.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-2xl mx-auto pt-6 animate-in fade-in duration-300">
      <div className="bg-[#0f0f11] border border-white/10 w-full rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#3B8ED0]" />
              <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Novo Registro</h3>
            </div>
            {/* Texto clareado para zinc-300 */}
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
              Lançamento de Inconsistência
            </span>
          </div>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="p-8 flex flex-col gap-6 bg-black/20">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colaborador */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
                <User size={14} /> Colaborador
              </label>
              <div className="bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-1">
                {/* Texto mudado para text-white */}
                <select 
                  className="w-full bg-transparent p-3 text-sm font-medium text-white outline-none cursor-pointer appearance-none"
                  value={colaborador}
                  onChange={e => setColaborador(e.target.value)}
                >
                  <option value="" className="bg-[#0f0f11]">Selecione...</option>
                  {colaboradores.map(n => (
                    <option key={n} value={n} className="bg-[#0f0f11]">{tratarNome(n)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* DATA RETROATIVA */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
                  <Calendar size={14} /> Data (Opcional)
                </label>
              </div>
              <div className="bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-1">
                {/* Texto text-white */}
                <input 
                  type="date" 
                  className="w-full bg-transparent p-3 text-sm font-medium text-white outline-none css-invert-calendar opacity-90 focus:opacity-100 transition-opacity"
                  value={dataCustom}
                  onChange={e => setDataCustom(e.target.value)}
                  title="Deixe em branco para usar a data atual"
                />
              </div>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
              <FileText size={14} /> Descrição da Ocorrência
            </label>
            <div className="bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-1">
              <textarea 
                className="w-full bg-transparent p-3 text-sm text-white outline-none resize-none min-h-[140px] custom-scrollbar placeholder:text-zinc-500"
                placeholder="Descreva o erro técnico de forma objetiva..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a0c] flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={loading || !colaborador || !descricao.trim()}
            className="bg-[#3B8ED0] text-white px-8 py-3.5 rounded-xl hover:bg-[#2d74ab] active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-[#3B8ED0]/20"
          >
            {loading ? "Processando..." : <><Save size={16} /> Registrar</>}
          </button>
        </div>

      </div>
    </div>
  );
}