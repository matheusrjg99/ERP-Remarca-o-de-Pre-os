import React, { useState } from 'react';
import api from '../../api/axios';
import LogoSophon from '../../components/LogoSophon';

export default function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ login: '', senha: '' });
  const [erro, setErro] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/login', form);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('usuario', data.usuario);
      // 🚀 AQUI: Salvamos o nível que vem da sua API
      localStorage.setItem('nivel_acesso', data.nivel_acesso); 
      
      onLoginSuccess();
    } catch {
      setErro('Credenciais inválidas.');
    }
  };

  return (
    // 1. O fundo principal bem escuro, com overflow-hidden para o brilho não gerar barra de rolagem
    <div className="relative flex items-center justify-center h-screen bg-[#09090b] overflow-hidden">
      
      {/* 2. O Efeito de Brilho de Fundo (Glow Azulado) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 3. O Formulário (Agora com backdrop-blur para dar efeito de vidro por cima do brilho) */}
      <form onSubmit={handleLogin} className="relative z-10 bg-[#1e1e1e]/80 backdrop-blur-xl p-8 rounded-lg border border-[#333]/80 w-96 shadow-2xl">
        
        <LogoSophon width="250" height="65" className="mx-auto mb-5 block drop-shadow-md" />
        
        {erro && <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>}
        
        <input 
          className="w-full p-3 mb-4 bg-[#2e2e2e]/90 rounded border border-[#444] text-white outline-none focus:border-blue-500 transition-colors"
          placeholder="Usuário"
          onChange={e => setForm({...form, login: e.target.value})}
        />
        
        <input 
          className="w-full p-3 mb-6 bg-[#2e2e2e]/90 rounded border border-[#444] text-white outline-none focus:border-blue-500 transition-colors"
          type="password" placeholder="Senha"
          onChange={e => setForm({...form, senha: e.target.value})}
        />
        
        <button className="w-full p-3 bg-white hover:bg-gray-200 transition-colors rounded font-bold text-black shadow-lg shadow-blue-900/20">
          Entrar
        </button>
      </form>
    </div>
  );
}