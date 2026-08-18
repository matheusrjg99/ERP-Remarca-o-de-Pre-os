import { useState, useEffect } from 'react';

// Mapa de Hierarquia de Permissões
// Chave: Permissão Superior | Valor: Lista de permissões inferiores herdadas
const HIERARCHY_MAP = {
  'admin:cargos': ['admin:usuarios', 'admin:configuracoes', 'admin:logs'],
  'precificacao:editar': ['precificacao:consultar'],
  'precificacao:excluir': ['precificacao:editar', 'precificacao:consultar'],
  'nc:editar': ['nc:visualizar', 'nc:contestar'],
  'nc:excluir': ['nc:editar', 'nc:visualizar', 'nc:contestar'],
  'rbac:cargo_editar': ['rbac:cargo_visualizar'],
  'rbac:cargo_excluir': ['rbac:cargo_editar', 'rbac:cargo_visualizar'],
  'rbac:permissao_editar': ['rbac:permissao_visualizar'],
  'rbac:permissao_excluir': ['rbac:permissao_editar', 'rbac:permissao_visualizar'],
};

/**
 * Hook personalizado para gerenciar permissões RBAC no frontend
 * @returns {Object} Objeto com funções e estados de permissão
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Carrega as permissões do localStorage (salvas no login como 'permissoes')
    const storedPermissions = localStorage.getItem('permissoes');
    if (storedPermissions) {
      try {
        setPermissions(JSON.parse(storedPermissions));
      } catch (e) {
        console.error('Erro ao parsear permissões do localStorage:', e);
        setPermissions([]);
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Verifica se o usuário tem uma permissão específica, considerando hierarquia
   * @param {string} permissionCode - Código da permissão (ex: 'cadastros:colaboradores')
   * @returns {boolean} true se tiver permissão
   */
  const hasPermission = (permissionCode) => {
    if (isLoading || !permissionCode) return false;
    
    const reqPerm = permissionCode.toLowerCase();
    
    // Admin total tem todas as permissões
    if (permissions.includes('admin_total')) return true;
    
    // Normaliza permissões do usuário para minúsculas
    const userPerms = permissions.map(p => p.toLowerCase());
    
    // 1. Verificação direta
    if (userPerms.includes(reqPerm)) return true;
    
    // 2. Verificação Hierárquica (Busca permissões superiores que concedem esta)
    for (const [superPerm, inheritedPerms] of Object.entries(HIERARCHY_MAP)) {
      if (inheritedPerms.includes(reqPerm) && userPerms.includes(superPerm.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões listadas
   * @param {string[]} permissionCodes - Lista de códigos de permissão
   * @returns {boolean} true se tiver alguma permissão
   */
  const hasAnyPermission = (permissionCodes) => {
    if (isLoading) return false;
    
    if (permissions.includes('admin_total')) return true;
    
    return permissionCodes.some(code => hasPermission(code));
  };

  /**
   * Verifica se o usuário tem TODAS as permissões listadas
   * @param {string[]} permissionCodes - Lista de códigos de permissão
   * @returns {boolean} true se tiver todas as permissões
   */
  const hasAllPermissions = (permissionCodes) => {
    if (isLoading) return false;
    
    if (permissions.includes('admin_total')) return true;
    
    return permissionCodes.every(code => hasPermission(code));
  };

  /**
   * Verifica se o usuário tem acesso a um módulo inteiro
   * @param {string} modulo - Nome do módulo (ex: 'cadastros', 'nc', 'comissoes')
   * @returns {boolean} true se tiver acesso ao módulo
   */
  const hasModuleAccess = (modulo) => {
    if (isLoading) return false;
    
    if (permissions.includes('admin_total')) return true;
    
    // Verifica se tem alguma permissão do módulo
    return permissions.some(p => p.startsWith(`${modulo}:`) || p === modulo);
  };

  /**
   * Retorna todas as permissões de um módulo específico
   * @param {string} modulo - Nome do módulo
   * @returns {string[]} Array com códigos das permissões do módulo
   */
  const getModulePermissions = (modulo) => {
    if (permissions.includes('admin_total')) {
      // Retorna todas as permissões possíveis do módulo (precisa ser configurado)
      return [];
    }
    return permissions.filter(p => p.startsWith(`${modulo}:`));
  };

  /**
   * Recarrega as permissões do localStorage
   * Útil após atualizar cargo do usuário
   */
  const refreshPermissions = () => {
    const storedPermissions = localStorage.getItem('permissoes');
    if (storedPermissions) {
      try {
        setPermissions(JSON.parse(storedPermissions));
      } catch (e) {
        console.error('Erro ao recarregar permissões:', e);
        setPermissions([]);
      }
    }
    setIsLoading(false);
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    getModulePermissions,
    refreshPermissions,
    isAdmin: permissions.includes('admin_total'),
    // Exporta todas as funções para uso externo
    can: hasPermission,
    cannot: (code) => !hasPermission(code),
  };
};

export default usePermissions;
