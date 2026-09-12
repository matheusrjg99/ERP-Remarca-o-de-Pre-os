import api from '@/api/axios';

/**
 * Serviço de Comissões
 * Endpoints:
 *   - /comissoes/configuracoes
 *   - /comissoes/configuracoes/{config_id}
 *   - /comissoes/relatorio
 *   - /comissoes/minha-comissao
 *   - /comissoes/responsaveis
 *   - /comissoes/responsaveis/{relacao_id}
 */

export const commissionsService = {
  // ============================================================
  // CONFIGURAÇÕES DE COMISSÃO
  // ============================================================

  /**
   * Lista configurações de comissões
   * GET /comissoes/configuracoes
   */
  getConfiguracoes: async () => {
    const response = await api.get('/comissoes/configuracoes');
    return response.data;
  },

  /**
   * Cria uma nova configuração de comissão
   * POST /comissoes/configuracoes
   */
  createConfiguracao: async (configData) => {
    const response = await api.post('/comissoes/configuracoes', configData);
    return response.data;
  },

  /**
   * Atualiza uma configuração de comissão
   * PUT /comissoes/configuracoes/{config_id}
   */
  updateConfiguracao: async (configId, configData) => {
    const response = await api.put(`/comissoes/configuracoes/${configId}`, configData);
    return response.data;
  },

  /**
   * Remove uma configuração de comissão
   * DELETE /comissoes/configuracoes/{config_id}
   */
  deleteConfiguracao: async (configId) => {
    const response = await api.delete(`/comissoes/configuracoes/${configId}`);
    return response.data;
  },

  // ============================================================
  // RELATÓRIO
  // ============================================================

  /**
   * Gera relatório de comissões
   * GET /comissoes/relatorio?mes=X&ano=Y
   */
  getRelatorio: async (filters = {}) => {
    const response = await api.get('/comissoes/relatorio', { params: filters });
    return response.data;
  },

  // ============================================================
  // MINHA COMISSÃO (VISÃO DO COLABORADOR LOGADO)
  // ============================================================

  /**
   * Busca a comissão do usuário logado
   * GET /comissoes/minha-comissao?mes=X&ano=Y
   *
   * Resposta esperada:
   * {
   *   colaborador_id: 19,
   *   nome_colaborador: "ALEX",
   *   salario_base: 1500.00,
   *   percentual_desconto: 4.0,
   *   valor_por_nc: 60.00,
   *   total_ncs: 9,
   *   valor_total_desconto: 135.00,
   *   salario_final: 1365.00,
   *   periodo: { mes: 9, ano: 2026 },
   *   ncs: [...]
   * }
   */
  getMinhaComissao: async (mes, ano) => {
    const params = {};
    if (mes) params.mes = mes;
    if (ano) params.ano = ano;

    const response = await api.get('/comissoes/minha-comissao', { params });
    return response.data;
  },

  // ============================================================
  // RELAÇÕES RESPONSÁVEL ↔ SUBORDINADO
  // ============================================================

  /**
   * Lista todas as relações responsável ↔ subordinado
   * GET /comissoes/responsaveis
   *
   * Resposta esperada:
   * [
   *   {
   *     id: 1,
   *     responsavel_id: 19,
   *     nome_responsavel: "ALEX",
   *     subordinado_id: 28,
   *     nome_subordinado: "Matheus Gomes",
   *     percentual_desconto: 1.0,
   *     ativo: true,
   *     criado_em: "2026-09-11T...",
   *     atualizado_em: null
   *   },
   *   ...
   * ]
   */
  getResponsaveis: async () => {
    const response = await api.get('/comissoes/responsaveis');
    return response.data;
  },

  /**
   * Cria uma nova relação responsável ↔ subordinado
   * POST /comissoes/responsaveis
   *
   * Body: { responsavel_id, subordinado_id, percentual_desconto }
   */
  createResponsavel: async (data) => {
    const response = await api.post('/comissoes/responsaveis', data);
    return response.data;
  },

  /**
   * Atualiza uma relação existente (percentual e/ou ativo)
   * PUT /comissoes/responsaveis/{relacao_id}
   *
   * Body (patch parcial): { percentual_desconto?: number, ativo?: boolean }
   */
  updateResponsavel: async (relacaoId, data) => {
    const response = await api.put(`/comissoes/responsaveis/${relacaoId}`, data);
    return response.data;
  },

  /**
   * Exclui uma relação
   * DELETE /comissoes/responsaveis/{relacao_id}
   */
  deleteResponsavel: async (relacaoId) => {
    const response = await api.delete(`/comissoes/responsaveis/${relacaoId}`);
    return response.data;
  },
};