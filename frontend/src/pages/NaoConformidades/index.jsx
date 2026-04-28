import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, UserPlus, Users } from 'lucide-react';
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

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.0.250:9000';

  // Puxando o nome do usuário logado (igual na remarcação)
  const usuarioLogado = localStorage.getItem('nome_usuario') || localStorage.getItem('usuario') || 'Usuário';

  const buscarRegistros = () => {
    axios.get(`${API_URL}/api/nc/registros?mes=${mes}&ano=${ano}`, config)
         .then(res => setRegistros(Array.isArray(res.data) ? res.data : []))
         .catch(() => setRegistros([]));
  };

  const buscarColabs = () => {
    axios.get(`${API_URL}/api/nc/colaboradores`, config)
         .then(res => setColaboradores(Array.isArray(res.data) ? res.data : []))
         .catch(() => setColaboradores([]));
  };

  useEffect(() => { 
    buscarRegistros(); 
    buscarColabs(); 
  }, [mes, ano]);

  const onLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-300 font-sans selection:bg-blue-500/30 pb-10">
      
      {/* NAVBAR UNIFICADA (Idêntica ao Dashboard de Remarcação) */}
      <nav className="bg-[#09090b] border-b border-zinc-800/80 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        
        {/* LADO ESQUERDO - Logo e Título */}
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

        {/* LADO DIREITO - Menu de Abas e Avatar */}
        <div className="flex items-center gap-4">
          
          {/* MENU DE NAVEGAÇÃO DO MÓDULO (Estilo Toggle do Admin) */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-md shadow-sm mr-2">
            <button 
              onClick={() => setAbaAtiva('consulta')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'consulta' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard size={14} /> Consulta
            </button>
            <button 
              onClick={() => setAbaAtiva('novo')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'novo' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UserPlus size={14} /> Registrar
            </button>
            <button 
              onClick={() => setAbaAtiva('equipe')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'equipe' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Users size={14} /> Operadores
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800"></div>
          
          {/* AVATAR DO USUÁRIO */}
          <UserAvatar usuarioLogado={usuarioLogado} onLogout={onLogout} showName={false} />
          
        </div>
      </nav>

      {/* VIEWPORT PRINCIPAL (Mesmo limite de 1800px da Remarcação) */}
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