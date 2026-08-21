import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services';

const PermissionContext = createContext(null);

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

  const loadPermissions = async () => {
    try {
      const userData = await authService.getMeusDados();
      setUser(userData);
      setPermissions(userData.permissions || []);
      localStorage.setItem('permissions', JSON.stringify(userData.permissions || []));
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
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

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionsList) => {
    return permissionsList.some((perm) => permissions.includes(perm));
  };

  const hasAllPermissions = (permissionsList) => {
    return permissionsList.every((perm) => permissions.includes(perm));
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
