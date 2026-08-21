import { usePermissionContext } from '../context/PermissionContext';

/**
 * Hook personalizado para gerenciar permissões RBAC no frontend
 * @returns {Object} Objeto com funções e estados de permissão
 */
export const usePermissions = () => {
  const context = usePermissionContext();
  
  if (!context) {
    throw new Error('usePermissions deve ser usado dentro de um PermissionProvider');
  }

  const { 
    permissions, 
    user, 
    loading, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    loadPermissions,
    clearPermissions
  } = context;

  /**
   * Verifica se o usuário tem uma permissão específica
   * @param {string} permissionCode - Código da permissão (ex: 'nc:criar')
   * @returns {boolean} true se tiver permissão
   */
  const can = (permissionCode) => {
    if (loading || !permissionCode) return false;
    return hasPermission(permissionCode);
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões listadas
   * @param {string[]} permissionCodes - Lista de códigos de permissão
   * @returns {boolean} true se tiver alguma permissão
   */
  const canAny = (permissionCodes) => {
    if (loading) return false;
    return hasAnyPermission(permissionCodes);
  };

  /**
   * Verifica se o usuário tem TODAS as permissões listadas
   * @param {string[]} permissionCodes - Lista de códigos de permissão
   * @returns {boolean} true se tiver todas as permissões
   */
  const canAll = (permissionCodes) => {
    if (loading) return false;
    return hasAllPermissions(permissionCodes);
  };

  /**
   * Verifica se o usuário NÃO tem uma permissão
   * @param {string} permissionCode - Código da permissão
   * @returns {boolean} true se NÃO tiver permissão
   */
  const cannot = (permissionCode) => !can(permissionCode);

  /**
   * Verifica se está carregando as permissões
   * @returns {boolean}
   */
  const isLoading = () => loading;

  /**
   * Obtém dados do usuário logado
   * @returns {Object|null} Dados do usuário ou null
   */
  const getUser = () => user;

  /**
   * Obtém lista completa de permissões
   * @returns {string[]} Array de permissões
   */
  const getPermissions = () => permissions;

  /**
   * Recarrega as permissões da API
   */
  const refreshPermissions = async () => {
    await loadPermissions();
  };

  return {
    permissions,
    user,
    loading,
    can,
    canAny,
    canAll,
    cannot,
    isLoading,
    getUser,
    getPermissions,
    refreshPermissions,
    loadPermissions,
    clearPermissions,
  };
};

export default usePermissions;
