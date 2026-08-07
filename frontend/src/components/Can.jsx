import React from 'react';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Componente que renderiza children apenas se o usuário tiver a permissão especificada
 * @param {string} permission - Código da permissão necessária
 * @param {React.ReactNode} children - Conteúdo a ser renderizado
 * @param {React.ReactNode} fallback - Conteúdo alternativo (opcional)
 */
export const Can = ({ permission, children, fallback = null }) => {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;

  return hasPermission(permission) ? children : fallback;
};

/**
 * Componente que renderiza children se o usuário tiver pelo menos uma das permissões
 * @param {string[]} permissions - Lista de permissões possíveis
 * @param {React.ReactNode} children - Conteúdo a ser renderizado
 * @param {React.ReactNode} fallback - Conteúdo alternativo (opcional)
 */
export const CanAny = ({ permissions, children, fallback = null }) => {
  const { hasAnyPermission, isLoading } = usePermissions();

  if (isLoading) return null;

  return hasAnyPermission(permissions) ? children : fallback;
};

/**
 * Componente que renderiza children se o usuário tiver todas as permissões
 * @param {string[]} permissions - Lista de permissões necessárias
 * @param {React.ReactNode} children - Conteúdo a ser renderizado
 * @param {React.ReactNode} fallback - Conteúdo alternativo (opcional)
 */
export const CanAll = ({ permissions, children, fallback = null }) => {
  const { hasAllPermissions, isLoading } = usePermissions();

  if (isLoading) return null;

  return hasAllPermissions(permissions) ? children : fallback;
};

/**
 * Componente que renderiza children se o usuário tiver acesso ao módulo
 * @param {string} module - Nome do módulo
 * @param {React.ReactNode} children - Conteúdo a ser renderizado
 * @param {React.ReactNode} fallback - Conteúdo alternativo (opcional)
 */
export const CanModule = ({ module, children, fallback = null }) => {
  const { hasModuleAccess, isLoading } = usePermissions();

  if (isLoading) return null;

  return hasModuleAccess(module) ? children : fallback;
};

export default Can;
