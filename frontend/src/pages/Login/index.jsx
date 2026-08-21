import React, { useState } from 'react';
import { authService } from '../../services';
import { usePermissions } from '../../hooks/usePermissions';
import LogoSophon from '../../components/LogoSophon';

export default function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ login: '', senha: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { loadPermissions, permissions } = usePermissions();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    
    try {
      // Usa o service de auth para fazer login
      const data = await authService.login(form);
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('usuario', data.usuario);
      localStorage.setItem('nivel_acesso', data.nivel_acesso);
      
      console.log('🔐 Login realizado com sucesso. Token recebido.');
      
      // 🚀 CARREGA PERMISSÕES NO CONTEXT (busca /auth/meus-dados)
      // Isso é necessário pois o endpoint /login não retorna permissões
      await loadPermissions();
      
      console.log('✅ Permissões carregadas no contexto global.');
      
      onLoginSuccess();
    } catch (err) {
      console.error('Erro no login:', err);
      const errorMessage = err.response?.status === 401 
        ? 'Credenciais inválidas.' 
        : err.response?.data?.detail || 'Erro ao realizar login. Tente novamente.';
      setErro(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-[#09090b] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <form onSubmit={handleLogin} className="relative z-10 bg-[#1e1e1e]/80 backdrop-blur-xl p-8 rounded-lg border border-[#333]/80 w-96 shadow-2xl">
        <LogoSophon width="250" height="65" className="mx-auto mb-5 block drop-shadow-md" />

        {erro && <p className="text-red-500 text-sm mb-4 text-center">{erro}</p>}

        <input
          className="w-full p-3 mb-4 bg-[#2e2e2e]/90 rounded border border-[#444] text-white outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          placeholder="Usuário"
          value={form.login}
          onChange={e => setForm({...form, login: e.target.value})}
          disabled={loading}
        />

        <input
          className="w-full p-3 mb-6 bg-[#2e2e2e]/90 rounded border border-[#444] text-white outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          type="password" 
          placeholder="Senha"
          value={form.senha}
          onChange={e => setForm({...form, senha: e.target.value})}
          disabled={loading}
        />

        <button 
          className="w-full p-3 bg-white hover:bg-gray-200 transition-colors rounded font-bold text-black shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
