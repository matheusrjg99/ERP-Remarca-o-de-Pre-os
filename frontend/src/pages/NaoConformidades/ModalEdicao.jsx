import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, User, FileText, Lock } from 'lucide-react';
import Can from '../../components/Can';
import { nonConformitiesService } from '@/services';

const ModalEdicao = ({ registro, colaboradores, aoFechar, aoSalvar }) => {
  const [form, setForm] = useState({
    descricao: '',
    status: 'Pendente'
  });

  useEffect(() => {
    if (registro) {
      setForm({
        descricao: registro.descricao,
        status: registro.status || 'Pendente'
      });
    }
  }, [registro]);

  // Função Capitalize para padronizar o select
  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  if (!registro) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Envia apenas a descrição, status é gerenciado pelo fluxo de auditoria
    const dadosParaSalvar = { descricao: form.descricao };
    try {
      await nonConformitiesService.updateById(registro.id, dadosParaSalvar);
      aoSalvar();
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Falha ao salvar alterações.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Can 
        permission="nc:editar" 
        fallback={<ModalSemPermissao aoFechar={aoFechar} />}
      >
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
            
            {/* COLABORADOR (SOMENTE LEITURA) */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] text-[#3B8ED0] font-black uppercase tracking-widest">
                <User size={14} /> Responsável
              </label>
              <div className="bg-[#161618] rounded-2xl border border-white/10 p-3">
                <span className="text-sm font-medium text-zinc-400">
                  {tratarNome(registro.nome_colaborador)}
                </span>
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

            {/* STATUS (SOMENTE LEITURA) */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                Status (somente leitura)
              </label>
              <div className="bg-[#161618] rounded-2xl border border-white/10 p-3 opacity-60 cursor-not-allowed">
                <span className="text-sm font-medium text-zinc-400">
                  {form.status}
                </span>
              </div>
              <p className="text-[9px] text-zinc-600 font-bold mt-1">
                * O status só pode ser alterado através do fluxo de contestação/auditoria
              </p>
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
              disabled={!form.descricao.trim()}
              className="bg-[#3B8ED0] text-white px-8 py-3.5 rounded-xl hover:bg-[#2d74ab] active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest disabled:opacity-20 shadow-lg shadow-[#3B8ED0]/20"
            >
              <Save size={16} />
              Salvar Alterações
            </button>
          </div>

        </form>
      </Can>
    </div>
  );
};

// Componente de fallback para quando não há permissão de edição
function ModalSemPermissao({ aoFechar }) {
  return (
    <div className="bg-[#0f0f11] border border-white/10 w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
      {/* CABEÇALHO */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-red-500" />
            <h3 className="text-lg font-black text-white tracking-tighter uppercase italic">Acesso Negado</h3>
          </div>
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
            Permissão Necessária
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

      {/* CONTEÚDO */}
      <div className="p-8 flex flex-col items-center justify-center text-center bg-black/20">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock size={32} className="text-red-500" />
        </div>
        <h4 className="text-base font-bold text-white mb-2">
          Você não tem permissão para editar
        </h4>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          Para realizar edições em não conformidades, é necessário ter a permissão <span className="text-red-400 font-bold">nc:editar</span>.
        </p>
        <p className="text-zinc-500 text-xs">
          Contate o administrador do sistema para solicitar acesso.
        </p>
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-white/5 bg-[#0a0a0c] flex justify-end">
        <button 
          onClick={aoFechar} 
          className="px-6 py-3.5 rounded-xl font-black text-[11px] text-zinc-500 uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

export default ModalEdicao;