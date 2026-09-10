import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Search, AlertCircle, Loader2, Check } from 'lucide-react';
import { rbacService } from '@/services';
import { error as logError } from '@/utils/logger';

/**
 * ModalGerenciarPermissoes - Sub-modal para atribuir permissões a um cargo
 * 
 * Funcionalidades:
 * - Lista todas as permissões do sistema agrupadas por módulo
 * - Checkboxes para selecionar permissões
 * - Busca por código/descrição
 * - Filtro por módulo
 * - Botão "Selecionar todas do módulo" / "Limpar"
 * - Salva substituindo TODAS as permissões do cargo
 * 
 * Design: lista vertical + chip azul sutil + tipografia confortável
 * 
 * @param {Object} cargo - Cargo cujas permissões serão gerenciadas
 * @param {Function} aoFechar - Callback para fechar o modal
 * @param {Function} aoSalvar - Callback após salvar com sucesso
 */
export default function ModalGerenciarPermissoes({ cargo, aoFechar, aoSalvar }) {
  // ==================== ESTADO ====================
  const [todasPermissoes, setTodasPermissoes] = useState([]);
  const [selecionadas, setSelecionadas] = useState(new Set());
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [moduloFiltro, setModuloFiltro] = useState('');

  // ==================== CARREGAR PERMISSÕES ====================
  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      setErro(null);
      try {
        const response = await rbacService.getPermissoes({ ativo: true });
        const perms = Array.isArray(response) ? response : [];
        setTodasPermissoes(perms);

        const idsAtuais = (cargo?.permissoes || []).map((p) => p.id);
        setSelecionadas(new Set(idsAtuais));
      } catch (err) {
        logError('Erro ao carregar permissões:', err);
        setErro('Erro ao carregar permissões. Tente novamente.');
        setTodasPermissoes([]);
      } finally {
        setCarregando(false);
      }
    };

    carregar();
  }, [cargo]);

  // ==================== MÓDULOS DISPONÍVEIS ====================
  const modulos = useMemo(() => {
    return [...new Set(todasPermissoes.map((p) => p.modulo))].sort();
  }, [todasPermissoes]);

  // ==================== PERMISSÕES FILTRADAS ====================
  const permissoesFiltradas = useMemo(() => {
    return todasPermissoes.filter((p) => {
      const matchBusca =
        !busca ||
        p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        (p.descricao || '').toLowerCase().includes(busca.toLowerCase());
      const matchModulo = !moduloFiltro || p.modulo === moduloFiltro;
      return matchBusca && matchModulo;
    });
  }, [todasPermissoes, busca, moduloFiltro]);

  // ==================== AGRUPAR POR MÓDULO ====================
  const permissoesAgrupadas = useMemo(() => {
    const agrupado = {};
    permissoesFiltradas.forEach((p) => {
      if (!agrupado[p.modulo]) agrupado[p.modulo] = [];
      agrupado[p.modulo].push(p);
    });
    return agrupado;
  }, [permissoesFiltradas]);

  // ==================== TOGGLE PERMISSÃO ====================
  const togglePermissao = (permId) => {
    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (novo.has(permId)) {
        novo.delete(permId);
      } else {
        novo.add(permId);
      }
      return novo;
    });
  };

  // ==================== TOGGLE MÓDULO INTEIRO ====================
  const toggleModulo = (modulo) => {
    const permsDoModulo = todasPermissoes.filter((p) => p.modulo === modulo);
    const todosSelecionados = permsDoModulo.every((p) => selecionadas.has(p.id));

    setSelecionadas((prev) => {
      const novo = new Set(prev);
      if (todosSelecionados) {
        permsDoModulo.forEach((p) => novo.delete(p.id));
      } else {
        permsDoModulo.forEach((p) => novo.add(p.id));
      }
      return novo;
    });
  };

  // ==================== SALVAR ====================
  const handleSalvar = async () => {
    setErro(null);
    setSalvando(true);
    try {
      const permissoesIds = Array.from(selecionadas);
      await rbacService.atribuirPermissoesAoCargo(cargo.id, permissoesIds);
      aoSalvar();
    } catch (err) {
      logError('Erro ao salvar permissões:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Erro ao salvar permissões. Tente novamente.';
      setErro(detail);
    } finally {
      setSalvando(false);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">

        {/* ==================== CABEÇALHO ==================== */}
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#121215]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Gerenciar Permissões
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              {cargo?.nome}
            </p>
          </div>
          <button
            onClick={aoFechar}
            disabled={salvando}
            className="text-zinc-500 hover:text-white transition-all p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ==================== FILTROS ==================== */}
        <div className="px-5 py-3 border-b border-zinc-800 bg-[#09090b] flex flex-col lg:flex-row gap-2">
          {/* BUSCA */}
          <div className="flex bg-[#121215] border border-zinc-800 rounded-lg overflow-hidden flex-1 min-w-[200px] focus-within:border-[#3B8ED0]/50 transition-all">
            <div className="flex items-center px-3 border-r border-zinc-800 bg-black/20 text-zinc-500">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar permissão..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              disabled={salvando}
              className="bg-transparent text-sm font-medium text-zinc-200 px-3 py-2 outline-none w-full placeholder:text-zinc-600 disabled:opacity-50"
            />
          </div>

          {/* FILTRO DE MÓDULO */}
          <select
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
            disabled={salvando}
            className="bg-[#121215] border border-zinc-800 rounded-lg text-sm font-medium text-zinc-200 px-3 py-2 outline-none uppercase cursor-pointer focus:border-[#3B8ED0]/50 transition-all disabled:opacity-50 min-w-[180px]"
          >
            <option value="">Todos os módulos</option>
            {modulos.map((m) => (
              <option key={m} value={m} className="bg-[#09090b]">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* ==================== RESUMO ==================== */}
        <div className="px-5 py-2.5 bg-[#121215] border-b border-zinc-800 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">
            <span className="text-[#3B8ED0] font-bold">{selecionadas.size}</span> de {todasPermissoes.length} selecionadas
          </span>
          <button
            onClick={() => setSelecionadas(new Set())}
            disabled={salvando || selecionadas.size === 0}
            className="text-xs font-medium text-zinc-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Limpar tudo
          </button>
        </div>

        {/* ==================== CORPO ==================== */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#09090b] custom-scrollbar">

          {/* ERRO */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 mb-4">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400 font-medium">{erro}</p>
            </div>
          )}

          {/* CARREGANDO */}
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={20} className="text-[#3B8ED0] animate-spin mb-3" />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                Carregando permissões...
              </p>
            </div>
          ) : Object.keys(permissoesAgrupadas).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
                Nenhuma permissão encontrada
              </p>
              {busca && (
                <p className="text-zinc-700 text-xs font-medium mt-2">
                  Tente ajustar os filtros de busca
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(permissoesAgrupadas)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([modulo, perms]) => {
                  const total = perms.length;
                  const selecionadasNoModulo = perms.filter((p) => selecionadas.has(p.id)).length;
                  const todasSelecionadas = selecionadasNoModulo === total;
                  const algumasSelecionadas = selecionadasNoModulo > 0 && !todasSelecionadas;

                  return (
                    <div key={modulo}>
                      {/* CABEÇALHO DO MÓDULO */}
                      <div className="flex items-center gap-2.5 mb-3">
                        {/* Checkbox do módulo */}
                        <button
                          type="button"
                          onClick={() => toggleModulo(modulo)}
                          disabled={salvando}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 disabled:opacity-50 ${
                            todasSelecionadas
                              ? 'bg-[#3B8ED0] border-[#3B8ED0]'
                              : algumasSelecionadas
                              ? 'bg-[#3B8ED0]/50 border-[#3B8ED0]/50'
                              : 'bg-transparent border-zinc-700 hover:border-[#3B8ED0]'
                          }`}
                          title={todasSelecionadas ? 'Desmarcar módulo' : 'Marcar módulo'}
                        >
                          {todasSelecionadas && <Check size={11} className="text-white" strokeWidth={3} />}
                          {algumasSelecionadas && <div className="w-1.5 h-1.5 bg-white rounded-sm" />}
                        </button>

                        {/* Barra de acento azul */}
                        <div className="w-0.5 h-4 bg-[#3B8ED0] rounded-full" />

                        {/* Nome do módulo */}
                        <button
                          type="button"
                          onClick={() => toggleModulo(modulo)}
                          disabled={salvando}
                          className="text-sm font-bold text-white uppercase tracking-wider disabled:opacity-50 hover:text-[#3B8ED0] transition-colors"
                        >
                          {modulo}
                        </button>

                        {/* Contador */}
                        <span className="text-xs font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full">
                          {selecionadasNoModulo}/{total}
                        </span>
                      </div>

                      {/* LISTA VERTICAL DE PERMISSÕES */}
                      <div className="ml-6 bg-[#121215] border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800/60">
                        {perms.map((perm) => {
                          const isSelected = selecionadas.has(perm.id);
                          return (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => togglePermissao(perm.id)}
                              disabled={salvando}
                              className={`w-full text-left px-4 py-3 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed group ${
                                isSelected
                                  ? 'bg-[#3B8ED0]/[0.04] hover:bg-[#3B8ED0]/[0.06]'
                                  : 'hover:bg-white/[0.02]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Checkbox */}
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                    isSelected
                                      ? 'bg-[#3B8ED0] border-[#3B8ED0]'
                                      : 'bg-transparent border-zinc-700 group-hover:border-[#3B8ED0]'
                                  }`}
                                >
                                  {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                                </div>

                                {/* Conteúdo */}
                                <div className="min-w-0 flex-1">
                                  {/* Chip do código */}
                                  <span
                                    className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-md transition-all ${
                                      isSelected
                                        ? 'text-[#3B8ED0] bg-[#3B8ED0]/10 border border-[#3B8ED0]/20'
                                        : 'text-zinc-400 bg-zinc-900 border border-zinc-800'
                                    }`}
                                  >
                                    {perm.codigo}
                                  </span>

                                  {/* Descrição */}
                                  <p className="text-sm text-zinc-300 leading-relaxed mt-1.5">
                                    {perm.descricao || 'Sem descrição'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ==================== RODAPÉ ==================== */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-[#121215] flex gap-2">
          <button
            type="button"
            onClick={aoFechar}
            disabled={salvando}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando || carregando}
            className="flex-1 bg-[#3B8ED0] hover:bg-[#2d74ab] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={14} />
                Salvar Permissões
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}