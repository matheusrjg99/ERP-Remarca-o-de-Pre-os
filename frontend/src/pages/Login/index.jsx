import React, { useState } from 'react';
import api from '../../api/axios';

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
    <div className="flex items-center justify-center h-screen bg-[#121212]">
      <form onSubmit={handleLogin} className="bg-[#1e1e1e] p-8 rounded-lg border border-[#333] w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-500">REMARCAÇÃO ERP</h2>
        {erro && <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>}
        <input 
          className="w-full p-3 mb-4 bg-[#2e2e2e] rounded border border-[#444] text-white"
          placeholder="Usuário"
          onChange={e => setForm({...form, login: e.target.value})}
        />
        <input 
          className="w-full p-3 mb-6 bg-[#2e2e2e] rounded border border-[#444] text-white"
          type="password" placeholder="Senha"
          onChange={e => setForm({...form, senha: e.target.value})}
        />
        <button className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded font-bold">ENTRAR</button>
      </form>
    </div>
  );
}