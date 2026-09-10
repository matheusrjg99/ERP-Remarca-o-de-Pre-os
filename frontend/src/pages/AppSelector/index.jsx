import React from 'react';
import LogoSophon from '../../components/LogoSophon';
import UserAvatar from '../../components/UserAvatar';
import { usePermissions } from '../../hooks/usePermissions';
import { useNavigate } from 'react-router-dom';

export default function AppSelector({ onSelectRemarcacao, onLogout }) {
  const navigate = useNavigate(); 
  const usuarioLogado = localStorage.getItem('usuario') || 'Usuário';
  const { canAny, loading } = usePermissions();

  // Definição dos apps
  // - `modulo`: se definido, o app exige permissão para acesso (mas sempre aparece)
  // - `modulo: null` → sempre acessível (ex: links externos)
  const apps = [
    {
      id: 'remarcacao',
      nome: 'Remarcação',
      modulo: 'precificacao',
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      ),
      acao: onSelectRemarcacao,
      borderColorHover: "group-hover:border-blue-500/50",
      glowColor: "bg-blue-500"
    },
    {
      id: 'vendas',
      nome: 'Vendas',
      modulo: null,  // link externo — sempre acessível
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.7)]"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      ),
      acao: () => window.open('https://casafonseca.saga-apps.com:8443/app/', '_blank'),
      borderColorHover: "group-hover:border-emerald-500/50",
      glowColor: "bg-emerald-500"
    },
    {
      id: 'naoconformidades',
      nome: 'Não Conformidades',
      modulo: 'nc',
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      ),
      acao: () => navigate('/nao-conformidades'),
      borderColorHover: "group-hover:border-amber-500/50",
      glowColor: "bg-amber-500"
    }
  ];

  // Verifica se o usuário tem acesso a um app
  const temAcesso = (app) => {
    if (!app.modulo) return true; // sem módulo = sempre libera
    return canAny([
      `${app.modulo}:*`,
      // Considera acesso se tiver QUALQUER permissão do módulo
      // O canAny não aceita wildcard parcial, então fazemos via array
    ]);
  };

  // Melhor: verificar por prefixo
  const temAcessoModulo = (app) => {
    if (!app.modulo) return true;
    if (loading) return true; // enquanto carrega, não bloqueia visualmente
    // Usa o `usePermissions` para pegar o array de permissions
    return permissionsHasModule(app.modulo);
  };

  const { permissions } = usePermissions();

  function permissionsHasModule(modulo) {
    if (!Array.isArray(permissions)) return false;
    return permissions.some((p) => typeof p === 'string' && p.startsWith(`${modulo}:`));
  }

  // Handler de clique com verificação
  const handleClickApp = (app) => {
    const liberado = temAcessoModulo(app);
    if (!liberado) {
      alert(
        `Você não tem permissão para acessar o módulo "${app.nome}".\n\n` +
        `Contate o administrador do sistema para solicitar acesso.`
      );
      return;
    }
    app.acao();
  };

  // Botão do app (função auxiliar — evita duplicação de JSX)
  const renderAppButton = (app) => {
    const liberado = temAcessoModulo(app);
    const semAcesso = !liberado && app.modulo !== null;

    return (
      <button
        key={app.id}
        onClick={() => handleClickApp(app)}
        className={`
          group relative flex items-center p-6 text-left w-full
          bg-[#0a0a0c]/70 border border-white/5 rounded-3xl
          backdrop-blur-xl transition-all duration-300
          ${semAcesso
            ? 'opacity-60 cursor-not-allowed'
            : 'hover:-translate-y-1.5 hover:bg-[#121215] hover:border-white/10 hover:shadow-2xl'
          }
          overflow-hidden
        `}
        title={semAcesso ? `Sem permissão para acessar ${app.nome}` : app.nome}
      >
        {/* GLOW DE FUNDO HOVER (só se liberado) */}
        {!semAcesso && (
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent via-${app.glowColor.split('-')[1]}-600/10 to-transparent pointer-events-none`}></div>
        )}

        {/* CAIXA DO ÍCONE */}
        <div className={`
          relative flex-shrink-0 w-16 h-16 rounded-2xl
          bg-white/[0.03] border border-white/5
          flex items-center justify-center mr-6
          transition-all duration-300 shadow-inner
          ${!semAcesso ? app.borderColorHover : ''}
        `}>
          <div className="relative z-10">
            {app.icone}
          </div>

          {/* CADEADO se sem acesso */}
          {semAcesso && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          )}
        </div>

        {/* TEXTO */}
        <div className="flex flex-col relative z-10 justify-center">
          <h2 className={`text-xl font-semibold transition-colors ${
            semAcesso
              ? 'text-zinc-500'
              : 'text-zinc-200 group-hover:text-white'
          }`}>
            {app.nome}
          </h2>
          {semAcesso && (
            <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-wider mt-0.5">
              Sem permissão
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans relative overflow-hidden flex flex-col selection:bg-white/10">

      {/* BACKGROUND PREMIUM */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* NAVBAR */}
      <nav className="absolute top-0 right-0 z-20 flex items-center justify-end px-10 py-8">
        <UserAvatar 
          usuarioLogado={usuarioLogado} 
          onLogout={onLogout} 
          showName={true} 
          mostrarGestaoAcesso={true}
        />
      </nav>

      {/* MAIN */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6">

        {/* LOGO GIGANTE */}
        <div className="mb-8 md:mb-12">
          <LogoSophon className="h-28 md:h-36 lg:h-40 w-auto text-white drop-shadow-2xl" />
        </div>

        {/* GRID DE APPS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {apps.map((app) => renderAppButton(app))}
        </div>
      </main>
    </div>
  );
}