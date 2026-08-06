import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, Settings, DollarSign, Percent, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componentes Universais do Sophon
import LogoSophon from '../../components/LogoSophon'; 
import UserAvatar from '../../components/UserAvatar';

// Páginas do módulo
import RelatorioComissoes from './RelatorioComissoes';
import ConfiguracaoPercentuais from './ConfiguracaoPercentuais';

export default function Comissoes() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('relatorio');
  
  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const usuarioLogado = localStorage.getItem('nome_usuario') || localStorage.getItem('usuario') || 'Usuário';

  const onLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="bg-[#09090b] min-h-screen text-zinc-300 font-sans selection:bg-blue-500/30 pb-10">
      
      {/* NAVBAR UNIFICADA */}
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
          <span className="text-sm font-medium text-zinc-400 tracking-wider leading-5">Comissões</span>
        </div>

        {/* LADO DIREITO - Menu de Abas e Avatar */}
        <div className="flex items-center gap-4">
          
          {/* MENU DE NAVEGAÇÃO DO MÓDULO */}
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-md shadow-sm mr-2">
            <button 
              onClick={() => setAbaAtiva('relatorio')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'relatorio' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard size={14} /> Relatório
            </button>
            <button 
              onClick={() => setAbaAtiva('percentuais')} 
              className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                abaAtiva === 'percentuais' 
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Percent size={14} /> Percentuais
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800"></div>
          
          {/* AVATAR DO USUÁRIO */}
          <UserAvatar usuarioLogado={usuarioLogado} onLogout={onLogout} showName={false} />
          
        </div>
      </nav>

      {/* VIEWPORT PRINCIPAL */}
      <main className="max-w-[1800px] mx-auto px-6 py-8 animate-in fade-in duration-300">
        {abaAtiva === 'relatorio' && (
          <RelatorioComissoes config={config} API_URL={API_URL} />
        )}
        {abaAtiva === 'percentuais' && (
          <ConfiguracaoPercentuais config={config} API_URL={API_URL} />
        )}
      </main>

    </div>
  );
}
