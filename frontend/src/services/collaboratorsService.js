import api from '@/api/axios';

/**
 * Serviço de Colaboradores
 * Endpoints: /colaboradores, /colaboradores/{colaborador_id}
 */

export const collaboratorsService = {
  /**
   * Lista todos os colaboradores
   * GET /colaboradores
   */
  getAll: async () => {
    const response = await api.get('/colaboradores');
    return response.data;
  },

  /**
   * Cria um novo colaborador
   * POST /colaboradores
   */
  create: async (colaboradorData) => {
    const response = await api.post('/colaboradores', colaboradorData);
    return response.data;
  },

  /**
   * Atualiza um colaborador
   * PUT /colaboradores/{colaborador_id}
   */
  update: async (colaboradorId, colaboradorData) => {
    const response = await api.put(`/colaboradores/${colaboradorId}`, colaboradorData);
    return response.data;
  },

  /**
   * Remove um colaborador
   * DELETE /colaboradores/{colaborador_id}
   */
  delete: async (colaboradorId) => {
    const response = await api.delete(`/colaboradores/${colaboradorId}`);
    return response.data;
  },
};
