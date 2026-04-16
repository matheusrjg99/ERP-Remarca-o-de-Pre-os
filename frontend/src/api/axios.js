import axios from 'axios';

const api = axios.create({
  baseURL: '', // Vazio, pois o backend e o frontend agora são um só
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
// Trata erros de expiração de token
// ==========================================
api.interceptors.response.use(
  (response) => {
    // Se a resposta for sucesso (200, 201, etc), apenas retorna ela
    return response;
  },
  (error) => {
    // Se o servidor responder 401 (Não autorizado), significa que:
    // 1. O token venceu
    // 2. O token é inválido
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada. Redirecionando para login...");
      
      // Limpa o token do navegador para não tentar usar de novo
      localStorage.removeItem('access_token');
      localStorage.removeItem('user'); // Opcional: limpa dados do user se você salvar
      
      // Força o redirecionamento para a tela inicial (Login)
      window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);

export default api;