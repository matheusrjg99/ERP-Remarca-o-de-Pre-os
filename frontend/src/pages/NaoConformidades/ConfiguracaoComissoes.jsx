import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, DollarSign, Percent, Lock, Users, UserCheck, Power } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { collaboratorsService, commissionsService } from '@/services';
import { error as logError } from '@/utils/logger';

export default function ConfiguracaoComissoes() {
  // ============================================================
  // ESTADO — ABA ATIVA
  // ============================================================
  const [abaAtiva, setAbaAtiva] = useState('configuracoes');

  // ============================================================
  // ESTADO — CONFIGURAÇÕES
  // ============================================================
  const [configuracoes, setConfiguracoes] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoColaboradores, setCarregandoColaboradores] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [novoRegistro, setNovoRegistro] = useState({
    colaborador_id: '',
    salario_base: '',
    percentual_desconto: ''
  });
  const [formularioAberto, setFormularioAberto] = useState(false);

  // ============================================================
  // ESTADO — RELAÇÕES
  // ============================================================
  const [relacoes, setRelacoes] = useState([]);
  const [carregandoRelacoes, setCarregandoRelacoes] = useState(false);
  const [editandoRelacaoId, setEditandoRelacaoId] = useState(null);
  const [novaRelacao, setNovaRelacao] = useState({
    responsavel_id: '',
    subordinado_id: '',
    percentual_desconto: ''
  });
  const [formRelacaoAberto, setFormRelacaoAberto] = useState(false);

  const { permissions, loading: permissionsLoading } = usePermissions();

  const podeConfigurar = permissions.includes('cadastros:comissoes') || 
                         permissions.includes('admin_total') ||
                         permissions.includes('cadastros:*') ||
                         permissions.includes('*');

  const podeEditar = podeConfigurar;
  const podeExcluir = podeConfigurar;

  // ============================================================
  // BUSCAS
  // ============================================================
  const buscarConfiguracoes = async () => {
    setCarregando(true);
    try {
      const response = await commissionsService.getConfiguracoes();
      setConfiguracoes(Array.isArray(response) ? response : []);
    } catch (err) {
      logError('❌ Erro ao buscar configurações:', err);
      setConfiguracoes([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarColaboradores = async () => {
    setCarregandoColaboradores(true);
    try {
      const response = await collaboratorsService.getAll();
      if (Array.isArray(response)) {
        setColaboradores(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setColaboradores(response.data);
      } else {
        setColaboradores([]);
      }
    } catch (err) {
      logError('❌ Erro ao buscar colaboradores:', err);
      setColaboradores([]);
    } finally {
      setCarregandoColaboradores(false);
    }
  };

  const buscarRelacoes = async () => {
    setCarregandoRelacoes(true);
    try {
      const response = await commissionsService.getResponsaveis();
      setRelacoes(Array.isArray(response) ? response : []);
    } catch (err) {
      logError('❌ Erro ao buscar relações:', err);
      setRelacoes([]);
    } finally {
      setCarregandoRelacoes(false);
    }
  };

  // ============================================================
  // EFFECT
  // ============================================================
  useEffect(() => {
    if (podeConfigurar) {
      buscarColaboradores();
      if (abaAtiva === 'configuracoes') {
        buscarConfiguracoes();
      } else {
        buscarRelacoes();
      }
    }
  }, [podeConfigurar, abaAtiva]);

  // ============================================================
  // HANDLERS — CONFIGURAÇÕES
  // ============================================================
  const handleSalvar = async () => {
    if (!podeConfigurar) {
      alert('Você não tem permissão para configurar comissões');
      return;
    }

    if (!novoRegistro.colaborador_id || !novoRegistro.salario_base || !novoRegistro.percentual_desconto) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const dadosEnvio = {
        colaborador_id: parseInt(novoRegistro.colaborador_id),
        salario_base: parseFloat(novoRegistro.salario_base.replace(',', '.')),
        percentual_desconto: parseFloat(novoRegistro.percentual_desconto.replace(',', '.'))
      };

      if (editandoId) {
        await commissionsService.updateConfiguracao(editandoId, dadosEnvio);
      } else {
        await commissionsService.createConfiguracao(dadosEnvio);
      }

      setNovoRegistro({ colaborador_id: '', salario_base: '', percentual_desconto: '' });
      setEditandoId(null);
      setFormularioAberto(false);
      buscarConfiguracoes();
    } catch (err) {
      logError('❌ Erro ao salvar configuração:', err);
      if (err?.response?.status === 403) {
        alert('Você não tem permissão para realizar esta ação');
      } else {
        alert('Erro ao salvar configuração. Verifique se o colaborador já possui configuração.');
      }
    }
  };

  const handleEditar = (config) => {
    if (!podeEditar) return;
    setNovoRegistro({
      colaborador_id: config.colaborador_id,
      salario_base: config.salario_base.toString(),
      percentual_desconto: config.percentual_desconto.toString()
    });
    setEditandoId(config.id);
    setFormularioAberto(true);
  };

  const handleExcluir = async (id) => {
    if (!podeExcluir) return;
    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return;

    try {
      await commissionsService.deleteConfiguracao(id);
      buscarConfiguracoes();
    } catch (err) {
      logError('❌ Erro ao excluir configuração:', err);
      alert('Erro ao excluir configuração');
    }
  };

  const handleCancelar = () => {
    setNovoRegistro({ colaborador_id: '', salario_base: '', percentual_desconto: '' });
    setEditandoId(null);
    setFormularioAberto(false);
  };

  // ============================================================
  // HANDLERS — RELAÇÕES
  // ============================================================
  const handleSalvarRelacao = async () => {
    if (!podeConfigurar) return;

    if (!novaRelacao.responsavel_id || !novaRelacao.subordinado_id) {
      alert('Selecione o responsável e o subordinado');
      return;
    }

    if (novaRelacao.responsavel_id === novaRelacao.subordinado_id) {
      alert('Um colaborador não pode ser responsável de si mesmo');
      return;
    }

    const percentual = parseFloat(String(novaRelacao.percentual_desconto).replace(',', '.')) || 0;

    if (percentual < 0 || percentual > 100) {
      alert('O percentual deve estar entre 0 e 100');
      return;
    }

    try {
      if (editandoRelacaoId) {
        await commissionsService.updateResponsavel(editandoRelacaoId, {
          percentual_desconto: percentual
        });
      } else {
        await commissionsService.createResponsavel({
          responsavel_id: parseInt(novaRelacao.responsavel_id),
          subordinado_id: parseInt(novaRelacao.subordinado_id),
          percentual_desconto: percentual
        });
      }

      setNovaRelacao({ responsavel_id: '', subordinado_id: '', percentual_desconto: '' });
      setEditandoRelacaoId(null);
      setFormRelacaoAberto(false);
      buscarRelacoes();
    } catch (err) {
      logError('❌ Erro ao salvar relação:', err);
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;

      if (status === 409) {
        alert(detail || 'Esta relação já existe');
      } else if (status === 400) {
        alert(detail || 'Dados inválidos');
      } else if (status === 403) {
        alert('Você não tem permissão para realizar esta ação');
      } else {
        alert('Erro ao salvar relação.');
      }
    }
  };

  const handleEditarRelacao = (relacao) => {
    if (!podeEditar) return;
    setNovaRelacao({
      responsavel_id: relacao.responsavel_id,
      subordinado_id: relacao.subordinado_id,
      percentual_desconto: relacao.percentual_desconto.toString()
    });
    setEditandoRelacaoId(relacao.id);
    setFormRelacaoAberto(true);
  };

  const handleToggleAtivoRelacao = async (relacao) => {
    if (!podeEditar) return;
    try {
      await commissionsService.updateResponsavel(relacao.id, {
        ativo: !relacao.ativo
      });
      buscarRelacoes();
    } catch (err) {
      logError('❌ Erro ao alterar status:', err);
      alert('Erro ao alterar status da relação');
    }
  };

  const handleExcluirRelacao = async (id) => {
    if (!podeExcluir) return;
    if (!window.confirm('Tem certeza que deseja excluir esta relação?')) return;

    try {
      await commissionsService.deleteResponsavel(id);
      buscarRelacoes();
    } catch (err) {
      logError('❌ Erro ao excluir relação:', err);
      alert('Erro ao excluir relação');
    }
  };

  const handleCancelarRelacao = () => {
    setNovaRelacao({ responsavel_id: '', subordinado_id: '', percentual_desconto: '' });
    setEditandoRelacaoId(null);
    setFormRelacaoAberto(false);
  };

  // ============================================================
  // HELPERS
  // ============================================================
  const getNomeColaborador = (id) => {
    const colab = colaboradores.find(c => c.id === id);
    return colab ? (colab.nome || colab.nome_colaborador || `Colaborador #${id}`) : 'Desconhecido';
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const formatarPercentual = (valor) => {
    return `${(valor || 0).toFixed(2)}%`;
  };

  // ============================================================
  // FALLBACKS
  // ============================================================
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-zinc-500 text-xs font-black uppercase tracking-widest animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!podeConfigurar) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock size={32} className="text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Acesso Negado</h3>
        <p className="text-zinc-400 text-sm max-w-md">
          Você não tem permissão para acessar as configurações de comissões.
        </p>
        <p className="text-zinc-500 text-xs mt-4">
          Contate o administrador do sistema para solicitar acesso.
        </p>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">

      {/* HEADER COM ABAS */}
      <div className="flex flex-col gap-4 mb-6 bg-[#09090b] p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <DollarSign size={14} className="text-sky-400"/> Configuração de Comissões
            </span>
            <p className="text-xs font-medium text-zinc-400">
              {abaAtiva === 'configuracoes' 
                ? 'Salário base e percentual de desconto por inconsistência de cada colaborador'
                : 'Vínculos entre responsáveis e subordinados (com % específico por relação)'}
            </p>
          </div>

          {/* Abas pill */}
          <div className="flex items-center gap-1 p-1 bg-[#121215] rounded-xl border border-zinc-800">
            <button
              onClick={() => setAbaAtiva('configuracoes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                abaAtiva === 'configuracoes'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <DollarSign size={14} />
              Configurações
              {configuracoes.length > 0 && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                  {configuracoes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setAbaAtiva('relacoes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                abaAtiva === 'relacoes'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Users size={14} />
              Relações
              {relacoes.length > 0 && (
                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
                  {relacoes.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Botão contextual */}
        {abaAtiva === 'configuracoes' && !formularioAberto && (
          <div className="flex justify-end">
            <button 
              onClick={() => setFormularioAberto(true)} 
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-sky-600/20 flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="text-xs font-bold">Nova Configuração</span>
            </button>
          </div>
        )}

        {abaAtiva === 'relacoes' && !formRelacaoAberto && (
          <div className="flex justify-end">
            <button 
              onClick={() => setFormRelacaoAberto(true)} 
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-sky-600/20 flex items-center gap-2"
            >
              <Plus size={18} />
              <span className="text-xs font-bold">Nova Relação</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* ABA CONFIGURAÇÕES */}
      {/* ============================================ */}
      {abaAtiva === 'configuracoes' && (
        <>
          {formularioAberto && (
            <div className="mb-6 bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider">
                  {editandoId ? 'Editar Configuração' : 'Nova Configuração'}
                </h3>
                <button onClick={handleCancelar} className="text-zinc-500 hover:text-zinc-300">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Colaborador</label>
                  <select 
                    className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-sky-500/50 transition-all"
                    value={novoRegistro.colaborador_id}
                    onChange={(e) => setNovoRegistro({...novoRegistro, colaborador_id: e.target.value})}
                    disabled={!!editandoId || carregandoColaboradores}
                  >
                    <option value="">
                      {carregandoColaboradores ? 'Carregando colaboradores...' : 'Selecione...'}
                    </option>
                    {colaboradores.map(colab => (
                      <option key={colab.id} value={colab.id}>
                        {colab.nome || colab.nome_colaborador || `Colaborador #${colab.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={12} /> Salário Base (R$)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Ex: 100.00"
                    className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-sky-500/50 transition-all"
                    value={novoRegistro.salario_base}
                    onChange={(e) => setNovoRegistro({...novoRegistro, salario_base: e.target.value})}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Percent size={12} /> % Desconto por NC
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="Ex: 4.00"
                    className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-sky-500/50 transition-all"
                    value={novoRegistro.percentual_desconto}
                    onChange={(e) => setNovoRegistro({...novoRegistro, percentual_desconto: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleCancelar} 
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <X size={16} />
                  <span className="text-xs font-bold">Cancelar</span>
                </button>
                <button 
                  onClick={handleSalvar} 
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  <span className="text-xs font-bold">{editandoId ? 'Atualizar' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 bg-[#09090b] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-[#121215] sticky top-0 z-10">
                  <tr className="border-b border-zinc-800/80">
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest w-[100px]">ID</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest w-[300px]">Colaborador</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[180px]">Salário Base</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-right w-[180px]">% Desconto</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[150px]">Valor por NC</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[120px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {carregando ? (
                    <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Carregando...</td></tr>
                  ) : configuracoes.length === 0 ? (
                    <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest opacity-40">Nenhuma configuração registrada</td></tr>
                  ) : (
                    configuracoes.map(config => {
                      const valorPorNC = (config.salario_base * config.percentual_desconto) / 100;
                      return (
                        <tr key={config.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="inline-flex items-center text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                              #{config.id}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">
                              {getNomeColaborador(config.colaborador_id)}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <span className="text-xs font-bold text-zinc-300">{formatarMoeda(config.salario_base)}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <span className="text-xs font-bold text-amber-500">{formatarPercentual(config.percentual_desconto)}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <span className="inline-flex items-center text-xs font-black text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md border border-red-500/20">
                              -{formatarMoeda(valorPorNC)}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {podeEditar && (
                                <button 
                                  onClick={() => handleEditar(config)} 
                                  className="text-zinc-500 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-500/10"
                                  title="Editar"
                                >
                                  <Edit size={14} />
                                </button>
                              )}
                              {podeExcluir && (
                                <button 
                                  onClick={() => handleExcluir(config.id)} 
                                  className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-[#121215] border-t border-zinc-800/80 px-6 py-3 flex justify-between items-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Total de configurações: <span className="text-white">{configuracoes.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_8px_#0ea5e9]"></div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Débito percentual fixo por inconsistência</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============================================ */}
      {/* ABA RELAÇÕES */}
      {/* ============================================ */}
      {abaAtiva === 'relacoes' && (
        <>
          {formRelacaoAberto && (
            <div className="mb-6 bg-[#121215] border border-zinc-800 rounded-2xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-zinc-200 uppercase tracking-wider">
                  {editandoRelacaoId ? 'Editar Relação' : 'Nova Relação'}
                </h3>
                <button onClick={handleCancelarRelacao} className="text-zinc-500 hover:text-zinc-300">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck size={12} /> Responsável
                  </label>
                  <select 
                    className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-sky-500/50 transition-all"
                    value={novaRelacao.responsavel_id}
                    onChange={(e) => setNovaRelacao({...novaRelacao, responsavel_id: e.target.value})}
                    disabled={!!editandoRelacaoId || carregandoColaboradores}
                  >
                    <option value="">Selecione...</option>
                    {colaboradores.map(colab => (
                      <option key={colab.id} value={colab.id}>
                        {colab.nome || colab.nome_colaborador || `Colaborador #${colab.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Users size={12} /> Subordinado
                  </label>
                  <select 
                    className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-sky-500/50 transition-all"
                    value={novaRelacao.subordinado_id}
                    onChange={(e) => setNovaRelacao({...novaRelacao, subordinado_id: e.target.value})}
                    disabled={!!editandoRelacaoId || carregandoColaboradores}
                  >
                    <option value="">Selecione...</option>
                    {colaboradores
                      .filter(c => String(c.id) !== String(novaRelacao.responsavel_id))
                      .map(colab => (
                        <option key={colab.id} value={colab.id}>
                          {colab.nome || colab.nome_colaborador || `Colaborador #${colab.id}`}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                    <Percent size={12} /> % Desconto da Relação
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="Ex: 1.00"
                    className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-sky-500/50 transition-all"
                    value={novaRelacao.percentual_desconto}
                    onChange={(e) => setNovaRelacao({...novaRelacao, percentual_desconto: e.target.value})}
                  />
                  <span className="text-[9px] text-zinc-500 italic">
                    Use 0% para subordinados em treinamento
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  onClick={handleCancelarRelacao} 
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <X size={16} />
                  <span className="text-xs font-bold">Cancelar</span>
                </button>
                <button 
                  onClick={handleSalvarRelacao} 
                  className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                >
                  <Save size={16} />
                  <span className="text-xs font-bold">{editandoRelacaoId ? 'Atualizar' : 'Salvar'}</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 bg-[#09090b] rounded-2xl border border-zinc-800/80 overflow-hidden shadow-2xl flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-[#121215] sticky top-0 z-10">
                  <tr className="border-b border-zinc-800/80">
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest w-[80px]">ID</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Responsável</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest">Subordinado</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[140px]">% Relação</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[120px]">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-zinc-500 uppercase tracking-widest text-center w-[140px]">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {carregandoRelacoes ? (
                    <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest">Carregando...</td></tr>
                  ) : relacoes.length === 0 ? (
                    <tr><td colSpan="6" className="py-32 text-center text-zinc-600 font-black uppercase text-xs tracking-widest opacity-40">Nenhuma relação registrada</td></tr>
                  ) : (
                    relacoes.map(rel => (
                      <tr key={rel.id} className={`hover:bg-white/[0.03] transition-colors group ${!rel.ativo ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="inline-flex items-center text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20">
                            #{rel.id}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <UserCheck size={14} className="text-sky-400 shrink-0" />
                            <span className="text-sm font-black text-zinc-200 uppercase tracking-tight">
                              {rel.nome_responsavel}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Users size={14} className="text-zinc-500 shrink-0" />
                            <span className="text-sm font-bold text-zinc-300 uppercase tracking-tight">
                              {rel.nome_subordinado}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {rel.percentual_desconto === 0 ? (
                            <span className="inline-flex items-center text-[10px] font-bold text-zinc-500 bg-zinc-800/50 px-2.5 py-1 rounded-md border border-zinc-700/50">
                              Treinamento
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-black text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                              {formatarPercentual(rel.percentual_desconto)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          {rel.ativo ? (
                            <span className="inline-flex items-center text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                              ATIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[10px] font-black text-zinc-500 bg-zinc-800/50 px-2.5 py-1 rounded-md border border-zinc-700/50">
                              INATIVO
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {podeEditar && (
                              <button 
                                onClick={() => handleToggleAtivoRelacao(rel)} 
                                className={`transition-colors p-1.5 rounded-lg ${
                                  rel.ativo 
                                    ? 'text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10' 
                                    : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                                title={rel.ativo ? 'Desativar' : 'Ativar'}
                              >
                                <Power size={14} />
                              </button>
                            )}
                            {podeEditar && (
                              <button 
                                onClick={() => handleEditarRelacao(rel)} 
                                className="text-zinc-500 hover:text-sky-400 transition-colors p-1.5 rounded-lg hover:bg-sky-500/10"
                                title="Editar %"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {podeExcluir && (
                              <button 
                                onClick={() => handleExcluirRelacao(rel.id)} 
                                className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10"
                                title="Excluir"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-[#121215] border-t border-zinc-800/80 px-6 py-3 flex justify-between items-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Total de relações: <span className="text-white">{relacoes.length}</span>
                {relacoes.filter(r => !r.ativo).length > 0 && (
                  <span className="ml-2 text-zinc-600">
                    ({relacoes.filter(r => !r.ativo).length} inativa{relacoes.filter(r => !r.ativo).length > 1 ? 's' : ''})
                  </span>
                )}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_8px_#0ea5e9]"></div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                  % específico por relação • 0% para treinamento
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}