import api from '@/api/axios';

/**
 * Serviço de Gestão de Usuários
 * Endpoints: /users, /users/{login_user}/status
 */

export const userService = {
  /**
   * Lista todos os usuários
   * GET /users
   */
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Cria um novo usuário
   * POST /users
   */
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  /**
   * Atualiza o status de um usuário
   * PUT /users/{login_user}/status
   */
  updateStatus: async (loginUser, statusData) => {
    const response = await api.put(`/users/${loginUser}/status`, statusData);
    return response.data;
  },
};
