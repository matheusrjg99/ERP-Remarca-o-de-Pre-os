import api from '@/api/axios';

/**
 * Serviço de Autenticação
 * Endpoints: /login, /auth/login, /auth/meus-dados
 */

export const authService = {
  /**
   * Realiza o login do usuário
   * POST /login
   */
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    return response.data;
  },

  /**
   * Realiza login e retorna dados formatados
   * POST /auth/login
   */
  authLogin: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Busca lista de usuários (legado RBAC)
   * GET /auth/usuarios
   */
  getUsuarios: async () => {
    const response = await api.get('/auth/usuarios');
    return response.data;
  },

  /**
   * Busca dados do usuário autenticado
   * GET /auth/meus-dados
   */
  getMeusDados: async () => {
    const response = await api.get('/auth/meus-dados');
    return response.data;
  },
};
