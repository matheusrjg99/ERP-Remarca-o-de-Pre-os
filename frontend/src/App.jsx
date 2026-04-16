import React, { useState } from 'react';
import Login from './pages/Login';
import AppSelector from './pages/AppSelector';
import Dashboard from './pages/Dashboard';

export default function App() {
  // Agora o estado não é mais true/false, ele diz exatamente em qual tela o usuário está.
  // Se já tiver o token, joga direto pro Portal (selector).
  const [telaAtual, setTelaAtual] = useState(
    localStorage.getItem('access_token') ? 'selector' : 'login'
  );

  const handleLogout = () => {
    localStorage.clear();
    setTelaAtual('login');
  };

  // Roteamento simples e limpo
  if (telaAtual === 'login') {
    return <Login onLoginSuccess={() => setTelaAtual('selector')} />;
  }

  if (telaAtual === 'selector') {
    return (
      <AppSelector 
        onSelectRemarcacao={() => setTelaAtual('remarcacao')} 
        onLogout={handleLogout} 
      />
    );
  }

  if (telaAtual === 'remarcacao') {
    return (
      <Dashboard 
        onLogout={handleLogout} 
        onVoltarMenu={() => setTelaAtual('selector')} 
      />
    );
  }

  return null; // Fallback de segurança
}