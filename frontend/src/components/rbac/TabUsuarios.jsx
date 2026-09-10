import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Lock, RefreshCw, AlertTriangle, Plus, Edit3, Trash2, UserX, UserCheck } from 'lucide-react';
import { rbacService, userService } from '@/services';
import { usePermissions } from '@/hooks/usePermissions';
import { error as logError } from '@/utils/logger';
import ModalUsuarioForm from './ModalUsuarioForm';

/**
 * TabUsuarios - Aba de gerenciamento de usuários
 * 
 * Funcionalidades:
 * - Lista todos os usuários do sistema
 * - Criar novo usuário
 * - Editar nome, senha e cargo
 * - Ativar/Desativar usuário (soft delete)
 * - Busca por nome/login
 * - Filtro por cargo
 * 
 * IMPORTANTE: A API /users não retorna id numérico.
 * O identificador usado é o `login`.
 * 
 * Design: linear/stripe-like, paleta azul #3B8ED0
 */
export default function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [busca, setBusca] = useState('');
  const [cargoFiltro, setCargoFiltro] = useState('');
  const [salvando, setSalvando] = useState(null);
  const [deletando, setDeletando] = useState(null);

  // Modais
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const { permissions } = usePermissions();
  const podeAtribuir =
    permissions.includes('rbac:atribuir_cargo_usuario') ||
    permissions.includes('admin_total');
  const podeGerenciarUsuarios =
    permissions.includes('admin:usuarios') ||
    permissions.includes('admin_total');

  // ==================== BUSCAR DADOS ====================
  const buscarDados = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [usuariosResp, cargosResp] = await Promise.all([
        userService.getAll(),
        rbacService.getCargosSimples({ ativo: true }),
      ]);

      setUsuarios(Array.isArray(usuariosResp) ? usuariosResp : []);
      setCargos(Array.isArray(cargosResp) ? cargosResp : []);
    } catch (err) {
      logError('Erro ao buscar dados:', err);
      if (err?.response?.status === 403) {
        setErro('Você não tem permissão para visualizar usuários.');
      } else {
        setErro('Erro ao carregar dados. Tente novamente.');
      }
      setUsuarios([]);
      setCargos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  // ==================== FILTRO DE USUÁRIOS ====================
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const termo = busca.toLowerCase();
      const matchBusca =
        !busca ||
        u.nome?.toLowerCase().includes(termo) ||
        u.login?.toLowerCase().includes(termo);

      const matchCargo =
        !cargoFiltro ||
        (cargoFiltro === 'sem_cargo' && !u.cargo_id) ||
        String(u.cargo_id) === String(cargoFiltro);

      return matchBusca && matchCargo;
    });
  }, [usuarios, busca, cargoFiltro]);

  // ==================== ATRIBUIR CARGO (select inline) ====================
  const handleAtribuirCargo = async (usuario, novoCargoId) => {
    const cargoAnterior = usuario.cargo_id;
    const cargoIdFinal = novoCargoId === '' || novoCargoId === null
      ? null
      : parseInt(novoCargoId);

    if (cargoAnterior === cargoIdFinal) return;

    setSalvando(usuario.login);
    try {
      if (cargoIdFinal === null) {
        await rbacService.removerCargoDoUsuario(usuario.login);
      } else {
        await rbacService.atribuirCargoAoUsuario(usuario.login, cargoIdFinal);
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.login === usuario.login ? { ...u, cargo_id: cargoIdFinal } : u
        )
      );

      const acao = cargoIdFinal === null ? 'removido' : 'atribuído';
      alert(
        `Cargo ${acao} com sucesso!\n\nO usuário precisa fazer logout e login novamente para aplicar as novas permissões.`
      );
    } catch (err) {
      logError('Erro ao atribuir cargo:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Erro ao atribuir cargo. Tente novamente.';
      alert(detail);
    } finally {
      setSalvando(null);
    }
  };

  // ==================== CRIAR / EDITAR ====================
  const handleNovoUsuario = () => {
    setUsuarioEditando(null);
    setModalFormAberto(true);
  };

  const handleEditarUsuario = (usuario) => {
    setUsuarioEditando(usuario);
    setModalFormAberto(true);
  };

  const handleSucessoForm = () => {
    setModalFormAberto(false);
    setUsuarioEditando(null);
    buscarDados();
  };

  // ==================== ATIVAR / DESATIVAR ====================
  const handleAlternarStatus = async (usuario) => {
    const novoStatus = usuario.ativo ? 0 : 1;
    const acao = novoStatus === 1 ? 'ativar' : 'desativar';

    if (!window.confirm(`Tem certeza que deseja ${acao} o usuário "${usuario.nome}"?`)) {
      return;
    }

    setDeletando(usuario.login);
    try {
      await userService.updateStatus(usuario.login, novoStatus);
      await buscarDados();
    } catch (err) {
      logError('Erro ao alterar status:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        `Erro ao ${acao} usuário. Tente novamente.`;
      alert(detail);
    } finally {
      setDeletando(null);
    }
  };

  // ==================== HELPERS ====================
  const getNomeCargo = (cargoId) => {
    if (!cargoId) return null;
    const cargo = cargos.find((c) => c.id === cargoId);
    return cargo?.nome || null;
  };

  // ==================== RENDER ====================

  // Carregando
  if (carregando) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={18} className="text-[#3B8ED0] animate-spin" />
          <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Carregando usuários...
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
          onClick={buscarDados}
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
          <span className="text-zinc-300 font-bold">{usuarios.length}</span>{' '}
          {usuarios.length === 1 ? 'usuário' : 'usuários'} ·{' '}
          <span className="text-zinc-300 font-bold">{cargos.length}</span>{' '}
          {cargos.length === 1 ? 'cargo' : 'cargos'} disponíveis
        </p>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* BUSCA */}
          <div className="flex bg-[#121215] border border-zinc-800 rounded-lg overflow-hidden flex-1 lg:flex-initial min-w-[220px] focus-within:border-[#3B8ED0]/50 transition-all">
            <div className="flex items-center px-3 border-r border-zinc-800 bg-black/20 text-zinc-500">
              <Search size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-transparent text-sm font-medium text-zinc-200 px-3 py-2 outline-none w-full placeholder:text-zinc-600"
            />
          </div>

          {/* FILTRO DE CARGO */}
          <select
            value={cargoFiltro}
            onChange={(e) => setCargoFiltro(e.target.value)}
            className="bg-[#121215] border border-zinc-800 rounded-lg text-sm font-medium text-zinc-200 px-3 py-2 outline-none uppercase cursor-pointer focus:border-[#3B8ED0]/50 transition-all min-w-[180px]"
          >
            <option value="">Todos os cargos</option>
            <option value="sem_cargo">Sem cargo</option>
            {cargos.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#09090b]">
                {c.nome}
              </option>
            ))}
          </select>

          {/* RECARREGAR */}
          <button
            onClick={buscarDados}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white p-2.5 rounded-lg transition-all shrink-0"
            title="Recarregar"
          >
            <RefreshCw size={15} />
          </button>

          {/* NOVO USUÁRIO */}
          {podeGerenciarUsuarios && (
            <button
              onClick={handleNovoUsuario}
              className="bg-[#3B8ED0] hover:bg-[#2d74ab] text-white px-3.5 py-2 rounded-lg transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Plus size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Novo Usuário</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================== AVISO IMPORTANTE ==================== */}
      <div className="bg-[#3B8ED0]/[0.03] border border-[#3B8ED0]/15 rounded-lg p-3.5 flex items-start gap-2">
        <AlertTriangle size={14} className="text-[#3B8ED0] mt-0.5 shrink-0" />
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
          Ao alterar o cargo, o usuário precisa fazer <strong className="text-zinc-300">logout e login novamente</strong> para
          que as novas permissões sejam aplicadas no token JWT.
        </p>
      </div>

      {/* ==================== RESUMO FILTRO ==================== */}
      {(busca || cargoFiltro) && (
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
          <span>
            Mostrando {usuariosFiltrados.length} de {usuarios.length} usuários
          </span>
          <button
            onClick={() => {
              setBusca('');
              setCargoFiltro('');
            }}
            className="text-[#3B8ED0] hover:text-[#2d74ab] underline ml-1"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* ==================== LISTA VAZIA ==================== */}
      {usuariosFiltrados.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest mb-2">
            Nenhum usuário encontrado
          </p>
          {(busca || cargoFiltro) && (
            <p className="text-zinc-700 text-xs font-medium mt-2">
              Tente ajustar os filtros de busca
            </p>
          )}
        </div>
      ) : (
        /* ==================== TABELA ==================== */
        <div className="bg-[#0f0f11] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#121215] border-b border-zinc-800">
                <tr>
                  <th className="px-4 py-3 text-xs font-black text-zinc-500 uppercase tracking-widest">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-zinc-500 uppercase tracking-widest">
                    Cargo Atual
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-zinc-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {usuariosFiltrados.map((usuario) => {
                  const nomeCargo = usuario.cargo_nome || getNomeCargo(usuario.cargo_id);
                  const estaSalvando = salvando === usuario.login;
                  const estaDeletando = deletando === usuario.login;
                  const chaveUsuario = usuario.login;

                  return (
                    <tr
                      key={chaveUsuario}
                      className={`hover:bg-white/[0.02] transition-colors duration-150 ${
                        !usuario.ativo ? 'opacity-50' : ''
                      }`}
                    >
                      {/* USUÁRIO */}
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">
                            {usuario.nome || 'Sem nome'}
                          </p>
                          <p className="text-xs text-zinc-500 font-mono truncate mt-0.5">
                            {usuario.login}
                          </p>
                        </div>
                      </td>

                      {/* CARGO ATUAL */}
                      <td className="px-4 py-3">
                        {nomeCargo ? (
                          <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#3B8ED0]/10 text-[#3B8ED0] border border-[#3B8ED0]/20">
                            {nomeCargo}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-zinc-800 text-zinc-500">
                            Sem cargo
                          </span>
                        )}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        {usuario.ativo ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-zinc-800 text-zinc-500">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* AÇÕES */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* ATRIBUIR CARGO (select) */}
                          {podeAtribuir && (
                            <select
                              value={usuario.cargo_id || ''}
                              onChange={(e) =>
                                handleAtribuirCargo(usuario, e.target.value)
                              }
                              disabled={estaSalvando || estaDeletando}
                              className="bg-[#121215] border border-zinc-800 rounded-lg text-xs font-medium text-zinc-200 px-2.5 py-1.5 outline-none cursor-pointer hover:border-[#3B8ED0]/30 focus:border-[#3B8ED0]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
                              title="Alterar cargo"
                            >
                              <option value="">Sem cargo</option>
                              {cargos.map((cargo) => (
                                <option
                                  key={cargo.id}
                                  value={cargo.id}
                                  className="bg-[#09090b]"
                                >
                                  {cargo.nome}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* EDITAR */}
                          {podeGerenciarUsuarios && (
                            <button
                              onClick={() => handleEditarUsuario(usuario)}
                              disabled={estaSalvando || estaDeletando}
                              className="p-2 text-zinc-500 hover:text-[#3B8ED0] hover:bg-[#3B8ED0]/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Editar usuário"
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          {/* ATIVAR/DESATIVAR */}
                          {podeGerenciarUsuarios && (
                            <button
                              onClick={() => handleAlternarStatus(usuario)}
                              disabled={estaSalvando || estaDeletando}
                              className={`p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                                usuario.ativo
                                  ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                                  : 'text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                              }`}
                              title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                            >
                              {usuario.ativo ? <Trash2 size={15} /> : <UserCheck size={15} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ */}
          <div className="bg-[#121215] border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Total: <span className="text-white">{usuariosFiltrados.length}</span>{' '}
              {usuariosFiltrados.length === 1 ? 'usuário' : 'usuários'}
            </p>
            {podeGerenciarUsuarios && (
              <span className="text-[10px] font-medium text-zinc-500">
                Editar · Ativar/Desativar · Alterar cargo
              </span>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL ==================== */}
      {modalFormAberto && (
        <ModalUsuarioForm
          usuario={usuarioEditando}
          aoFechar={() => {
            setModalFormAberto(false);
            setUsuarioEditando(null);
          }}
          aoSalvar={handleSucessoForm}
        />
      )}

    </div>
  );
}