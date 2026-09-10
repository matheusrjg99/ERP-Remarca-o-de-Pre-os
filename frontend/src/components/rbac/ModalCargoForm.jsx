import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { rbacService } from '@/services';
import { error as logError } from '@/utils/logger';

/**
 * ModalCargoForm - Sub-modal para criar ou editar um cargo
 * 
 * Modos:
 * - Criar: quando `cargo` é null
 * - Editar: quando `cargo` é passado como prop
 * 
 * IMPORTANTE: Este modal NÃO altera permissões do cargo.
 * Para gerenciar permissões, use o ModalGerenciarPermissoes.
 * 
 * Design: linear/stripe-like, paleta azul #3B8ED0
 * 
 * @param {Object|null} cargo - Cargo a editar (null = criar novo)
 * @param {Function} aoFechar - Callback para fechar o modal
 * @param {Function} aoSalvar - Callback após salvar com sucesso
 */
export default function ModalCargoForm({ cargo, aoFechar, aoSalvar }) {
  const editando = !!cargo;

  // ==================== ESTADO DO FORMULÁRIO ====================
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);

  // ==================== ESTADO DE UI ====================
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);

  // ==================== INICIALIZAÇÃO (EDITAR) ====================
  useEffect(() => {
    if (cargo) {
      setNome(cargo.nome || '');
      setDescricao(cargo.descricao || '');
      setAtivo(cargo.ativo ?? true);
    } else {
      setNome('');
      setDescricao('');
      setAtivo(true);
    }
    setErro(null);
  }, [cargo]);

  // ==================== VALIDAÇÃO ====================
  const validar = () => {
    const nomeTrim = nome.trim();

    if (!nomeTrim) {
      setErro('O nome do cargo é obrigatório.');
      return false;
    }

    if (nomeTrim.length < 3) {
      setErro('O nome do cargo deve ter pelo menos 3 caracteres.');
      return false;
    }

    if (nomeTrim.length > 100) {
      setErro('O nome do cargo deve ter no máximo 100 caracteres.');
      return false;
    }

    if (descricao && descricao.length > 255) {
      setErro('A descrição deve ter no máximo 255 caracteres.');
      return false;
    }

    return true;
  };

  // ==================== SALVAR ====================
  const handleSalvar = async () => {
    setErro(null);

    if (!validar()) return;

    setSalvando(true);
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        ativo,
      };

      if (editando) {
        await rbacService.updateCargo(cargo.id, payload);
      } else {
        await rbacService.createCargo(payload);
      }

      aoSalvar();
    } catch (err) {
      logError('Erro ao salvar cargo:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Erro ao salvar cargo. Tente novamente.';
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f0f11] border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">

        {/* ==================== CABEÇALHO ==================== */}
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#121215]">
          <h3 className="text-xs font-black text-white uppercase tracking-widest">
            {editando ? 'Editar Cargo' : 'Novo Cargo'}
          </h3>
          <button
            onClick={aoFechar}
            disabled={salvando}
            className="text-zinc-500 hover:text-white transition-all p-1.5 rounded-lg hover:bg-zinc-800 disabled:opacity-50"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* ==================== CORPO DO FORMULÁRIO ==================== */}
        <div className="p-5 space-y-4">

          {/* ERRO */}
          {erro && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-400 font-medium">{erro}</p>
            </div>
          )}

          {/* NOME */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
              Nome do Cargo <span className="text-[#3B8ED0]">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Auditor, Gestor, Operador..."
              maxLength={100}
              autoFocus
              disabled={salvando}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all placeholder:text-zinc-600 disabled:opacity-50"
            />
            <p className="text-[9px] text-zinc-600 mt-1 font-medium">
              {nome.length}/100 caracteres
            </p>
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descrição opcional das responsabilidades do cargo..."
              rows={3}
              maxLength={255}
              disabled={salvando}
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#3B8ED0]/50 transition-all resize-none placeholder:text-zinc-600 disabled:opacity-50"
            />
            <p className="text-[9px] text-zinc-600 mt-1 font-medium">
              {descricao.length}/255 caracteres
            </p>
          </div>

          {/* STATUS ATIVO */}
          <div className="flex items-center justify-between bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2.5">
            <div>
              <p className="text-xs font-bold text-white">
                Cargo ativo
              </p>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                Cargos inativos não aparecem para atribuição
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              disabled={salvando}
              className={`relative w-10 h-5.5 rounded-full transition-all shrink-0 disabled:opacity-50 ${
                ativo ? 'bg-[#3B8ED0]' : 'bg-zinc-800'
              }`}
              style={{ width: '2.5rem', height: '1.375rem' }}
              title={ativo ? 'Desativar' : 'Ativar'}
            >
              <div
                className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all ${
                  ativo ? 'left-[1.25rem]' : 'left-0.5'
                }`}
                style={{ width: '1.125rem', height: '1.125rem' }}
              />
            </button>
          </div>

          {/* AVISO - EDITAR */}
          {editando && (
            <div className="bg-[#3B8ED0]/5 border border-[#3B8ED0]/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={12} className="text-[#3B8ED0] mt-0.5 shrink-0" />
              <p className="text-[10px] text-[#3B8ED0]/80 font-medium leading-relaxed">
                As permissões do cargo <strong>não são alteradas</strong> aqui.
                Use o botão <strong>Gerenciar Permissões</strong> no card do cargo.
              </p>
            </div>
          )}
        </div>

        {/* ==================== RODAPÉ ==================== */}
        <div className="px-5 py-4 border-t border-zinc-800 bg-[#121215] flex gap-2">
          <button
            type="button"
            onClick={aoFechar}
            disabled={salvando}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 bg-[#3B8ED0] hover:bg-[#2d74ab] text-white px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {salvando ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={13} />
                {editando ? 'Salvar' : 'Criar'}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}