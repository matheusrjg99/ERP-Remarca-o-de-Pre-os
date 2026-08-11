import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * HOC (Higher-Order Component) para proteção de componentes com permissões
 * @param {string|string[]} permissions - Permissão única ou array de permissões
 * @param {boolean} all - Se true, requer TODAS as permissões; se false, requer QUALQUER UMA
 * @param {React.ReactNode} fallback - Componente a ser exibido quando não houver permissão
 * @returns {Function} Função que envolve o componente protegido
 */
export const withPermission = ({ permissions, all = false, fallback = null }) => (WrappedComponent) => {
  return function PermissionWrappedComponent(props) {
    const { 
      hasPermission, 
      hasAnyPermission, 
      hasAllPermissions, 
      isLoading 
    } = usePermissions();

    if (isLoading) return null;

    const hasRequiredPermission = Array.isArray(permissions)
      ? (all ? hasAllPermissions(permissions) : hasAnyPermission(permissions))
      : hasPermission(permissions);

    if (!hasRequiredPermission) {
      return fallback;
    }

    return <WrappedComponent {...props} />;
  };
};

/**
 * Hook para verificação condicional de permissões em componentes
 * @param {string|string[]} permissions - Permissão ou lista de permissões
 * @param {boolean} all - Requer todas as permissões
 * @returns {Object} Objeto com status de permissão e funções utilitárias
 */
export const usePermissionGuard = (permissions, all = false) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isLoading,
    isAdmin 
  } = usePermissions();

  const isAllowed = Array.isArray(permissions)
    ? (all ? hasAllPermissions(permissions) : hasAnyPermission(permissions))
    : hasPermission(permissions);

  return {
    isAllowed,
    isLoading,
    isAdmin,
    can: isAllowed,
    cannot: !isAllowed,
  };
};

/**
 * Componente wrapper para proteção de elementos UI individuais
 * @param {string|string[]} permissions - Permissão(ões) necessária(s)
 * @param {boolean} all - Requer todas as permissões
 * @param {React.ReactNode} children - Conteúdo protegido
 * @param {React.ReactNode} fallback - Conteúdo alternativo
 * @param {string} renderType - Tipo de renderização: 'none' | 'disabled' | 'custom'
 * @returns {React.ReactElement} Elemento protegido por permissão
 */
export const PermissionGuard = ({ 
  permissions, 
  all = false, 
  children, 
  fallback = null,
  renderType = 'none'
}) => {
  const { isAllowed, isLoading } = usePermissionGuard(permissions, all);

  if (isLoading) return null;

  if (!isAllowed) {
    if (renderType === 'disabled' && React.Children.count(children) === 1) {
      // Clona o elemento filho adicionando disabled=true
      const child = React.Children.only(children);
      return React.cloneElement(child, { disabled: true, title: 'Sem permissão para esta ação' });
    }
    return fallback;
  }

  return children;
};

export default PermissionGuard;
