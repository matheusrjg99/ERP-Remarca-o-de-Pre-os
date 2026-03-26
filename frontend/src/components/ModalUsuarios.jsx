import React, { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ModalUsuarios({ isOpen, onClose }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ login: '', senha: '', nome: '', nivel_acesso: 'COMUM' });

  const carregarUsuarios = async () => {
    try {
      const res = await api.get('/api/usuarios');
      setUsuarios(res.data);
    } catch (err) { console.error("Erro ao carregar"); }
  };

  useEffect(() => { if (isOpen) carregarUsuarios(); }, [isOpen]);

  const handleSalvar = async () => {
    if (!form.login || !form.senha) return alert("Preencha Login e Senha!");
    setLoading(true);
    try {
      await api.post('/api/usuarios', form);
      alert("Usuário criado com sucesso!");
      setForm({ login: '', senha: '', nome: '', nivel_acesso: 'COMUM' });
      carregarUsuarios();
    } catch (err) {
      alert("Erro ao cadastrar. Verifique se o login já existe.");
    } finally { setLoading(false); }
  };

  const alternarStatus = async (login, statusAtual) => {
    try {
      // Endpoint para inativar (ativo = 0 ou 1)
      await api.put(`/api/usuarios/${login}/status?ativo=${statusAtual ? 0 : 1}`);
      carregarUsuarios();
    } catch (err) { alert("Erro ao alterar status."); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-700 w-full max-w-5xl rounded shadow-2xl flex flex-col max-h-[85vh]">
        
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]">
          <h2 className="text-zinc-200 font-bold flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div> Gestão de Usuários
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-8 overflow-hidden">
          {/* FORMULÁRIO DE CADASTRO */}
          <div className="w-full md:w-80 space-y-4">
            <h3 className="text-blue-400 text-xs uppercase font-bold tracking-widest">Novo Acesso</h3>
            <input className="w-full bg-[#09090b] border border-zinc-800 p-2.5 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" placeholder="Nome Completo" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <input className="w-full bg-[#09090b] border border-zinc-800 p-2.5 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" placeholder="Login" value={form.login} onChange={e => setForm({...form, login: e.target.value})} />
            <input className="w-full bg-[#09090b] border border-zinc-800 p-2.5 rounded text-sm text-zinc-200 outline-none focus:border-blue-500" type="password" placeholder="Senha" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} />
            <select className="w-full bg-[#09090b] border border-zinc-800 p-2.5 rounded text-sm text-zinc-200 outline-none" value={form.nivel_acesso} onChange={e => setForm({...form, nivel_acesso: e.target.value})}>
              <option value="COMUM">Nível: COMUM</option>
              <option value="ADMIN">Nível: ADMIN</option>
            </select>
            <button onClick={handleSalvar} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-bold text-white transition-all">
              {loading ? 'Processando...' : 'Cadastrar Usuário'}
            </button>
          </div>

          {/* TABELA DE USUÁRIOS EXISTENTES */}
          <div className="flex-1 flex flex-col border border-zinc-800 bg-[#09090b] rounded overflow-hidden">
            <div className="overflow-y-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-900 text-zinc-500 text-[10px] uppercase font-bold sticky top-0">
                  <tr>
                    <th className="p-4">Nome / Login</th>
                    <th className="p-4">Nível</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {usuarios.map((u, i) => (
                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="text-zinc-200 font-medium">{u.nome}</div>
                        <div className="text-zinc-500 font-mono text-[10px]">{u.login}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${u.nivel_acesso === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {u.nivel_acesso}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => alternarStatus(u.login, u.ativo)}
                          className={`text-[10px] font-bold px-3 py-1 rounded transition-all ${u.ativo ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-rose-500 hover:bg-rose-500/10'}`}
                        >
                          {u.ativo ? '● ATIVO' : '○ INATIVO'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}