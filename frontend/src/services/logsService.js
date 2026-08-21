import api from '@/api/axios';

/**
 * Serviço de Logs Administrativos
 * Endpoints: /admin/logs
 */

export const logsService = {
  /**
   * Lista logs administrativos
   * GET /admin/logs
   */
  getAll: async (filters = {}) => {
    const response = await api.get('/admin/logs', { params: filters });
    return response.data;
  },
};
