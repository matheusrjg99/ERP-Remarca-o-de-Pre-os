import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, Shield, Lock, RefreshCw } from 'lucide-react';
import { rbacService } from '@/services';
import { usePermissions } from '@/hooks/usePermissions';
import { error as logError } from '@/utils/logger';
import ModalCargoForm from './ModalCargoForm';
import ModalGerenciarPermissoes from './ModalGerenciarPermissoes';

/**
 * TabCargos - Aba de gerenciamento de cargos
 * 
 * Funcionalidades:
 * - Lista todos os cargos com contagem de permissões e usuários
 * - Criar novo cargo
 * - Editar cargo (nome, descrição, ativo)
 * - Excluir cargo (validação de uso no backend)
 * - Gerenciar permissões do cargo (modal dedicado)
 * 
 * Design: linear/stripe-like, paleta azul #3B8ED0
 */
export default function TabCargos() {
  const [cargos, setCargos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [cargoEditando, setCargoEditando] = useState(null);
  const [cargoPermissoes, setCargoPermissoes] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const { permissions } = usePermissions();

  // Verificações de permissão
  const podeCriar = permissions.includes('rbac:cargo_criar') || permissions.includes('admin_total');
  const podeEditar = permissions.includes('rbac:cargo_editar') || permissions.includes('admin_total');
  const podeExcluir = permissions.includes('rbac:cargo_excluir') || permissions.includes('admin_total');

  // ==================== BUSCAR CARGOS ====================
  const buscarCargos = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const response = await rbacService.getCargos({
        incluir_permissoes: true,
        incluir_usuarios_count: true,
      });
      setCargos(Array.isArray(response) ? response : []);
    } catch (err) {
      logError('Erro ao buscar cargos:', err);
      if (err?.response?.status === 403) {
        setErro('Você não tem permissão para visualizar cargos.');
      } else {
        setErro('Erro ao carregar cargos. Tente novamente.');
      }
      setCargos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarCargos();
  }, [buscarCargos]);

  // ==================== AÇÕES ====================
  const handleCriar = () => {
    setCargoEditando(null);
    setModalFormAberto(true);
  };

  const handleEditar = (cargo) => {
    setCargoEditando(cargo);
    setModalFormAberto(true);
  };

  const handleExcluir = async (cargo) => {
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir o cargo "${cargo.nome}"?\n\nEsta ação não pode ser desfeita.`
    );
    if (!confirmado) return;

    setExcluindo(cargo.id);
    try {
      await rbacService.deleteCargo(cargo.id);
      await buscarCargos();
    } catch (err) {
      logError('Erro ao excluir cargo:', err);
      const detail = err?.response?.data?.detail || 'Erro ao excluir cargo.';
      alert(detail);
    } finally {
      setExcluindo(null);
    }
  };

  const handleGerenciarPermissoes = (cargo) => {
    setCargoPermissoes(cargo);
  };

  const handleSucessoForm = () => {
    setModalFormAberto(false);
    setCargoEditando(null);
    buscarCargos();
  };

  const handleSucessoPermissoes = () => {
    setCargoPermissoes(null);
    buscarCargos();
  };

  // ==================== RENDER ====================

  // Carregando
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={18} className="text-[#3B8ED0] animate-spin" />
          <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            Carregando cargos...
          </span>
        </div>
      </div>
    );
  }

  // Erro de permissão
  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <Lock size={22} className="text-red-500" />
        </div>
        <p className="text-zinc-400 text-sm max-w-md mb-4">{erro}</p>
        <button
          onClick={buscarCargos}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ==================== BARRA DE AÇÕES ==================== */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] text-zinc-500 font-medium">
          <span className="text-zinc-300 font-bold">{cargos.length}</span>{' '}
          {cargos.length === 1 ? 'cargo' : 'cargos'} cadastrado{cargos.length === 1 ? '' : 's'}
        </p>

        <div className="flex gap-2">
          <button
            onClick={buscarCargos}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-2 rounded-lg transition-all"
            title="Recarregar"
          >
            <RefreshCw size={14} />
          </button>

          {podeCriar && (
            <button
              onClick={handleCriar}
              className="bg-[#3B8ED0] hover:bg-[#2d74ab] text-white px-3.5 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Novo Cargo</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== LISTA VAZIA ==================== */}
      {cargos.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mx-auto mb-4">
            <Shield size={22} className="text-zinc-700" />
          </div>
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-2">
            Nenhum cargo cadastrado
          </p>
          {podeCriar && (
            <p className="text-zinc-700 text-[10px] font-medium">
              Clique em "Novo Cargo" para começar
            </p>
          )}
        </div>
      ) : (
        /* ==================== GRID DE CARGOS ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cargos.map((cargo) => (
            <div
              key={cargo.id}
              className="bg-[#121215] border border-zinc-800 rounded-xl p-4 hover:border-[#3B8ED0]/30 transition-all duration-150 group flex flex-col"
            >
              {/* HEADER DO CARD */}
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-[#3B8ED0]/10 border border-[#3B8ED0]/20 flex items-center justify-center shrink-0">
                    <Shield size={13} className="text-[#3B8ED0]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-black text-white uppercase tracking-tight truncate leading-tight">
                      {cargo.nome}
                    </h5>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        cargo.ativo
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {cargo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                {/* AÇÕES DO CARD (hover) */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {podeEditar && (
                    <button
                      onClick={() => handleEditar(cargo)}
                      className="p-1.5 text-zinc-500 hover:text-[#3B8ED0] hover:bg-[#3B8ED0]/10 rounded-md transition-all"
                      title="Editar cargo"
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                  {podeExcluir && (
                    <button
                      onClick={() => handleExcluir(cargo)}
                      disabled={excluindo === cargo.id}
                      className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Excluir cargo"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* DESCRIÇÃO */}
              {cargo.descricao ? (
                <p className="text-[11px] text-zinc-500 mb-3 line-clamp-2 min-h-[30px] leading-relaxed">
                  {cargo.descricao}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-700 italic mb-3 min-h-[30px] leading-relaxed">
                  Sem descrição
                </p>
              )}

              {/* ESTATÍSTICAS (sem ícones, texto puro) */}
              <div className="flex items-center gap-2 mb-3 text-[10px] font-medium text-zinc-500">
                <span>
                  <span className="text-zinc-300 font-bold">{cargo.permissoes?.length || 0}</span>{' '}
                  {cargo.permissoes?.length === 1 ? 'permissão' : 'permissões'}
                </span>
                <span className="text-zinc-700">·</span>
                <span>
                  <span className="text-zinc-300 font-bold">{cargo.total_usuarios || 0}</span>{' '}
                  {cargo.total_usuarios === 1 ? 'usuário' : 'usuários'}
                </span>
              </div>

              {/* BOTÃO GERENCIAR PERMISSÕES */}
              {podeEditar && (
                <button
                  onClick={() => handleGerenciarPermissoes(cargo)}
                  className="w-full mt-auto bg-zinc-900 hover:bg-[#3B8ED0]/10 border border-zinc-800 hover:border-[#3B8ED0]/30 text-zinc-400 hover:text-[#3B8ED0] px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  Gerenciar Permissões
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================== MODAIS ==================== */}
      {modalFormAberto && (
        <ModalCargoForm
          cargo={cargoEditando}
          aoFechar={() => {
            setModalFormAberto(false);
            setCargoEditando(null);
          }}
          aoSalvar={handleSucessoForm}
        />
      )}

      {cargoPermissoes && (
        <ModalGerenciarPermissoes
          cargo={cargoPermissoes}
          aoFechar={() => setCargoPermissoes(null)}
          aoSalvar={handleSucessoPermissoes}
        />
      )}
    </div>
  );
}