import api from '@/api/axios';

/**
 * Serviço de Precificação
 * Endpoints: /precificacao/*
 */

export const pricingService = {
  /**
   * Busca divergências de markup
   * GET /precificacao/divergencias-markup
   */
  getDivergenciasMarkup: async () => {
    const response = await api.get('/precificacao/divergencias-markup');
    return response.data;
  },

  /**
   * Busca produto por registro
   * GET /precificacao/produto/{registro}
   */
  getProdutoByRegistro: async (registro) => {
    const response = await api.get(`/precificacao/produto/${registro}`);
    return response.data;
  },

  /**
   * Processa produtos em lote
   * POST /precificacao/produtos-lote
   */
  processarProdutosLote: async (loteData) => {
    const response = await api.post('/precificacao/produtos-lote', loteData);
    return response.data;
  },

  /**
   * Lista classificações de produtos
   * GET /precificacao/classificacoes
   */
  getClassificacoes: async () => {
    const response = await api.get('/precificacao/classificacoes');
    return response.data;
  },

  /**
   * Lista fornecedores
   * GET /precificacao/fornecedores
   */
  getFornecedores: async () => {
    const response = await api.get('/precificacao/fornecedores');
    return response.data;
  },

  /**
   * Pesquisa produtos com filtros
   * GET /precificacao/pesquisar
   */
  pesquisarProdutos: async (filters = {}) => {
    const response = await api.get('/precificacao/pesquisar', { params: filters });
    return response.data;
  },

  /**
   * Lista todos os produtos
   * GET /precificacao/produtos
   */
  getProdutos: async () => {
    const response = await api.get('/precificacao/produtos');
    return response.data;
  },

  /**
   * Remarca preços de produtos
   * PUT /precificacao/remarcar
   */
  remarcarPrecos: async (remarcamentoData) => {
    const response = await api.put('/precificacao/remarcar', remarcamentoData);
    return response.data;
  },

  /**
   * Atualiza custo de produto
   * PUT /precificacao/atualizar-custo
   */
  atualizarCusto: async (custoData) => {
    const response = await api.put('/precificacao/atualizar-custo', custoData);
    return response.data;
  },

  /**
   * Atualiza markup de produto
   * PUT /precificacao/atualizar-mkp
   */
  atualizarMarkup: async (markupData) => {
    const response = await api.put('/precificacao/atualizar-mkp', markupData);
    return response.data;
  },
};
