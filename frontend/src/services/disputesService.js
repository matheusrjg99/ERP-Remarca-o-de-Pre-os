import api from '@/api/axios';

/**
 * Serviço de Contestações
 * Endpoints: /contestacoes, /contestacoes/{nc_id}
 */

export const disputesService = {
  /**
   * Busca contestação por ID da não conformidade
   * GET /contestacoes/{nc_id}
   */
  getByNcId: async (ncId) => {
    const response = await api.get(`/contestacoes/${ncId}`);
    return response.data;
  },

  /**
   * Cria uma nova contestação
   * POST /contestacoes
   */
  create: async (disputeData) => {
    const response = await api.post('/contestacoes', disputeData);
    return response.data;
  },
};
