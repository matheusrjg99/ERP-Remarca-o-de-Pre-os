import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('access_token');

  // Se não houver token, redireciona para a tela de login (rota raiz "/")
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Se houver token, permite o acesso aos componentes filhos
  return <Outlet />;
};

export default ProtectedRoute;