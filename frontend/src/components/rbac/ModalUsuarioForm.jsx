import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { userService, rbacService } from '@/services';
import { error as logError } from '@/utils/logger';

/**
 * ModalUsuarioForm - Sub-modal para criar ou editar um usuário
 * 
 * Modos:
 * - Criar: quando `usuario` é null
 * - Editar: quando `usuario` é passado como prop
 * 
 * IMPORTANTE:
 * - No modo edição, o login NÃO é editável (é a chave do usuário)
 * - No modo edição, a senha é OPCIONAL (só envia se quiser trocar)
 * - No modo criação, todos os campos são obrigatórios
 * 
 * Design: linear/stripe-like, paleta azul #3B8ED0
 * 
 * @param {Object|null} usuario - Usuário a editar (null = criar novo)
 * @param {Function} aoFechar - Callback para fechar o modal
 * @param {Function} aoSalvar - Callback após salvar com sucesso
 */
export default function ModalUsuarioForm({ usuario, aoFechar, aoSalvar }) {
  const editando = !!usuario;

  // ==================== ESTADO DO FORMULÁRIO ====================
  const [login, setLogin] = useState('');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cargoId, setCargoId] = useState('');

  // ==================== ESTADO DE UI ====================
  const [cargos, setCargos] = useState([]);
  const [carregandoCargos, setCarregandoCargos] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  // ==================== CARREGAR CARGOS ====================
  useEffect(() => {
    const carregarCargos = async () => {
      setCarregandoCargos(true);
      try {
        const response = await rbacService.getCargosSimples({ ativo: true });
        setCargos(Array.isArray(response) ? response : []);
      } catch (err) {
        logError('Erro ao carregar cargos:', err);
        setErro('Erro ao carregar cargos. Tente novamente.');
        setCargos([]);
      } finally {
        setCarregandoCargos(false);
      }
    };

    carregarCargos();
  }, []);

  // ==================== INICIALIZAÇÃO (EDITAR) ====================
  useEffect(() => {
    if (usuario) {
      setLogin(usuario.login || '');
      setNome(usuario.nome || '');
      setCargoId(usuario.cargo_id || '');
      setSenha('');
      setConfirmarSenha('');
    } else {
      setLogin('');
      setNome('');
      setCargoId('');
      setSenha('');
      setConfirmarSenha('');
    }
    setErro(null);
  }, [usuario]);

  // ==================== VALIDAÇÃO ====================
  const validar = () => {
    const loginTrim = login.trim();
    const nomeTrim = nome.trim();

    // Login (só obrigatório no modo criação)
    if (!editando) {
      if (!loginTrim) {
        setErro('O login é obrigatório.');
        return false;
      }
      if (loginTrim.length < 3) {
        setErro('O login deve ter pelo menos 3 caracteres.');
        return false;
      }
      if (loginTrim.length > 50) {
        setErro('O login deve ter no máximo 50 caracteres.');
        return false;
      }
    }

    // Nome
    if (!nomeTrim) {
      setErro('O nome é obrigatório.');
      return false;
    }
    if (nomeTrim.length < 3) {
      setErro('O nome deve ter pelo menos 3 caracteres.');
      return false;
    }
    if (nomeTrim.length > 100) {
      setErro('O nome deve ter no máximo 100 caracteres.');
      return false;
    }

    // Cargo
    if (!cargoId) {
      setErro('Selecione um cargo.');
      return false;
    }

    // Senha
    if (!editando) {
      // Modo criação: senha obrigatória
      if (!senha) {
        setErro('A senha é obrigatória.');
        return false;
      }
      if (senha.length < 6) {
        setErro('A senha deve ter pelo menos 6 caracteres.');
        return false;
      }
      if (senha !== confirmarSenha) {
        setErro('As senhas não coincidem.');
        return false;
      }
    } else {
      // Modo edição: senha opcional (mas se preencher, valida)
      if (senha || confirmarSenha) {
        if (senha.length < 6) {
          setErro('A nova senha deve ter pelo menos 6 caracteres.');
          return false;
        }
        if (senha !== confirmarSenha) {
          setErro('As senhas não coincidem.');
          return false;
        }
      }
    }

    return true;
  };

  // ==================== SALVAR ====================
  const handleSalvar = async () => {
    setErro(null);

    if (!validar()) return;

    setSalvando(true);
    try {
      if (editando) {
        // ============ MODO EDIÇÃO ============
        const payload = {};

        // Só envia o nome se mudou
        if (nome.trim().toUpperCase() !== (usuario.nome || '').toUpperCase()) {
          payload.nome = nome.trim();
        }

        // Só envia o cargo se mudou
        if (parseInt(cargoId) !== usuario.cargo_id) {
          payload.cargo_id = parseInt(cargoId);
        }

        // Só envia a senha se foi preenchida
        if (senha) {
          payload.senha = senha;
        }

        // Se nada mudou, apenas fecha
        if (Object.keys(payload).length === 0) {
          aoFechar();
          return;
        }

        await userService.update(usuario.login, payload);
      } else {
        // ============ MODO CRIAÇÃO ============
        const payload = {
          login: login.trim().toLowerCase(),
          nome: nome.trim(),
          senha: senha,
          cargo_id: parseInt(cargoId),
        };

        await userService.create(payload);
      }

      aoSalvar();
    } catch (err) {
      logError('Erro ao salvar usuário:', err);

      let detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Erro ao salvar usuário. Tente novamente.';

      // Se `detail` for uma lista (erro de validação do FastAPI), extrai a primeira msg
      if (Array.isArray(detail)) {
        detail = detail[0]?.msg || 'Dados inválidos.';
      }

      setErro(detail);
    } finally {
      setSalvando(false);
    }
  };

  // ==================== SUBMIT COM ENTER ====================
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !salvando) {
      e.preventDefault();
      handleSalvar();
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

        {/* ==================== CABEÇALHO ==================== */}
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#121215] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3B8ED0]/10 border border-[#3B8ED0]/20 flex items-center justify-center">
              <User size={15} className="text-[#3B8ED0]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {editando ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                {editando ? usuario.login : 'Preencha os dados'}
              </p>
            </div>
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

        {/* ==================== CORPO DO FORMULÁRIO ==================== */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">

          {/* ERRO */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-400 font-medium">{erro}</p>
            </div>
          )}

          {/* LOGIN (só no modo criação) */}
          {!editando && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                Login <span className="text-[#3B8ED0]">*</span>
              </label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: joao silva"
                maxLength={50}
                autoFocus
                disabled={salvando}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
              />
              <p className="text-[10px] text-zinc-600 mt-1 font-medium">
                Usado para fazer login. Não pode ser alterado depois.
              </p>
            </div>
          )}

          {/* NOME */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
              Nome Completo <span className="text-[#3B8ED0]">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: João Silva Santos"
              maxLength={100}
              autoFocus={editando}
              disabled={salvando}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
            />
            <p className="text-[10px] text-zinc-600 mt-1 font-medium">
              {nome.length}/100 caracteres
            </p>
          </div>

          {/* CARGO */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
              Cargo <span className="text-[#3B8ED0]">*</span>
            </label>
            <select
              value={cargoId}
              onChange={(e) => setCargoId(e.target.value)}
              disabled={salvando || carregandoCargos}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="">
                {carregandoCargos ? 'Carregando cargos...' : 'Selecione um cargo'}
              </option>
              {cargos.map((cargo) => (
                <option key={cargo.id} value={cargo.id} className="bg-[#09090b]">
                  {cargo.nome}
                </option>
              ))}
            </select>
          </div>

          {/* DIVISOR */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
              {editando ? 'Trocar senha (opcional)' : 'Definir senha'}
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* SENHA */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
              Senha {!editando && <span className="text-[#3B8ED0]">*</span>}
            </label>
            <div className="relative">
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={editando ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
                disabled={salvando}
                className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                disabled={salvando}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50"
                title={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {editando && (
              <p className="text-[10px] text-zinc-600 mt-1 font-medium">
                Deixe em branco se não quiser alterar
              </p>
            )}
          </div>

          {/* CONFIRMAR SENHA */}
          {(senha || !editando) && (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
                Confirmar Senha {!editando && <span className="text-[#3B8ED0]">*</span>}
              </label>
              <div className="relative">
                <input
                  type={mostrarConfirmar ? 'text' : 'password'}
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite a senha novamente"
                  disabled={salvando}
                  className="w-full bg-[#09090b] border border-zinc-800 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                  disabled={salvando}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1.5 rounded transition-colors disabled:opacity-50"
                  title={mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarConfirmar ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {senha && confirmarSenha && senha !== confirmarSenha && (
                <p className="text-[10px] text-red-400 mt-1 font-medium">
                  As senhas não coincidem
                </p>
              )}
            </div>
          )}
        </div>

        {/* ==================== RODAPÉ ==================== */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-[#121215] flex gap-2 shrink-0">
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
            disabled={salvando || carregandoCargos}
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
                {editando ? 'Salvar' : 'Criar'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}