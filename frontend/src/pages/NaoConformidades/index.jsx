import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { LayoutDashboard, UserPlus, Users, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Importando os componentes do módulo
import Consulta from './Consulta';
import NovoRegistro from './NovoRegistro';
import Equipe from './Equipe';

// Componentes Universais do Sophon
import LogoSophon from '../../components/LogoSophon'; 
import UserAvatar from '../../components/UserAvatar';

export default function NaoConformidades() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('consulta');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [registros, setRegistros] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [autenticado, setAutenticado] = useState(false); // Estado para travar o render inicial

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const usuarioLogado = localStorage.getItem('nome_usuario') || localStorage.getItem('usuario') || 'Usuário';

  // --- FUNÇÃO DE LOGOUT ---
  const onLogout = useCallback(() => {
    localStorage.clear();
    navigate('/login');
  }, [navigate]);

  // --- VERIFICAÇÃO REAL DO TOKEN NO BACKEND ---
  useEffect(() => {
    const verificarAcesso = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        onLogout();
        return;
      }

      try {
        // Chamamos a rota de status que criamos no nc_routes.py para validar o token
        await axios.get(`${API_URL}/api/nc/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Se a rota respondeu OK, liberamos o app
        setAutenticado(true);
      } catch (error) {
        console.error("Token inválido ou expirado:", error);
        onLogout();
      }
    };

    verificarAcesso();
  }, [API_URL, onLogout]);

  // --- BUSCA DE DADOS (SÓ EXECUTA SE ESTIVER AUTENTICADO) ---
  const buscarRegistros = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios.get(`${API_URL}/api/nc/registros?mes=${mes}&ano=${ano}`, config)
         .then(res => setRegistros(Array.isArray(res.data) ? res.data : []))
         .catch(err => {
           if (err.response?.status === 401) onLogout();
           setRegistros([]);
         });
  }, [API_URL, mes, ano, onLogout]);

  const buscarColabs = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    axios.get(`${API_URL}/api/nc/colaboradores`, config)
         .then(res => setColaboradores(Array.isArray(res.data) ? res.data : []))
         .catch(err => {
           if (err.response?.status === 401) onLogout();
           setColaboradores([]);
         });
  }, [API_URL, onLogout]);

  useEffect(() => { 
    if (autenticado) {
      buscarRegistros(); 
      buscarColabs(); 
    }
  }, [autenticado, mes, ano, buscarRegistros, buscarColabs]);

  // Enquanto verifica o token, não mostra nada (evita o "flash" de conteúdo proibido)
  if (!autenticado) {
    return (
      <div className="bg-[#09090b] min-h-screen flex flex-col items-center justify-center gap-4 text-zinc-500">
        <div className="w-10 h-10 border-4 border-[#3B8ED0] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Validando Acesso Sophon...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-300 font-sans selection:bg-blue-500/30 pb-10">
      
      {/* NAVBAR UNIFICADA */}
      <nav className="bg-[#09090b] border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        
        {/* LADO ESQUERDO */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/selector')} 
            className="flex items-center justify-center h-6 hover:opacity-80 transition-opacity focus:outline-none group"
            title="Voltar ao Portal"
          >
            <LogoSophon className="h-12 w-auto text-zinc-100 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all" />
          </button>
          <div className="h-5 w-[1px] bg-zinc-700"></div>
          <span className="text-sm font-medium text-zinc-400 tracking-wider leading-5">Não Conformidades</span>
        </div>

        {/* LADO DIREITO */}
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-md shadow-sm mr-2">
            <button 
              onClick={() => setAbaAtiva('consulta')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'consulta' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard size={14} /> Consulta
            </button>
            <button 
              onClick={() => setAbaAtiva('novo')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'novo' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={14} /> Registrar
            </button>
            <button 
              onClick={() => setAbaAtiva('equipe')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'equipe' ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Users size={14} /> Operadores
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800"></div>
          <UserAvatar usuarioLogado={usuarioLogado} onLogout={onLogout} showName={false} />
        </div>
      </nav>

      {/* VIEWPORT PRINCIPAL */}
      <main className="max-w-[1800px] mx-auto px-6 py-8 animate-in fade-in duration-300">
        {abaAtiva === 'consulta' && (
          <Consulta 
            registros={registros} 
            buscarRegistros={buscarRegistros} 
            mes={mes} setMes={setMes} 
            ano={ano} setAno={setAno} 
            colaboradores={colaboradores} 
          />
        )}
        {abaAtiva === 'novo' && (
          <NovoRegistro 
            aoSalvar={() => { buscarRegistros(); setAbaAtiva('consulta'); }} 
            colaboradores={colaboradores} 
          />
        )}
        {abaAtiva === 'equipe' && (
          <Equipe 
            colaboradores={colaboradores} 
            buscarColabs={buscarColabs} 
          />
        )}
      </main>

    </div>
  );
}