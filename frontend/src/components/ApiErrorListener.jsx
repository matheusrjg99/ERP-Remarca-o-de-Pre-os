import { useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * Componente global que escuta eventos de erro 403 da API
 * e exibe notificações toast apropriadas.
 * 
 * Deve ser renderizado uma única vez no nível mais alto da aplicação (App.jsx)
 */
const ApiErrorListener = () => {
  useEffect(() => {
    const handle403Error = (event) => {
      const { message, url, method } = event.detail;
      
      // Exibe toast de erro 403
      toast.error(message, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'colored',
      });

      // Log adicional para debugging (pode ser removido em produção)
      console.warn(`[403 Forbidden] ${method?.toUpperCase()} ${url}`);
    };

    // Adiciona listener para eventos 403
    window.addEventListener('api-403-error', handle403Error);

    // Cleanup ao desmontar
    return () => {
      window.removeEventListener('api-403-error', handle403Error);
    };
  }, []);

  return null; // Componente não renderiza nada visualmente
};

export default ApiErrorListener;
