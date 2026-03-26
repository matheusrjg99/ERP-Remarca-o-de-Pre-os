import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ModalRemarcar({ produto, ambiente, onClose, onSuccess }) {
  const [novoPreco, setNovoPreco] = useState('');
  const [loading, setLoading] = useState(false);

  // Quando a modal abre, foca no campo de preço
  useEffect(() => {
    setNovoPreco(produto?.PRECOVENDA || produto?.PRECO || '');
  }, [produto]);

  const salvar = async () => {
    if (!novoPreco) return alert("Digite um preço válido!");
    
    setLoading(true);
    try {
      await api.put(`/api/remarcar`, null, {
        params: {
          codigo: produto.CODIGO || produto.CODPROD,
          novo_preco: novoPreco,
          ambiente: ambiente
        }
      });
      onSuccess(); // Avisa o Dashboard para atualizar a lista
      onClose();   // Fecha a modal
    } catch (err) {
      alert("Erro ao salvar: " + (err.response?.data?.detail || "Erro interno"));
    } finally {
      setLoading(false);
    }
  };

  if (!produto) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-blue-400 mb-2">Remarcar Produto</h2>
        <p className="text-gray-400 text-sm mb-6">{produto.DESCRICAOLONGA || produto.DESCRPROD}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-1">Novo Preço de Venda</label>
            <input 
              autoFocus
              type="number"
              step="0.01"
              className="w-full bg-[#2e2e2e] border border-[#444] p-3 rounded text-white text-2xl font-bold focus:border-green-500 outline-none"
              value={novoPreco}
              onChange={(e) => setNovoPreco(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && salvar()}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-transparent hover:bg-[#333] border border-[#444] rounded font-semibold transition-all"
            >
              Cancelar
            </button>
            <button 
              onClick={salvar}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded font-bold transition-all text-white"
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}