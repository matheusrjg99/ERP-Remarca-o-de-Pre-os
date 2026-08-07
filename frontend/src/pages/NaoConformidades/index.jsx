import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LayoutDashboard, UserPlus, Users, DollarSign, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Importando os componentes do módulo
import Consulta from './Consulta';
import NovoRegistro from './NovoRegistro';
import Equipe from './Equipe';
import RelatorioComissoes from './RelatorioComissoes';
import ConfiguracaoComissoes from './ConfiguracaoComissoes';

// Componentes Universais do Sophon
import LogoSophon from '../../components/LogoSophon'; 
import UserAvatar from '../../components/UserAvatar';
import { Can, CanModule } from '../../components/Can';

export default function NaoConformidades() {
  const navigate = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState('consulta');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [registros, setRegistros] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);

  const token = localStorage.getItem('access_token');
  const config = { headers: { Authorization: `Bearer ${token}` } };
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Puxando o nome do usuário logado (igual na remarcação)
  const usuarioLogado = localStorage.getItem('nome_usuario') || localStorage.getItem('usuario') || 'Usuário';

  const buscarRegistros = () => {
    axios.get(`${API_URL}/nao-conformidades?mes=${mes}&ano=${ano}`, config)
         .then(res => setRegistros(Array.isArray(res.data) ? res.data : []))
         .catch(() => setRegistros([]));
  };

  const buscarColabs = () => {
    axios.get(`${API_URL}/colaboradores`, config)
         .then(res => setColaboradores(Array.isArray(res.data) ? res.data : []))
         .catch(() => setColaboradores([]));
  };

  useEffect(() => { 
    buscarRegistros(); 
    buscarColabs(); 
  }, []);

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
          <span className="text-sm font-medium text-zinc-400 tracking-wider leading-5">Não Conformidades</span>
        </div>

        {/* LADO DIREITO - Menu de Abas e Avatar */}
        <div className="flex items-center gap-4">
          
          {/* MENU DE NAVEGAÇÃO DO MÓDULO - Condicional por permissão */}
          <CanModule module="nc" fallback={null}>
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
              <Can permission="nc:criar">
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
              </Can>
              <Can permission="cadastros:colaboradores">
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
              </Can>
              <Can permission="comissoes:configurar">
                <button 
                  onClick={() => setAbaAtiva('configurar')} 
                  className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                    abaAtiva === 'configurar' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Settings size={14} /> Configurar Comissões
                </button>
              </Can>
              <Can permission="comissoes:ver">
                <button 
                  onClick={() => setAbaAtiva('comissoes')} 
                  className={`px-4 py-1.5 flex items-center gap-2 rounded text-xs font-medium transition-all ${
                    abaAtiva === 'comissoes' 
                      ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <DollarSign size={14} /> Relatório
                </button>
              </Can>
            </div>
          </CanModule>

          <div className="h-5 w-[1px] bg-zinc-800"></div>
          
          {/* AVATAR DO USUÁRIO */}
          <UserAvatar usuarioLogado={usuarioLogado} onLogout={onLogout} showName={false} />
          
        </div>
      </nav>

      {/* VIEWPORT PRINCIPAL */}
      <main className="max-w-[1800px] mx-auto px-6 py-8 animate-in fade-in duration-300">
        {abaAtiva === 'consulta' && (
          <CanModule module="nc" fallback={<SemAcesso modulo="Não Conformidades" />}>
            <Consulta 
              registros={registros} 
              buscarRegistros={buscarRegistros} 
              mes={mes} setMes={setMes} 
              ano={ano} setAno={setAno} 
              colaboradores={colaboradores} 
            />
          </CanModule>
        )}
        {abaAtiva === 'novo' && (
          <Can permission="nc:criar" fallback={<SemAcesso acao="registrar não conformidades" />}>
            <NovoRegistro 
              aoSalvar={() => { buscarRegistros(); setAbaAtiva('consulta'); }} 
              colaboradores={colaboradores} 
            />
          </Can>
        )}
        {abaAtiva === 'equipe' && (
          <Can permission="cadastros:colaboradores" fallback={<SemAcesso acao="gerenciar equipe" />}>
            <Equipe 
              colaboradores={colaboradores} 
              buscarColabs={buscarColabs} 
            />
          </Can>
        )}
        {abaAtiva === 'configurar' && (
          <Can permission="comissoes:configurar" fallback={<SemAcesso acao="configurar comissões" />}>
            <ConfiguracaoComissoes 
              config={config}
              API_URL={API_URL}
            />
          </Can>
        )}
        {abaAtiva === 'comissoes' && (
          <Can permission="comissoes:ver" fallback={<SemAcesso acao="ver relatório de comissões" />}>
            <RelatorioComissoes 
              config={config}
              API_URL={API_URL}
            />
          </Can>
        )}
      </main>

    </div>
  );
}

// Componente de fallback para quando não há permissão
function SemAcesso({ modulo, acao }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Acesso Negado</h3>
      <p className="text-zinc-400 text-sm max-w-md">
        {modulo 
          ? `Você não tem permissão para acessar o módulo de ${modulo}.`
          : `Você não tem permissão para ${acao || 'esta ação'}.`}
      </p>
      <p className="text-zinc-500 text-xs mt-4">
        Contate o administrador do sistema para solicitar acesso.
      </p>
    </div>
  );
}
