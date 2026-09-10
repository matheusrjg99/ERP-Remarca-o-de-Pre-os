import React, { useState } from 'react';
import { X, Briefcase, Key, Users } from 'lucide-react';
import TabCargos from './TabCargos';
import TabPermissoes from './TabPermissoes';
import TabUsuarios from './TabUsuarios';

/**
 * ModalRBAC - Modal principal de gerenciamento de acesso (RBAC)
 * 
 * Layout: Sidebar vertical à esquerda + área de conteúdo à direita
 * Paleta: Azul #3B8ED0 (segue padrão do módulo NC)
 * Estilo: inspirado em Linear / Stripe Dashboard
 * 
 * @param {Function} aoFechar - Callback para fechar o modal
 */
const ABAS = [
  {
    id: 'cargos',
    label: 'Cargos',
    description: 'Gerencie cargos e permissões',
    icon: Briefcase,
  },
  {
    id: 'permissoes',
    label: 'Permissões',
    description: 'Visualize permissões do sistema',
    icon: Key,
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    description: 'Atribua cargos a usuários',
    icon: Users,
  },
];

export default function ModalRBAC({ aoFechar }) {
  const [abaAtiva, setAbaAtiva] = useState('cargos');
  const abaAtual = ABAS.find((a) => a.id === abaAtiva);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">

        {/* ==================== CABEÇALHO ==================== */}
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#121215] shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight leading-none">
                Controle de Acesso
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-1">
                Cargos, permissões e atribuições de usuários
              </p>
            </div>
          </div>
          <button
            onClick={aoFechar}
            className="text-zinc-500 hover:text-white transition-all p-1.5 rounded-lg hover:bg-zinc-800"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ==================== CORPO (SIDEBAR + CONTEÚDO) ==================== */}
        <div className="flex flex-1 overflow-hidden">

          {/* ==================== SIDEBAR VERTICAL ==================== */}
          <aside className="w-60 bg-[#0d0d0f] border-r border-zinc-800 flex flex-col py-3 shrink-0">
            <nav className="flex flex-col gap-0.5 px-2">
              {ABAS.map((aba) => {
                const Icon = aba.icon;
                const ativa = abaAtiva === aba.id;
                return (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id)}
                    className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                      ativa
                        ? 'bg-[#3B8ED0]/10 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* Indicador azul à esquerda quando ativo */}
                    {ativa && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#3B8ED0] rounded-r-full" />
                    )}

                    <Icon
                      size={14}
                      className={`shrink-0 transition-colors ${
                        ativa ? 'text-[#3B8ED0]' : 'text-zinc-500 group-hover:text-zinc-400'
                      }`}
                    />

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold tracking-tight">
                        {aba.label}
                      </span>
                      <span
                        className={`text-[10px] font-medium truncate transition-colors ${
                          ativa ? 'text-zinc-400' : 'text-zinc-600'
                        }`}
                      >
                        {aba.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* Rodapé da sidebar */}
            <div className="mt-auto px-4 pt-4 border-t border-zinc-800/60 mx-2">
              <p className="text-[9px] font-medium text-zinc-600 leading-relaxed">
                Permissões são gerenciadas via SQL/seed no backend.
              </p>
            </div>
          </aside>

          {/* ==================== CONTEÚDO ==================== */}
          <main className="flex-1 overflow-y-auto bg-[#09090b] custom-scrollbar">

            {/* Cabeçalho interno da seção ativa */}
            <div className="px-6 py-4 border-b border-zinc-800/60 sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-10">
              <h4 className="text-xs font-black text-zinc-300 uppercase tracking-widest">
                {abaAtual?.label}
              </h4>
            </div>

            {/* Conteúdo da aba */}
            <div className="p-6">
              {abaAtiva === 'cargos' && <TabCargos />}
              {abaAtiva === 'permissoes' && <TabPermissoes />}
              {abaAtiva === 'usuarios' && <TabUsuarios />}
            </div>

          </main>
        </div>

      </div>
    </div>
  );
}