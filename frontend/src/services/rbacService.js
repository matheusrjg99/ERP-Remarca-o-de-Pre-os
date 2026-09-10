import api from '@/api/axios';

/**
 * Serviço de RBAC (Role-Based Access Control)
 * Endpoints: /rbac/*
 * 
 * IMPORTANTE: Permissões são READ-ONLY via API.
 * Criação/edição de permissões deve ser feita via SQL/migration/seed.
 */

export const rbacService = {
  // ==================== PERMISSÕES (READ-ONLY) ====================
  // Apenas consulta. Permissões são criadas via SQL/seed no backend.

  /**
   * Lista todas as permissões
   * GET /rbac/permissoes
   * 
   * @param {Object} params - Filtros opcionais
   * @param {string} params.modulo - Filtrar por módulo (ex: 'nc')
   * @param {boolean} params.ativo - Filtrar apenas ativas (padrão: true)
   * @param {boolean} params.agrupar_por_modulo - Retornar agrupado por módulo
   */
  getPermissoes: async (params = {}) => {
    const response = await api.get('/rbac/permissoes', { params });
    return response.data;
  },

  /**
   * Busca uma permissão por ID
   * GET /rbac/permissoes/{permissao_id}
   */
  getPermissaoById: async (permissaoId) => {
    const response = await api.get(`/rbac/permissoes/${permissaoId}`);
    return response.data;
  },

  // ==================== CARGOS ====================

  /**
   * Lista todos os cargos
   * GET /rbac/cargos
   * 
   * @param {Object} params - Filtros opcionais
   * @param {boolean} params.ativo - Filtrar apenas ativos (padrão: true)
   * @param {boolean} params.incluir_permissoes - Incluir permissões (padrão: true)
   * @param {boolean} params.incluir_usuarios_count - Incluir contagem de usuários
   */
  getCargos: async (params = {}) => {
    const response = await api.get('/rbac/cargos', { params });
    return response.data;
  },

  /**
   * Lista cargos de forma leve (sem permissões).
   * Útil para dropdowns/selects no frontend.
   * GET /rbac/cargos/simples
   */
  getCargosSimples: async (params = {}) => {
    const response = await api.get('/rbac/cargos/simples', { params });
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
   * Lista usuários de um cargo
   * GET /rbac/cargos/{cargo_id}/usuarios
   */
  getUsuariosDoCargo: async (cargoId) => {
    const response = await api.get(`/rbac/cargos/${cargoId}/usuarios`);
    return response.data;
  },

  /**
   * Cria um novo cargo (opcionalmente com permissões iniciais)
   * POST /rbac/cargos
   * 
   * @param {Object} cargoData
   * @param {string} cargoData.nome - Nome do cargo
   * @param {string} [cargoData.descricao] - Descrição opcional
   * @param {boolean} [cargoData.ativo=true] - Status
   * @param {number[]} [cargoData.permissoes_ids] - IDs das permissões iniciais
   */
  createCargo: async (cargoData) => {
    const response = await api.post('/rbac/cargos', cargoData);
    return response.data;
  },

  /**
   * Atualiza um cargo (dados gerais + permissões se fornecidas)
   * PUT /rbac/cargos/{cargo_id}
   * 
   * IMPORTANTE: Se `permissoes_ids` NÃO for enviado, as permissões
   * permanecem inalteradas. Se enviado (mesmo []), substitui TODAS.
   */
  updateCargo: async (cargoId, cargoData) => {
    const response = await api.put(`/rbac/cargos/${cargoId}`, cargoData);
    return response.data;
  },

  /**
   * Substitui APENAS as permissões de um cargo (não altera outros dados)
   * PUT /rbac/cargos/{cargo_id}/permissoes
   * 
   * @param {number} cargoId
   * @param {number[]} permissoesIds - Lista de IDs. Envie [] para remover todas.
   */
  atribuirPermissoesAoCargo: async (cargoId, permissoesIds) => {
    const response = await api.put(`/rbac/cargos/${cargoId}/permissoes`, {
      permissoes_ids: permissoesIds,
    });
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

  // ==================== USUÁRIO-CARGO ====================
  // NOTA: A API /users expõe apenas o LOGIN como identificador.
  // Por isso, os métodos abaixo recebem `usuarioLogin` (string) em vez de id numérico.

  /**
   * Atribui cargo a um usuário
   * PUT /rbac/usuarios/{usuario_login}/cargo
   * 
   * @param {string} usuarioLogin - LOGIN do usuário (ex: 'matheus gomes')
   * @param {number} cargoId - ID do cargo
   */
  atribuirCargoAoUsuario: async (usuarioLogin, cargoId) => {
    const response = await api.put(
      `/rbac/usuarios/${encodeURIComponent(usuarioLogin)}/cargo`,
      { cargo_id: cargoId }
    );
    return response.data;
  },

  /**
   * Remove o cargo de um usuário (define como NULL)
   * DELETE /rbac/usuarios/{usuario_login}/cargo
   * 
   * @param {string} usuarioLogin - LOGIN do usuário (ex: 'matheus gomes')
   */
  removerCargoDoUsuario: async (usuarioLogin) => {
    const response = await api.delete(
      `/rbac/usuarios/${encodeURIComponent(usuarioLogin)}/cargo`
    );
    return response.data;
  },
  // ==================== CONSULTAS DE USUÁRIO ====================

  /**
   * Busca todas as permissões de um usuário baseado no seu cargo
   * GET /rbac/usuarios/{usuario_id}/permissoes
   */
  getPermissoesDoUsuario: async (usuarioId) => {
    const response = await api.get(`/rbac/usuarios/${usuarioId}/permissoes`);
    return response.data;
  },

  /**
   * Verifica se um usuário possui uma permissão específica
   * GET /rbac/usuarios/{usuario_id}/verificar-permissao?permissao=X
   * 
   * @param {number} usuarioId
   * @param {string} permissao - Código da permissão (ex: 'nc:criar')
   */
  verificarPermissao: async (usuarioId, permissao) => {
    const response = await api.get(
      `/rbac/usuarios/${usuarioId}/verificar-permissao`,
      { params: { permissao } }
    );
    return response.data;
  },
};

export default rbacService;