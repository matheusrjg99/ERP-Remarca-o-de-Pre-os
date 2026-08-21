import api from '@/api/axios';

/**
 * Serviço de Comissões
 * Endpoints: /comissoes/configuracoes, /comissoes/configuracoes/{config_id}, /comissoes/relatorio
 */

export const commissionsService = {
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

  /**
   * Gera relatório de comissões
   * GET /comissoes/relatorio
   */
  getRelatorio: async (filters = {}) => {
    const response = await api.get('/comissoes/relatorio', { params: filters });
    return response.data;
  },
};
