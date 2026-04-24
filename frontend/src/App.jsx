import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import AppSelector from './pages/AppSelector';
import Dashboard from './pages/Dashboard';
import NaoConformidades from './pages/NaoConformidades';
import ProtectedRoute from './components/ProtectedRoute'; // Importando o guardião

export default function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
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
        
        {/* Rota da Remarcação (Antigo Dashboard) */}
        <Route 
          path="/remarcacao" 
          element={
            <Dashboard 
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
  );
}