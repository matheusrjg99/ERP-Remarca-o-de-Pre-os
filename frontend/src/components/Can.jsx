import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente para renderização condicional baseada em permissões
 * 
 * @param {string} permission - Permissão única necessária (ex: 'nc:criar')
 * @param {string[]} anyOf - Lista de permissões, basta ter uma
 * @param {string[]} allOf - Lista de permissões, precisa ter todas
 * @param {React.ReactNode} children - Conteúdo a ser renderizado se autorizado
 * @param {React.ReactNode} fallback - Conteúdo alternativo se não autorizado (opcional)
 */
const Can = ({ 
  permission, 
  anyOf, 
  allOf, 
  children, 
  fallback = null 
}) => {
  const { can, canAny, canAll, loading } = usePermissions();

  // Enquanto carrega as permissões, não renderiza nada (ou poderia renderizar um skeleton)
  if (loading) {
    return null;
  }

  let isAuthorized = false;

  if (permission) {
    isAuthorized = can(permission);
  } else if (anyOf) {
    isAuthorized = canAny(anyOf);
  } else if (allOf) {
    isAuthorized = canAll(allOf);
  }

  return isAuthorized ? children : fallback;
};

export default Can;
