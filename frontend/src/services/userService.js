import api from '@/api/axios';

/**
 * Serviço de Gestão de Usuários
 * Endpoints: /users, /users/{login_user}, /users/{login_user}/status
 * 
 * IMPORTANTE: O identificador do usuário é o LOGIN (não há id numérico).
 * Sempre use `encodeURIComponent` ao inserir o login na URL,
 * pois logins podem conter espaços (ex: 'matheus gomes').
 */

export const userService = {
  // ==================== LEITURA ====================

  /**
   * Lista todos os usuários
   * GET /users
   * 
   * @returns {Promise<Array>} Lista de usuários com { login, nome, cargo_id, cargo_nome, ativo }
   */
  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  /**
   * Busca um usuário específico pelo login
   * GET /users/{login_user}
   * 
   * @param {string} loginUser - LOGIN do usuário (ex: 'matheus gomes')
   * @returns {Promise<Object>} Dados do usuário
   */
  getByLogin: async (loginUser) => {
    const response = await api.get(`/users/${encodeURIComponent(loginUser)}`);
    return response.data;
  },

  // ==================== CRIAÇÃO ====================

  /**
   * Cria um novo usuário
   * POST /users
   * 
   * @param {Object} userData
   * @param {string} userData.login - Login do usuário (min 3 chars)
   * @param {string} userData.senha - Senha (min 6 chars)
   * @param {string} userData.nome - Nome completo
   * @param {number} userData.cargo_id - ID do cargo
   * @returns {Promise<Object>} { status, mensagem }
   */
  create: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // ==================== ATUALIZAÇÃO ====================

  /**
   * Atualiza PARCIALMENTE os dados de um usuário (nome, senha, cargo_id)
   * PUT /users/{login_user}
   * 
   * IMPORTANTE: apenas os campos enviados são atualizados.
   * Envie só o que mudou.
   * 
   * @param {string} loginUser - LOGIN do usuário
   * @param {Object} userData - Campos a atualizar (nome, senha, cargo_id)
   * @returns {Promise<Object>} { status, mensagem }
   * 
   * Exemplos:
   *   update('joao silva', { nome: 'JOÃO SILVA SANTOS' })
   *   update('joao silva', { senha: 'novaSenha123' })
   *   update('joao silva', { cargo_id: 3 })
   */
  update: async (loginUser, userData) => {
    const response = await api.put(
      `/users/${encodeURIComponent(loginUser)}`,
      userData
    );
    return response.data;
  },

  /**
   * Atualiza o status de um usuário (ativo/inativo)
   * PUT /users/{login_user}/status?ativo=1
   * 
   * IMPORTANTE: o parâmetro `ativo` vai na QUERY STRING (não no body).
   * 
   * @param {string} loginUser - LOGIN do usuário
   * @param {number} ativo - 1 para ativar, 0 para desativar
   * @returns {Promise<Object>} { status, mensagem }
   */
  updateStatus: async (loginUser, ativo) => {
    const response = await api.put(
      `/users/${encodeURIComponent(loginUser)}/status`,
      null,
      { params: { ativo } }
    );
    return response.data;
  },

  // ==================== EXCLUSÃO (SOFT DELETE) ====================

  /**
   * Exclui (soft delete) um usuário — na prática, desativa
   * DELETE /users/{login_user}
   * 
   * Validações no backend:
   * - Não pode excluir a si mesmo
   * - Não pode excluir o último admin ativo
   * 
   * @param {string} loginUser - LOGIN do usuário
   * @returns {Promise<Object>} { status, mensagem }
   */
  delete: async (loginUser) => {
    const response = await api.delete(`/users/${encodeURIComponent(loginUser)}`);
    return response.data;
  },
};

export default userService;