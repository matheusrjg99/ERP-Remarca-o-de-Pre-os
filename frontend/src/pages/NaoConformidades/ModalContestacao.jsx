import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Send, MessageSquare, ShieldCheck, User, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { nonConformitiesService, disputesService } from '@/services';
import { usePermissions } from '@/hooks/usePermissions';

export default function ModalContestacao({ registro, aoFechar, aoAtualizarLista }) {
  const [texto, setTexto] = useState("");
  const [historico, setHistorico] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [statusLocal, setStatusLocal] = useState(registro.status || 'Pendente');
  const [erroPermissao, setErroPermissao] = useState(null);
  
  // Estado para trocar entre Responder (Auditoria) ou Contestar (Lado do Operador)
  const [modoContestador, setModoContestador] = useState(false);

  // Ref para scroll automático
  const historicoRef = useRef(null);

  const nomeUsuario = localStorage.getItem('usuario') || 'Usuário'; 
  const nivelAcesso = localStorage.getItem('nivel_acesso') || 'OPERADOR';
  
  const { permissions } = usePermissions();
  
  // Verificações EXATAS - não usa hierarquia
  const podeContestar = permissions.includes('nc:contestar') || 
                        permissions.includes('admin_total') ||
                        permissions.includes('nc:*');

  const podeAuditar = permissions.includes('nc:auditoria') ||
                      permissions.includes('admin_total') ||
                      permissions.includes('nc:*');

  // Efeito para ajustar o modo inicial baseado nas permissões
  useEffect(() => {
    // Se não tem permissão de auditoria, mas tem de contestação
    if (!podeAuditar && podeContestar) {
      setModoContestador(true);
    }
    // Se não tem nenhuma permissão
    else if (!podeAuditar && !podeContestar) {
      setErroPermissao('Você não tem permissão para acessar este recurso.');
    }
  }, [podeAuditar, podeContestar]);

  const tratarNome = (n) => {
    if (!n) return '';
    return n.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  };

  const infrator = tratarNome(registro.nome_colaborador);

  const buscarHistorico = useCallback(async () => {
    if (!registro?.id) return;
    setCarregando(true);
    try {
      const response = await disputesService.getByNcId(registro.id);
      const historicoData = Array.isArray(response) ? response : [];
      setHistorico(historicoData);
      
      // Se houver mensagens com tag [C], atualiza o status para "Contestada"
      const temContestacao = historicoData.some(item => 
        item.mensagem && item.mensagem.startsWith("[C] ")
      );
      
      if (temContestacao && statusLocal === 'Pendente') {
        setStatusLocal('Contestada');
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      setHistorico([]);
    } finally {
      setCarregando(false);
    }
  }, [registro?.id, statusLocal]);

  useEffect(() => { 
    if (!erroPermissao) {
      buscarHistorico(); 
    }
  }, [buscarHistorico, erroPermissao]);

  // Scroll automático para o final do histórico
  useEffect(() => {
    if (historicoRef.current) {
      historicoRef.current.scrollTop = historicoRef.current.scrollHeight;
    }
  }, [historico]);

  const enviar = async () => {
    if (!texto.trim() || enviando) return;
    
    // Verificação adicional de permissão antes de enviar
    if (modoContestador && !podeContestar) {
      setErroPermissao('Você não tem permissão para contestar esta não conformidade.');
      return;
    }

    // Verificação para auditoria
    if (!modoContestador && !podeAuditar) {
      setErroPermissao('Você não tem permissão para realizar auditoria.');
      return;
    }

    // Se estiver em modo contestador, adicionamos uma tag oculta [C]
    const textoFinal = modoContestador ? `[C] ${texto}` : texto;
    
    const payload = {
      nao_conformidade_id: registro.id,
      mensagem: textoFinal,
      usuario: tratarNome(nomeUsuario)
    };

    setEnviando(true);
    try {
      await disputesService.create(payload);
      
      // Limpa o campo de texto
      setTexto("");
      
      // Se for contestação, atualiza o status local
      if (modoContestador) {
        setStatusLocal('Contestada');
      }
      
      // Recarrega o histórico para mostrar a nova mensagem
      await buscarHistorico();
      
      // Atualiza a lista externa, mas NÃO fecha o modal
      if (aoAtualizarLista) aoAtualizarLista();
      
      // Sucesso silencioso - não fecha o modal
      console.log('✅ Mensagem enviada com sucesso');
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      
      // Verifica se é erro de permissão (403)
      if (error?.response?.status === 403) {
        setErroPermissao('Você não tem permissão para realizar esta ação.');
      } else {
        alert('Erro ao enviar mensagem. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const resolverCaso = async (decisao) => {
    if (!window.confirm(`Aplicar veredicto: ${decisao}?`)) return;
    setCarregando(true);
    
    try {
      // Usa os métodos corretos do serviço
      if (decisao === 'Deferido') {
        await nonConformitiesService.deferir(registro.id);
      } else if (decisao === 'Indeferido') {
        await nonConformitiesService.indeferir(registro.id);
      } else if (decisao === 'Resolvido') {
        await nonConformitiesService.resolver(registro.id, {});
      }
      
      setStatusLocal(decisao);
      if (aoAtualizarLista) aoAtualizarLista();
    } catch (error) {
      console.error("Erro ao aplicar veredicto:", error);
      
      // Verifica se é erro de permissão (403)
      if (error?.response?.status === 403) {
        setErroPermissao('Você não tem permissão para aplicar veredicto.');
      } else {
        alert('Erro ao aplicar veredicto. Tente novamente.');
      }
    } finally {
      setCarregando(false);
    }
  };

  if (!registro) return null;

  // FALLBACK: Se não tem permissão, mostra tela de acesso negado
  if (erroPermissao) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl">
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Lock size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Acesso Negado</h3>
            <p className="text-zinc-400 text-sm mb-6">
              {erroPermissao}
            </p>
            <p className="text-zinc-500 text-xs mb-6">
              Contate o administrador do sistema para solicitar acesso.
            </p>
            <button 
              onClick={aoFechar}
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#121215]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[#3B8ED0]" />
              <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">
                {modoContestador ? 'Contestação' : 'Auditoria'}
              </h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">ID #{registro.id}</span>
              <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase border ${
                statusLocal === 'Pendente' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                statusLocal === 'Deferido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                statusLocal === 'Indeferido' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                statusLocal === 'Resolvido' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                statusLocal === 'Contestada' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>
                {statusLocal === 'Pendente' ? (historico.length === 0 ? 'Sem Contestação' : 'Em Análise') : 
                 statusLocal === 'Deferido' ? 'Defesa Aceite' : 
                 statusLocal === 'Indeferido' ? 'Inconsistência Mantida' : 
                 statusLocal === 'Contestada' ? 'Contestado' : statusLocal}
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
        <div 
          ref={historicoRef}
          className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-[#09090b] custom-scrollbar relative"
        >
          {statusLocal !== 'Pendente' && statusLocal !== 'Contestada' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
              <ShieldCheck size={300} />
            </div>
          )}

          {historico.length === 0 && !carregando ? (
            <div className="text-center py-20 opacity-20 text-xs font-black uppercase tracking-widest">
              Aguardando manifestação...
            </div>
          ) : (
            historico.map((item) => {
              const isTagContestador = item.mensagem && item.mensagem.startsWith("[C] ");
              const isContestante = tratarNome(item.usuario) === infrator || isTagContestador;
              const textoExibicao = isTagContestador ? item.mensagem.replace("[C] ", "") : item.mensagem;

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
                        <span className={`text-xs font-black uppercase ${isContestante ? 'text-zinc-200' : 'text-amber-400'}`}>
                          {tratarNome(item.usuario)}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase ${isContestante ? 'bg-[#3B8ED0]/10 text-[#3B8ED0]' : 'bg-amber-500/10 text-amber-500'}`}>
                          {isContestante ? 'Contestante' : 'Auditoria'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-zinc-600 font-bold">
                          {new Date(item.data_hora).toLocaleString('pt-BR')}
                        </span>
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
          {statusLocal === 'Deferido' || statusLocal === 'Indeferido' || statusLocal === 'Resolvido' ? (
            <div className="p-6 flex items-center justify-center gap-3 text-zinc-500">
              <Lock size={16} /> 
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Ocorrência Encerrada</p>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-4">
              
              {/* SELETOR DE IDENTIDADE (Apenas se tiver ambas as permissões) */}
              {podeAuditar && podeContestar && (
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/50 pb-4">
                  
                  {/* SELETOR DE IDENTIDADE */}
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

                  {/* BOTÕES DE VEREDICTO - Apenas para auditores */}
                  {podeAuditar && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => resolverCaso('Deferido')} 
                        className="text-[9px] font-black text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10 px-4 py-2 rounded-xl uppercase transition-all"
                      >
                        Deferir
                      </button>
                      <button 
                        onClick={() => resolverCaso('Indeferido')} 
                        className="text-[9px] font-black text-red-500 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-xl uppercase transition-all"
                      >
                        Manter NC
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Área de texto */}
              <div className="flex gap-3 bg-black p-2 rounded-2xl border border-zinc-800 focus-within:border-[#3B8ED0]/40 transition-all">
                <textarea 
                  className="flex-1 bg-transparent p-2 text-sm text-zinc-100 outline-none resize-none h-14 placeholder:text-zinc-700" 
                  placeholder={modoContestador ? "Escreva a sua defesa..." : "Escreva a nota de auditoria..."}
                  value={texto} 
                  onChange={e => setTexto(e.target.value)} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                />
                <button 
                  onClick={enviar} 
                  disabled={!texto.trim() || enviando} 
                  className={`px-6 rounded-xl transition-all flex items-center justify-center ${
                    modoContestador ? 'bg-[#3B8ED0]' : 'bg-amber-500'
                  } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {enviando ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}