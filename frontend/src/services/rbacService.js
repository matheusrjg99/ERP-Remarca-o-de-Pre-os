import api from '@/api/axios';

/**
 * Serviço de RBAC (Role-Based Access Control)
 * Endpoints: /rbac/*
 */

export const rbacService = {
  /**
   * Permissões
   */
  
  /**
   * Lista todas as permissões
   * GET /rbac/permissoes
   */
  getPermissoes: async () => {
    const response = await api.get('/rbac/permissoes');
    return response.data;
  },

  /**
   * Cria uma nova permissão
   * POST /rbac/permissoes
   */
  createPermissao: async (permissaoData) => {
    const response = await api.post('/rbac/permissoes', permissaoData);
    return response.data;
  },

  /**
   * Atualiza uma permissão
   * PUT /rbac/permissoes/{permissao_id}
   */
  updatePermissao: async (permissaoId, permissaoData) => {
    const response = await api.put(`/rbac/permissoes/${permissaoId}`, permissaoData);
    return response.data;
  },

  /**
   * Remove uma permissão
   * DELETE /rbac/permissoes/{permissao_id}
   */
  deletePermissao: async (permissaoId) => {
    const response = await api.delete(`/rbac/permissoes/${permissaoId}`);
    return response.data;
  },

  /**
   * Cargos
   */

  /**
   * Lista todos os cargos
   * GET /rbac/cargos
   */
  getCargos: async () => {
    const response = await api.get('/rbac/cargos');
    return response.data;
  },

  /**
   * Cria um novo cargo
   * POST /rbac/cargos
   */
  createCargo: async (cargoData) => {
    const response = await api.post('/rbac/cargos', cargoData);
    return response.data;
  },

  /**
   * Busca um cargo por ID
   * GET /rbac/cargos/{cargo_id}
   */
  getCargoById: async (cargoId) => {
    const response = await api.get(`/rbac/cargos/${cargoId}`);
    return response.data;
  },

  /**
   * Atualiza um cargo
   * PUT /rbac/cargos/{cargo_id}
   */
  updateCargo: async (cargoId, cargoData) => {
    const response = await api.put(`/rbac/cargos/${cargoId}`, cargoData);
    return response.data;
  },

  /**
   * Remove um cargo
   * DELETE /rbac/cargos/{cargo_id}
   */
  deleteCargo: async (cargoId) => {
    const response = await api.delete(`/rbac/cargos/${cargoId}`);
    return response.data;
  },

  /**
   * Atribui cargo a usuário
   * PUT /rbac/cargos/usuarios/{usuario_id}
   */
  atribuirCargoAoUsuario: async (usuarioId, cargoData) => {
    const response = await api.put(`/rbac/cargos/usuarios/${usuarioId}`, cargoData);
    return response.data;
  },

  /**
   * Busca permissões de um usuário
   * GET /rbac/usuarios/{usuario_id}/permissoes
   */
  getPermissoesDoUsuario: async (usuarioId) => {
    const response = await api.get(`/rbac/usuarios/${usuarioId}/permissoes`);
    return response.data;
  },

  /**
   * Verifica permissão específica de um usuário
   * GET /rbac/usuarios/{usuario_id}/verificar-permissao
   */
  verificarPermissao: async (usuarioId, permissao) => {
    const response = await api.get(`/rbac/usuarios/${usuarioId}/verificar-permissao`, {
      params: { permissao }
    });
    return response.data;
  },
};
