import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, DollarSign, Percent, Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { collaboratorsService, commissionsService } from '@/services';

export default function ConfiguracaoComissoes() {
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

  const { permissions, loading: permissionsLoading } = usePermissions();

  // Verificações de permissão
  const podeConfigurar = permissions.includes('cadastros:comissoes') || 
                         permissions.includes('admin_total') ||
                         permissions.includes('cadastros:*') ||
                         permissions.includes('*');

  const podeEditar = podeConfigurar;
  const podeExcluir = podeConfigurar;

  const buscarConfiguracoes = async () => {
    setCarregando(true);
    try {
      console.log('🔍 [DEBUG] Buscando configurações de comissões...');
      const response = await commissionsService.getConfiguracoes();
      console.log('✅ [DEBUG] Configurações carregadas:', response);
      setConfiguracoes(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao buscar configurações:', error);
      console.error('❌ [DEBUG] Status:', error?.response?.status);
      console.error('❌ [DEBUG] Dados:', error?.response?.data);
      setConfiguracoes([]);
    } finally {
      setCarregando(false);
    }
  };

  const buscarColaboradores = async () => {
    setCarregandoColaboradores(true);
    try {
      console.log('🔍 [DEBUG] Buscando colaboradores...');
      const response = await collaboratorsService.getAll();
      console.log('✅ [DEBUG] Colaboradores carregados:', response);
      
      if (Array.isArray(response)) {
        setColaboradores(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setColaboradores(response.data);
      } else {
        console.warn('⚠️ [DEBUG] Formato inesperado:', response);
        setColaboradores([]);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao buscar colaboradores:', error);
      console.error('❌ [DEBUG] Status:', error?.response?.status);
      console.error('❌ [DEBUG] Dados:', error?.response?.data);
      setColaboradores([]);
    } finally {
      setCarregandoColaboradores(false);
    }
  };

  useEffect(() => {
    if (podeConfigurar) {
      buscarConfiguracoes();
      buscarColaboradores();
    }
  }, [podeConfigurar]);

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

      console.log('🔍 [DEBUG] Salvando configuração:', dadosEnvio);

      if (editandoId) {
        await commissionsService.updateConfiguracao(editandoId, dadosEnvio);
      } else {
        await commissionsService.createConfiguracao(dadosEnvio);
      }

      setNovoRegistro({ colaborador_id: '', salario_base: '', percentual_desconto: '' });
      setEditandoId(null);
      setFormularioAberto(false);
      buscarConfiguracoes();
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao salvar configuração:', error);
      console.error('❌ [DEBUG] Status:', error?.response?.status);
      console.error('❌ [DEBUG] Dados:', error?.response?.data);
      
      if (error?.response?.status === 403) {
        alert('Você não tem permissão para realizar esta ação');
      } else {
        alert('Erro ao salvar configuração. Verifique se o colaborador já possui configuração.');
      }
    }
  };

  const handleEditar = (config) => {
    if (!podeEditar) {
      alert('Você não tem permissão para editar configurações');
      return;
    }

    setNovoRegistro({
      colaborador_id: config.colaborador_id,
      salario_base: config.salario_base.toString(),
      percentual_desconto: config.percentual_desconto.toString()
    });
    setEditandoId(config.id);
    setFormularioAberto(true);
  };

  const handleExcluir = async (id) => {
    if (!podeExcluir) {
      alert('Você não tem permissão para excluir configurações');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir esta configuração?')) return;

    try {
      await commissionsService.deleteConfiguracao(id);
      buscarConfiguracoes();
    } catch (error) {
      console.error('❌ [DEBUG] Erro ao excluir configuração:', error);
      
      if (error?.response?.status === 403) {
        alert('Você não tem permissão para excluir configurações');
      } else {
        alert('Erro ao excluir configuração');
      }
    }
  };

  const handleCancelar = () => {
    setNovoRegistro({ colaborador_id: '', salario_base: '', percentual_desconto: '' });
    setEditandoId(null);
    setFormularioAberto(false);
  };

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

  // Fallback para quando não tem permissão
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

  return (
    <div className="w-full h-full flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-[#09090b] p-5 rounded-2xl border border-zinc-800/50 shadow-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <DollarSign size={14} className="text-violet-500"/> Configuração de Comissões
          </span>
          <p className="text-xs font-medium text-zinc-400">
            Registre o salário base e percentual de desconto por inconsistência de cada colaborador
          </p>
        </div>

        {!formularioAberto && podeConfigurar && (
          <button 
            onClick={() => setFormularioAberto(true)} 
            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md shadow-violet-600/20 flex items-center gap-2"
          >
            <Plus size={18} />
            <span className="text-xs font-bold">Nova Configuração</span>
          </button>
        )}
      </div>

      {/* FORMULÁRIO DE CADASTRO/EDIÇÃO */}
      {formularioAberto && podeConfigurar && (
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
                className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-violet-500/50 transition-all"
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
                className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-violet-500/50 transition-all"
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
                className="bg-[#09090b] border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-200 outline-none focus:border-violet-500/50 transition-all"
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
              className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
            >
              <Save size={16} />
              <span className="text-xs font-bold">{editandoId ? 'Atualizar' : 'Salvar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE CONFIGURAÇÕES */}
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
                        <span className="inline-flex items-center text-[11px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
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
                              className="text-zinc-500 hover:text-violet-400 transition-colors p-1.5 rounded-lg hover:bg-violet-500/10"
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
        
        {/* RODAPÉ */}
        <div className="bg-[#121215] border-t border-zinc-800/80 px-6 py-3 flex justify-between items-center">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Total de configurações: <span className="text-white">{configuracoes.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-violet-500 rounded-full shadow-[0_0_8px_#8b5cf6]"></div>
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Débito percentual fixo por inconsistência</span>
          </div>
        </div>
      </div>
    </div>
  );
}