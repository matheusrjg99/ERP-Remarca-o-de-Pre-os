import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Lock, RefreshCw } from 'lucide-react';
import { rbacService } from '@/services';
import { error as logError } from '@/utils/logger';

/**
 * TabPermissoes - Aba de visualização das permissões do sistema (READ-ONLY)
 * 
 * IMPORTANTE: Permissões são gerenciadas via SQL/migration/seed no backend.
 * Este componente é apenas para consulta/visualização.
 * 
 * Funcionalidades:
 * - Lista todas as permissões do sistema
 * - Agrupamento por módulo (lista vertical)
 * - Busca por código/descrição
 * - Filtro por módulo
 * - Contadores por módulo
 * 
 * Design: lista vertical + chip azul sutil + tipografia confortável
 */
export default function TabPermissoes() {
  const [permissoes, setPermissoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [moduloFiltro, setModuloFiltro] = useState('');

  // ==================== BUSCAR PERMISSÕES ====================
  const buscarPermissoes = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const response = await rbacService.getPermissoes({ ativo: true });
      setPermissoes(Array.isArray(response) ? response : []);
    } catch (err) {
      logError('Erro ao buscar permissões:', err);
      if (err?.response?.status === 403) {
        setErro('Você não tem permissão para visualizar permissões.');
      } else {
        setErro('Erro ao carregar permissões. Tente novamente.');
      }
      setPermissoes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarPermissoes();
  }, [buscarPermissoes]);

  // ==================== MÓDULOS DISPONÍVEIS ====================
  const modulos = useMemo(() => {
    return [...new Set(permissoes.map((p) => p.modulo))].sort();
  }, [permissoes]);

  // ==================== PERMISSÕES FILTRADAS ====================
  const permissoesFiltradas = useMemo(() => {
    return permissoes.filter((p) => {
      const matchBusca =
        !busca ||
        p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        (p.descricao || '').toLowerCase().includes(busca.toLowerCase());
      const matchModulo = !moduloFiltro || p.modulo === moduloFiltro;
      return matchBusca && matchModulo;
    });
  }, [permissoes, busca, moduloFiltro]);

  // ==================== AGRUPAR POR MÓDULO ====================
  const permissoesAgrupadas = useMemo(() => {
    const agrupado = {};
    permissoesFiltradas.forEach((p) => {
      if (!agrupado[p.modulo]) agrupado[p.modulo] = [];
      agrupado[p.modulo].push(p);
    });
    return agrupado;
  }, [permissoesFiltradas]);

  // ==================== RENDER ====================

  // Carregando
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={20} className="text-[#3B8ED0] animate-spin" />
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Carregando permissões...
          </span>
        </div>
      </div>
    );
  }

  // Erro
  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock size={22} className="text-red-500" />
        </div>
        <p className="text-zinc-400 text-sm max-w-md mb-4">{erro}</p>
        <button
          onClick={buscarPermissoes}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ==================== BARRA DE AÇÕES ==================== */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <p className="text-xs text-zinc-500 font-medium">
          <span className="text-zinc-300 font-bold">{permissoes.length}</span>{' '}
          {permissoes.length === 1 ? 'permissão' : 'permissões'} ·{' '}
          <span className="text-zinc-300 font-bold">{modulos.length}</span>{' '}
          {modulos.length === 1 ? 'módulo' : 'módulos'}
        </p>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* BUSCA */}
          <div className="flex bg-[#121215] border border-zinc-800 rounded-lg overflow-hidden flex-1 lg:flex-initial min-w-[220px] focus-within:border-[#3B8ED0]/50 transition-all">
            <div className="flex items-center px-3 border-r border-zinc-800 bg-black/20 text-zinc-500">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar permissão..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-transparent text-sm font-medium text-zinc-200 px-3 py-2 outline-none w-full placeholder:text-zinc-600"
            />
          </div>

          {/* FILTRO DE MÓDULO */}
          <select
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
            className="bg-[#121215] border border-zinc-800 rounded-lg text-sm font-medium text-zinc-200 px-3 py-2 outline-none uppercase cursor-pointer focus:border-[#3B8ED0]/50 transition-all min-w-[180px]"
          >
            <option value="">Todos os módulos</option>
            {modulos.map((m) => (
              <option key={m} value={m} className="bg-[#09090b]">
                {m}
              </option>
            ))}
          </select>

          {/* RECARREGAR */}
          <button
            onClick={buscarPermissoes}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-2.5 rounded-lg transition-all shrink-0"
            title="Recarregar"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ==================== AVISO READ-ONLY ==================== */}
      <div className="bg-[#3B8ED0]/[0.03] border border-[#3B8ED0]/15 rounded-lg p-3.5">
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
          Permissões são gerenciadas via <strong className="text-zinc-300">SQL / migration / seed</strong> no backend
          e são apenas para consulta aqui. Para atribuir permissões a um cargo, use a
          aba <strong className="text-zinc-300">Cargos</strong>.
        </p>
      </div>

      {/* ==================== RESUMO DO FILTRO ==================== */}
      {(busca || moduloFiltro) && (
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <span>
            Mostrando {permissoesFiltradas.length} de {permissoes.length} permissões
          </span>
          <button
            onClick={() => {
              setBusca('');
              setModuloFiltro('');
            }}
            className="text-[#3B8ED0] hover:text-[#2d74ab] underline ml-1"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* ==================== LISTA AGRUPADA ==================== */}
      {Object.keys(permissoesAgrupadas).length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-2">
            Nenhuma permissão encontrada
          </p>
          {(busca || moduloFiltro) && (
            <p className="text-zinc-700 text-xs font-medium mt-2">
              Tente ajustar os filtros de busca
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(permissoesAgrupadas)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([modulo, perms]) => (
              <div key={modulo}>
                {/* CABEÇALHO DO MÓDULO */}
                <div className="flex items-center gap-2.5 mb-3">
                  {/* Barra de acento azul */}
                  <div className="w-0.5 h-4 bg-[#3B8ED0] rounded-full" />

                  <h5 className="text-sm font-bold text-white uppercase tracking-wider">
                    {modulo}
                  </h5>

                  <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                    {perms.length}
                  </span>
                </div>

                {/* LISTA VERTICAL DE PERMISSÕES */}
                <div className="bg-[#121215] border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
                  {perms.map((perm) => (
                    <div
                      key={perm.id}
                      className="px-4 py-3.5 hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      {/* CHIP DO CÓDIGO */}
                      <span className="inline-block text-xs font-mono font-bold text-[#3B8ED0] bg-[#3B8ED0]/10 border border-[#3B8ED0]/20 px-2 py-0.5 rounded-md">
                        {perm.codigo}
                      </span>

                      {/* DESCRIÇÃO */}
                      <p className="text-sm text-zinc-300 leading-relaxed mt-1.5">
                        {perm.descricao || 'Sem descrição'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

    </div>
  );
}