import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { X, Send, MessageSquare, Trash2, ShieldCheck, User, Lock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function ModalContestacao({ registro, aoFechar, aoAtualizarLista }) {
  const [texto, setTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [statusLocal, setStatusLocal] = useState(registro.status_contestacao || 'ABERTO');
  
  // Estado para Admin trocar entre Responder (Auditoria) ou Contestar (Lado do Operador)
  const [modoContestador, setModoContestador] = useState(false);

  const token = localStorage.getItem('access_token');
  const nomeUsuario = localStorage.getItem('usuario') || 'Usuário'; 
  const nivelAcesso = localStorage.getItem('nivel_acesso') || 'OPERADOR'; 
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const infrator = tratarNome(registro.colaborador);

  const buscarHistorico = useCallback(() => {
    if (!registro?.id) return;
    setCarregando(true);
    axios.get(`${API_URL}/api/nc/registros/${registro.id}/contestacoes`, config)
      .then(res => setHistorico(Array.isArray(res.data) ? res.data : []))
      .catch(() => setHistorico([]))
      .finally(() => setCarregando(false));
  }, [registro?.id, API_URL]);

  useEffect(() => { buscarHistorico(); }, [buscarHistorico]);

  // --- FUNÇÃO DE ELIMINAR (RESTAURADA) ---
  const excluirMensagem = (id) => {
    if (!window.confirm("Deseja realmente apagar esta mensagem?")) return;
    axios.delete(`${API_URL}/api/nc/contestacoes/${id}`, config)
      .then(() => {
        buscarHistorico();
        if (aoAtualizarLista) aoAtualizarLista();
      });
  };

  const enviar = () => {
    if (!texto.trim() || carregando) return;

    // Se o Admin estiver em modo contestador, adicionamos uma tag oculta [C]
    const textoFinal = modoContestador ? `[C] ${texto}` : texto;
    
    const payload = {
      id_registro: registro.id,
      autor: tratarNome(nomeUsuario),
      texto: textoFinal
    };

    axios.post(`${API_URL}/api/nc/contestacoes`, payload, config)
      .then(() => {
        setTexto("");
        buscarHistorico();
        if (aoAtualizarLista) aoAtualizarLista();
      });
  };

  const resolverCaso = (decisao) => {
    if (!window.confirm(`Aplicar veredicto: ${decisao}?`)) return;
    setCarregando(true);
    axios.put(`${API_URL}/api/nc/registros/${registro.id}/resolver`, { status_contestacao: decisao }, config)
      .then(() => {
        setStatusLocal(decisao);
        if (aoAtualizarLista) aoAtualizarLista();
      })
      .finally(() => setCarregando(false));
  };

  if (!registro) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#121215]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[#3B8ED0]" />
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">Auditoria</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID #{registro.id}</span>
              <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                statusLocal === 'ABERTO' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                statusLocal === 'DEFERIDO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                'bg-red-500/10 text-red-500 border-red-500/20'
              }`}>
                {statusLocal === 'ABERTO' ? (historico.length === 0 ? 'Sem Contestação' : 'Em Análise') : statusLocal === 'DEFERIDO' ? 'Defesa Aceite' : 'Inconsistência Mantida'}
              </span>
            </div>
          </div>
          <button onClick={aoFechar} className="text-zinc-500 hover:text-white transition-all"><X size={24}/></button>
        </div>

        {/* INFO DA OCORRÊNCIA */}
        <div className="px-6 py-4 bg-[#161618] border-b border-zinc-800">
          <p className="text-[9px] text-[#3B8ED0] font-black uppercase tracking-[0.2em] mb-1">Registo Inicial contra {infrator}</p>
          <p className="text-sm text-zinc-300 font-medium leading-relaxed">"{registro.descricao}"</p>
        </div>

        {/* HISTÓRICO / CHAT */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-[#09090b] custom-scrollbar relative">
          {statusLocal !== 'ABERTO' && <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]"><ShieldCheck size={300} /></div>}

          {historico.length === 0 && !carregando ? (
            <div className="text-center py-20 opacity-20 text-xs font-black uppercase tracking-widest">Aguardando manifestação...</div>
          ) : (
            historico.map((item) => {
              const isTagContestador = item.texto.startsWith("[C] ");
              const isContestante = tratarNome(item.autor) === infrator || isTagContestador;
              const textoExibicao = isTagContestador ? item.texto.replace("[C] ", "") : item.texto;

              return (
                <div key={item.id} className={`flex flex-col w-[85%] ${isContestante ? 'self-start' : 'self-end'}`}>
                  <div className={`p-4 rounded-2xl border group transition-all ${
                    isContestante 
                      ? 'bg-[#121215] border-zinc-800 border-l-4 border-l-[#3B8ED0] rounded-tl-sm' 
                      : 'bg-[#18181b] border-zinc-800 border-r-4 border-r-amber-500 rounded-tr-sm'
                  }`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {isContestante ? <User size={13} className="text-[#3B8ED0]"/> : <ShieldCheck size={13} className="text-amber-500"/>}
                        <span className={`text-xs font-black uppercase ${isContestante ? 'text-zinc-200' : 'text-amber-400'}`}>{tratarNome(item.autor)}</span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase ${isContestante ? 'bg-[#3B8ED0]/10 text-[#3B8ED0]' : 'bg-amber-500/10 text-amber-500'}`}>
                          {isContestante ? 'Contestante' : 'Auditoria'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-zinc-600 font-bold">{item.data}</span>
                        
                        {/* BOTÃO DE ELIMINAR (VOLTOU!) */}
                        {statusLocal === 'ABERTO' && (
                          <button onClick={() => excluirMensagem(item.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] text-zinc-300 leading-relaxed font-medium">"{textoExibicao}"</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ÁREA DE RESPOSTA */}
        <div className="border-t border-zinc-800 bg-[#121215]">
          {statusLocal !== 'ABERTO' ? (
            <div className="p-6 flex items-center justify-center gap-3 text-zinc-500">
              <Lock size={16} /> <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ocorrência Encerrada</p>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-4">
              
              {/* BOTÕES DE ADMIN (VEREDICTO + SELETOR DE PAPEL) */}
              {nivelAcesso === 'ADMIN' && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/50 pb-4">
                  
                  {/* SELETOR DE IDENTIDADE (AQUI ESTÁ O NOVO BOTÃO) */}
                  <div className="flex bg-black p-1 rounded-xl border border-zinc-800">
                    <button 
                      onClick={() => setModoContestador(false)}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        !modoContestador ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <ShieldCheck size={12} /> Auditoria
                    </button>
                    <button 
                      onClick={() => setModoContestador(true)}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                        modoContestador ? 'bg-[#3B8ED0] text-white shadow-lg shadow-[#3B8ED0]/20' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <User size={12} /> Contestar
                    </button>
                  </div>

                  {/* BOTÕES DE VEREDICTO */}
                  <div className="flex gap-2">
                    <button onClick={() => resolverCaso('DEFERIDO')} className="text-[9px] font-black text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 px-4 py-2 rounded-xl uppercase transition-all">Deferir</button>
                    <button onClick={() => resolverCaso('INDEFERIDO')} className="text-[9px] font-black text-red-500 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-xl uppercase transition-all">Manter NC</button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 bg-black p-2 rounded-2xl border border-zinc-800 focus-within:border-[#3B8ED0]/40 transition-all">
                <textarea 
                  className="flex-1 bg-transparent p-2 text-sm text-zinc-100 outline-none resize-none h-14 placeholder:text-zinc-700" 
                  placeholder={modoContestador ? "Escreva a sua defesa..." : "Escreva a nota de auditoria..."}
                  value={texto} 
                  onChange={e => setTexto(e.target.value)} 
                />
                <button 
                  onClick={enviar} 
                  disabled={!texto.trim() || carregando} 
                  className={`px-6 rounded-xl transition-all flex items-center justify-center ${modoContestador ? 'bg-[#3B8ED0]' : 'bg-amber-500'} text-white shadow-lg`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}