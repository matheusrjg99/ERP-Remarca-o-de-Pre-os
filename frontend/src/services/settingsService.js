import api from '@/api/axios';

/**
 * Serviço de Configurações e Preferências
 * Endpoints: /settings/*
 */

export const settingsService = {
  /**
   * Busca preferências do sistema/usuário
   * GET /settings/preferencias
   */
  getPreferencias: async () => {
    const response = await api.get('/settings/preferencias');
    return response.data;
  },

  /**
   * Atualiza preferências do sistema/usuário
   * PUT /settings/preferencias
   */
  updatePreferencias: async (preferenciasData) => {
    const response = await api.put('/settings/preferencias', preferenciasData);
    return response.data;
  },
};
