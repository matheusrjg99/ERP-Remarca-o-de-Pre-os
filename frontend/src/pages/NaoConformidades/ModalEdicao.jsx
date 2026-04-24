import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, User, FileText } from 'lucide-react';

const ModalEdicao = ({ registro, colaboradores, aoFechar, aoSalvar }) => {
  const [form, setForm] = useState({ colaborador: '', descricao: '' });

  useEffect(() => {
    if (registro) {
      setForm({ colaborador: registro.colaborador, descricao: registro.descricao });
    }
  }, [registro]);

  // Função Capitalize para padronizar o select
  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  if (!registro) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    aoSalvar(form); 
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <form 
        onSubmit={handleSubmit} 
        className="bg-[#0f0f11] border border-white/10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Edit3 size={18} className="text-[#3B8ED0]" />
              <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Editar Registro</h3>
            </div>
            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
              Identificador #{registro.id}
            </span>
          </div>
          <button 
            type="button" 
            onClick={aoFechar} 
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24}/>
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <div className="p-8 flex flex-col gap-6 bg-black/20">
          
          {/* RESPONSÁVEL */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
              <User size={14} /> Responsável
            </label>
            <div className="bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-1">
              <select 
                className="w-full bg-transparent p-3 text-sm font-medium text-white outline-none cursor-pointer appearance-none"
                value={form.colaborador}
                onChange={e => setForm({ ...form, colaborador: e.target.value })}
              >
                <option value="" className="bg-[#0f0f11]">Selecione...</option>
                {colaboradores.map(n => (
                  <option key={n} value={n} className="bg-[#0f0f11]">{tratarNome(n)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* DESCRIÇÃO DO ERRO */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
              <FileText size={14} /> Descrição da Ocorrência
            </label>
            <div className="bg-[#161618] rounded-2xl border border-white/10 focus-within:border-[#3B8ED0]/40 transition-all p-1">
              <textarea 
                className="w-full bg-transparent p-3 text-sm text-white outline-none resize-none min-h-[140px] custom-scrollbar placeholder:text-zinc-500"
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
          </div>

        </div>

        {/* FOOTER (AÇÕES) */}
        <div className="p-6 border-t border-white/5 bg-[#0a0a0c] flex justify-end gap-3">
          <button 
            type="button" 
            onClick={aoFechar} 
            className="px-6 py-3.5 rounded-xl font-black text-[11px] text-zinc-500 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={!form.colaborador || !form.descricao.trim()}
            className="bg-[#3B8ED0] text-white px-8 py-3.5 rounded-xl hover:bg-[#2d74ab] active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-[#3B8ED0]/20"
          >
            <Save size={16} />
            Salvar Alterações
          </button>
        </div>

      </form>
    </div>
  );
};

export default ModalEdicao;