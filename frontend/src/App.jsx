import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [isLogged, setIsLogged] = useState(!!localStorage.getItem('access_token'));

  // Criamos a função de logout para passar para o Dashboard
  const handleLogout = () => {
    localStorage.clear();
    setIsLogged(false);
  };

  if (!isLogged) {
    return <Login onLoginSuccess={() => setIsLogged(true)} />;
  }

  // O Dashboard já tem fundo escuro e tela cheia, então não precisamos mais de divs aqui!
  return (
    <Dashboard onLogout={handleLogout} />
  );
}