import React from 'react';
import LogoSophon from '../../components/LogoSophon';

export default function AppSelector({ onSelectRemarcacao, onLogout }) {
  const usuarioLogado = localStorage.getItem('usuario') || 'Usuário';

  const apps = [
    {
      id: 'remarcacao',
      nome: 'Remarcação',
      // Subtitle data removed for cleanliness
      icone: (
        // Enhanced glow for "more beautiful" aesthetic
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      ),
      acao: onSelectRemarcacao,
      // Refined hover borders and glows
      borderColorHover: "group-hover:border-blue-500/50",
      glowColor: "bg-blue-500"
    },
    {
      id: 'vendas',
      nome: 'Vendas',
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
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
      ),
      acao: () => window.open('http://192.168.0.250:8000/', '_blank'),
      borderColorHover: "group-hover:border-amber-500/50",
      glowColor: "bg-amber-500"
    }
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 font-sans relative overflow-hidden flex flex-col selection:bg-white/10">

      {/* BACKGROUND PREMIUM */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none"></div>

      {/* NAVBAR - Minimalista e Alinhada à Direita */}
      <nav className="absolute top-0 right-0 z-20 flex items-center justify-end px-10 py-8">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#121215] flex items-center justify-center border border-white/10 shadow-inner">
              <span className="text-xs font-bold text-zinc-400">
                {usuarioLogado.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-zinc-400">{usuarioLogado}</span>
          </div>

          <button
            onClick={onLogout}
            className="text-sm text-zinc-600 hover:text-white transition-colors"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* MAIN - Centralizado */}
      <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center px-6">

        {/* LOGO GIGANTE CENTRALIZADA */}
        <div className="mb-20">
          <LogoSophon className="h-16 md:h-20 w-auto text-white drop-shadow-2xl" />
        </div>

        {/* GRID HORIZONTAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={app.acao}
              // Card mais limpo e espaçoso, sem textos redundantes
              className={`
                group relative flex items-center p-6 text-left
                bg-[#0a0a0c]/70 border border-white/5 rounded-3xl
                backdrop-blur-xl transition-all duration-300
                hover:-translate-y-1.5 hover:bg-[#121215] hover:border-white/10
                hover:shadow-2xl overflow-hidden
              `}
            >
              
              {/* GLOW DE FUNDO HOVER (ilumina o card sutilmente com a cor do app, mais suave) */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent via-${app.glowColor.split('-')[1]}-600/10 to-transparent pointer-events-none`}></div>

              {/* CAIXA DO ÍCONE (Padrão e Limpo) */}
              <div className={`
                relative flex-shrink-0 w-16 h-16 rounded-2xl
                bg-white/[0.03] border border-white/5
                flex items-center justify-center mr-6
                transition-all duration-300 shadow-inner
                ${app.borderColorHover}
              `}>
                <div className="relative z-10">
                  {app.icone}
                </div>
              </div>

              {/* TEXTO - Nome Único e Destacado */}
              <div className="flex flex-col relative z-10 justify-center">
                {/* Nome maior e verticalmente centralizado agora que está sózinho */}
                <h2 className="text-xl font-semibold text-zinc-200 group-hover:text-white transition-colors">
                  {app.nome}
                </h2>
              </div>

            </button>
          ))}
        </div>
      </main>
    </div>
  );
}