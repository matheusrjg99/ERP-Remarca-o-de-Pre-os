import axios from 'axios';

const isProduction = import.meta.env.PROD;

const api = axios.create({
  baseURL: isProduction ? '' : 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// INTERCEPTOR DE REQUISIÇÃO (A "Ida")
// Envia o Token JWT em todas as chamadas
// ==========================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// INTERCEPTOR DE RESPOSTA (A "Volta")
// Trata erros de expiração de token e permissões
// ==========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tratamento de erro 401 - Não Autorizado (Token inválido ou expirado)
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada. Redirecionando para login...");

      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissoes');

      window.location.href = '/';
    }

    // Tratamento de erro 403 - Proibido (Sem permissão)
    if (error.response && error.response.status === 403) {
      console.warn("Acesso negado: Usuário não possui permissão para esta ação.");
      
      // Dispara evento personalizado para tratamento global de 403
      const event = new CustomEvent('api-403-error', {
        detail: {
          url: error.config?.url,
          method: error.config?.method,
          message: error.response?.data?.detail || 'Você não tem permissão para realizar esta ação.'
        }
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

export default api;
