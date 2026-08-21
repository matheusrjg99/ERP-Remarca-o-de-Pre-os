import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { PermissionProvider } from './context/PermissionContext';
import ApiErrorListener from './components/ApiErrorListener';
import Login from './pages/Login';
import AppSelector from './pages/AppSelector';
import Precificacao from './pages/Precificacao';
import NaoConformidades from './pages/NaoConformidades';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <PermissionProvider>
      {/* Listener global para erros 403 da API */}
      <ApiErrorListener />
      
      <Routes>
        {/* 1. ROTAS PÚBLICAS */}

        {/* Decisão inteligente na raiz: Se logado, vai pro menu. Se não, login */}
        <Route
          path="/"
          element={
            localStorage.getItem('access_token')
              ? <Navigate to="/selector" replace />
              : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={<Login onLoginSuccess={() => navigate('/selector')} />}
        />

        {/* 2. GRUPO DE ROTAS PROTEGIDAS */}
        {/* Tudo o que estiver aqui dentro EXIGE o access_token */}
        <Route element={<ProtectedRoute />}>

          {/* Rota do Portal (Cards) */}
          <Route
            path="/selector"
            element={
              <AppSelector
                onSelectRemarcacao={() => navigate('/remarcacao')}
                onLogout={handleLogout}
              />
            }
          />

          {/* Rota de Precificação (Remarcação) */}
          <Route
            path="/remarcacao"
            element={
              <Precificacao
                onLogout={handleLogout}
                onVoltarMenu={() => navigate('/selector')}
              />
            }
          />

          {/* Rota de Não Conformidades */}
          <Route
            path="/nao-conformidades/*"
            element={<NaoConformidades />}
          />

        </Route>

        {/* 3. FALLBACK: Se o usuário digitar qualquer coisa errada, volta pro login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PermissionProvider>
  );
}
