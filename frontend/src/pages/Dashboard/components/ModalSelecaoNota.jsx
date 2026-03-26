import React from 'react';

export default function ModalSelecaoNota({ isOpen, onClose, notas, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 w-full max-w-3xl rounded shadow-2xl flex flex-col">
        <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]">
          <h2 className="text-zinc-200 font-medium">Foram encontradas {notas.length} notas. Qual você deseja?</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-rose-500 transition-colors">✕</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <table className="w-full text-sm text-left text-zinc-300">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
              <tr>
                <th className="p-3 w-20">NumOrd</th>
                <th className="p-3 w-24">Nota</th>
                <th className="p-3 w-28">Chegada</th>
                <th className="p-3">Fornecedor</th>
                <th className="p-3 w-24 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {notas.map((n, i) => (
                <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-3">{n.numord}</td>
                  <td className="p-3 font-mono text-zinc-400">{n.numnota}</td>
                  <td className="p-3">{n.data_chegada}</td>
                  <td className="p-3 truncate max-w-[200px]" title={n.fornecedor}>{n.fornecedor}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => onSelect(n.numord)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                      Selecionar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}