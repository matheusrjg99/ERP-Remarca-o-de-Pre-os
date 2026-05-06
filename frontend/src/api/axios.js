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
// Trata erros de expiração de token
// ==========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Sessão expirada. Redirecionando para login...");
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      
      window.location.href = '/'; 
    }
    
    return Promise.reject(error);
  }
);

export default api;