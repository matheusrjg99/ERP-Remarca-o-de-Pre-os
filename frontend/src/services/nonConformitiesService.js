import api from '@/api/axios';

/**
 * Serviço de Não Conformidades
 * Endpoints: /nao-conformidades, /nao-conformidades/{nc_id}/*
 */

export const nonConformitiesService = {
  /**
   * Lista todas as não conformidades
   * GET /nao-conformidades
   */
  getAll: async (filters = {}) => {
    const response = await api.get('/nao-conformidades', { params: filters });
    return response.data;
  },

  /**
   * Busca não conformidades por mês/ano
   * GET /nao-conformidades?mes=X&ano=Y
   */
  getByMonth: async (mes, ano, colaborador_id = null, status = null) => {
    const params = { mes, ano };
    if (colaborador_id) params.colaborador_id = colaborador_id;
    if (status) params.status = status;
    
    const response = await api.get('/nao-conformidades', { params });
    return response.data;
  },

  /**
   * Cria uma nova não conformidade
   * POST /nao-conformidades
   */
  create: async (ncData) => {
    const response = await api.post('/nao-conformidades', ncData);
    return response.data;
  },

  /**
   * Atualiza uma não conformidade
   * PUT /nao-conformidades/{nc_id}
   */
  update: async (ncId, ncData) => {
    const response = await api.put(`/nao-conformidades/${ncId}`, ncData);
    return response.data;
  },

  /**
   * Remove uma não conformidade
   * DELETE /nao-conformidades/{nc_id}
   */
  delete: async (ncId) => {
    const response = await api.delete(`/nao-conformidades/${ncId}`);
    return response.data;
  },

  /**
   * Deferir uma não conformidade
   * POST /nao-conformidades/{nc_id}/deferir
   */
  deferir: async (ncId) => {
    const response = await api.post(`/nao-conformidades/${ncId}/deferir`);
    return response.data;
  },

  /**
   * Indeferir uma não conformidade
   * POST /nao-conformidades/{nc_id}/indeferir
   */
  indeferir: async (ncId) => {
    const response = await api.post(`/nao-conformidades/${ncId}/indeferir`);
    return response.data;
  },

  /**
   * Resolver uma não conformidade
   * POST /nao-conformidades/{nc_id}/resolver
   */
  resolver: async (ncId, resolutionData) => {
    const response = await api.post(`/nao-conformidades/${ncId}/resolver`, resolutionData);
    return response.data;
  },
};
