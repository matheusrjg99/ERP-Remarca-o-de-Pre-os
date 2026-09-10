import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';
import { log, error } from '@/utils/logger';

const PermissionContext = createContext(null);

// Hierarquia de Níveis de Privilégio (mesma do backend)
const NIVEIS_PRIVILEGIO = {
  "excluir": 4,
  "editar": 3,
  "criar" : 2,
  "remarcar": 2,
  "consultar": 1,
  "visualizar": 1,
  "listar": 1,
};

export const usePermissionContext = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissionContext deve ser usado dentro de um PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Carrega as permissões ao montar o componente se houver token válido
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      loadPermissions();
    } else {
      // Se não há token, garante que loading seja false e permissões vazias
      setLoading(false);
      setPermissions([]);
      setUser(null);
    }
  }, []);

  const loadPermissions = async () => {
    try {
      const userData = await authService.getMeusDados();
      setUser(userData);
      const perms = userData.permissions || [];
      setPermissions(perms);
      localStorage.setItem('permissions', JSON.stringify(perms));
      log('✅ [PermissionContext] Permissões carregadas:', perms.length, 'permissões');
    } catch (err) {
      error('Erro ao carregar permissões:', err);
      setPermissions([]);
      setUser(null);
      localStorage.removeItem('permissions');
    } finally {
      setLoading(false);
    }
  };

  const clearPermissions = () => {
    setPermissions([]);
    setUser(null);
    setLoading(false);
  };

  /**
   * Verifica hierarquia de permissões (mesma lógica do backend)
   * @param {string} permissaoRequerida - Permissão necessária (ex: 'cadastros:colaboradores:criar')
   * @param {string[]} permissoesUsuario - Lista de permissões do usuário
   * @returns {boolean} true se autorizado
   */
  const verificarHierarquiaPermissao = (permissaoRequerida, permissoesUsuario) => {
    // Admin total tem acesso a tudo
    if (permissoesUsuario.includes('admin_total')) {
      return true;
    }
    
    // Permissão exata
    if (permissoesUsuario.includes(permissaoRequerida)) {
      return true;
    }
    
    // Verificar hierarquia implícita
    if (!permissaoRequerida.includes(':')) {
      return false;
    }
    
    // Divide a permissão requerida em partes
    const partesRequerida = permissaoRequerida.split(':');
    const acaoRequerida = partesRequerida[partesRequerida.length - 1];
    const moduloRequerido = partesRequerida.slice(0, -1).join(':');
    
    // Verifica se o usuário tem acesso total ao módulo (permissão sem ação específica)
    if (permissoesUsuario.includes(moduloRequerido)) {
      return true;
    }
    
    // Curinga do módulo completo (ex: "cadastros:colaboradores:*")
    if (permissoesUsuario.includes(`${moduloRequerido}:*`)) {
      return true;
    }
    
    // Curinga do primeiro nível (ex: "cadastros:*")
    if (permissoesUsuario.includes(`${partesRequerida[0]}:*`)) {
      return true;
    }
    
    const nivelRequerido = NIVEIS_PRIVILEGIO[acaoRequerida.toLowerCase()] || 0;
    
    // Se não há nível definido, não aplica hierarquia
    if (nivelRequerido === 0) {
      return false;
    }
    
    // Verificar se o usuário tem alguma permissão do mesmo módulo com nível superior
    for (const permissao of permissoesUsuario) {
      if (!permissao.includes(':')) {
        continue;
      }
      
      const partesUsuario = permissao.split(':');
      const acaoUsuario = partesUsuario[partesUsuario.length - 1];
      const moduloUsuario = partesUsuario.slice(0, -1).join(':');
      
      // Só compara permissões do mesmo módulo
      if (moduloUsuario !== moduloRequerido) {
        continue;
      }
      
      // Ignora curingas (já tratados acima)
      if (acaoUsuario === '*') {
        continue;
      }
      
      // Se a "ação" do usuário não está nos níveis, pode ser submódulo
      const nivelUsuario = NIVEIS_PRIVILEGIO[acaoUsuario.toLowerCase()] || 0;
      
      // Se o usuário tem uma permissão de nível superior no mesmo módulo, autoriza
      if (nivelUsuario > nivelRequerido) {
        return true;
      }
    }
    
    return false;
  };

  /**
   * Verifica se o usuário tem uma permissão específica (com hierarquia)
   */
  const hasPermission = (permission) => {
    if (!permission) return false;
    return verificarHierarquiaPermissao(permission, permissions);
  };

  /**
   * Verifica se o usuário tem pelo menos uma das permissões (com hierarquia)
   */
  const hasAnyPermission = (permissionsList) => {
    if (!permissionsList || permissionsList.length === 0) return false;
    return permissionsList.some((perm) => verificarHierarquiaPermissao(perm, permissions));
  };

  /**
   * Verifica se o usuário tem TODAS as permissões (com hierarquia)
   */
  const hasAllPermissions = (permissionsList) => {
    if (!permissionsList || permissionsList.length === 0) return false;
    return permissionsList.every((perm) => verificarHierarquiaPermissao(perm, permissions));
  };

  const value = {
    permissions,
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loadPermissions,
    clearPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;