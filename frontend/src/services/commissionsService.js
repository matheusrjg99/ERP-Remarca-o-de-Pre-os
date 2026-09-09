import api from '@/api/axios';

/**
 * Serviço de Comissões
 * Endpoints: /comissoes/configuracoes, /comissoes/configuracoes/{config_id}, /comissoes/relatorio, /comissoes/minha-comissao
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

  /**
   * Busca a comissão do usuário logado
   * GET /comissoes/minha-comissao?mes=X&ano=Y
   * 
   * @param {number} mes - Mês para filtro (opcional)
   * @param {number} ano - Ano para filtro (opcional)
   * @returns {Promise<Object>} Dados da comissão do usuário
   * 
   * Exemplo de resposta:
   * {
   *   colaborador_id: 19,
   *   nome_colaborador: "ALEX",
   *   salario_base: 2000.00,
   *   percentual_desconto: 4.0,
   *   valor_por_nc: 80.00,
   *   total_ncs: 3,
   *   valor_total_desconto: 240.00,
   *   salario_final: 1760.00,
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
};