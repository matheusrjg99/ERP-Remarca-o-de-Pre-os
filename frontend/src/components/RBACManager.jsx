import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Shield, Users, Plus, Trash2, Edit2, Check, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RBACManager = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('cargos');
  const [cargos, setCargos] = useState([]);
  const [permissoes, setPermissoes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado para edição de cargo
  const [cargoSelecionado, setCargoSelecionado] = useState(null);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState([]);
  
  // Estado para edição de usuário
  const [usuarioEdicao, setUsuarioEdicao] = useState(null);
  const [cargoUsuarioSelecionado, setCargoUsuarioSelecionado] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resCargos, resPermissoes, resUsuarios] = await Promise.all([
        axios.get(`${API_URL}/rbac/cargos`, config),
        axios.get(`${API_URL}/rbac/permissoes`, config),
        axios.get(`${API_URL}/auth/usuarios`, config)
      ]);

      setCargos(resCargos.data);
      setPermissoes(resPermissoes.data);
      setUsuarios(resUsuarios.data);
    } catch (err) {
      setError('Erro ao carregar dados. Verifique suas permissões.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarCargo = async () => {
    if (!cargoSelecionado) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Extrair apenas os IDs das permissões
      const permissoesIds = permissoesSelecionadas.map(p => typeof p === 'object' ? p.id : p);
      
      await axios.put(
        `${API_URL}/rbac/cargos/${cargoSelecionado.id}`, 
        { 
          nome: cargoSelecionado.nome, 
          descricao: cargoSelecionado.descricao,
          permissoes_ids: permissoesIds
        }, 
        config
      );
      alert('Cargo atualizado com sucesso!');
      carregarDados();
      setCargoSelecionado(null);
    } catch (err) {
      alert('Erro ao salvar cargo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarUsuario = async () => {
    if (!usuarioEdicao) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(
        `${API_URL}/rbac/cargos/usuarios/${usuarioEdicao.id}`, 
        { cargo_id: cargoUsuarioSelecionado === '' ? null : parseInt(cargoUsuarioSelecionado) }, 
        config
      );
      alert('Usuário atualizado com sucesso!');
      carregarDados();
      setUsuarioEdicao(null);
    } catch (err) {
      alert('Erro ao salvar usuário.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermissao = (permId) => {
    if (permissoesSelecionadas.includes(permId)) {
      setPermissoesSelecionadas(prev => prev.filter(id => id !== permId));
    } else {
      setPermissoesSelecionadas(prev => [...prev, permId]);
    }
  };

  const editarCargo = (cargo) => {
    setCargoSelecionado({ ...cargo });
    // Carregar permissões atuais do cargo
    const permsAtuais = cargo.permissoes ? cargo.permissoes.map(p => p.id || p.permissao_id) : [];
    setPermissoesSelecionadas(permsAtuais);
  };

  const editarUsuario = (usuario) => {
    setUsuarioEdicao(usuario);
    setCargoUsuarioSelecionado(usuario.cargo_id || '');
  };

  if (loading && cargos.length === 0) return <div className="p-4 text-center">Carregando...</div>;
  if (error) return <div className="p-4 text-red-500 flex items-center gap-2"><AlertCircle size={18}/> {error}</div>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-blue-600" /> Gestão de Acessos (RBAC)
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-6 gap-4">
          <button 
            onClick={() => setActiveTab('cargos')}
            className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'cargos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Shield size={18}/> Cargos e Permissões
          </button>
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`py-3 px-4 font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'usuarios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Users size={18}/> Usuários
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB CARGOS */}
          {activeTab === 'cargos' && (
            <>
              {!cargoSelecionado ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cargos.map(cargo => (
                    <div key={cargo.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                      <h3 className="font-bold text-lg">{cargo.nome}</h3>
                      <p className="text-sm text-gray-500 mb-3">{cargo.descricao}</p>
                      <div className="text-xs text-gray-400 mb-4">
                        {cargo.permissoes?.length || 0} permissões atribuídas
                      </div>
                      <button 
                        onClick={() => editarCargo(cargo)}
                        className="w-full py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <Edit2 size={14}/> Editar Permissões
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold">Editando: {cargoSelecionado.nome}</h3>
                      <p className="text-sm text-gray-500">{cargoSelecionado.descricao}</p>
                    </div>
                    <button onClick={() => setCargoSelecionado(null)} className="text-sm text-gray-500 hover:underline">Voltar</button>
                  </div>

                  <div className="border rounded-lg divide-y">
                    {['admin', 'nc', 'precificacao', 'cadastros'].map(modulo => {
                      const permsModulo = permissoes.filter(p => p.modulo === modulo);
                      if (permsModulo.length === 0) return null;
                      return (
                        <div key={modulo} className="p-4">
                          <h4 className="font-semibold capitalize mb-3 text-blue-700">{modulo}</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {permsModulo.map(perm => (
                              <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                <input 
                                  type="checkbox" 
                                  checked={permissoesSelecionadas.includes(perm.id)}
                                  onChange={() => togglePermissao(perm.id)}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{perm.descricao}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <button 
                      onClick={handleSalvarCargo}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={18}/> Salvar Alterações
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB USUÁRIOS */}
          {activeTab === 'usuarios' && (
            <>
              {!usuarioEdicao ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-sm text-gray-500">
                        <th className="py-3 px-2">Usuário</th>
                        <th className="py-3 px-2">Nome</th>
                        <th className="py-3 px-2">Cargo Atual</th>
                        <th className="py-3 px-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map(user => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{user.username}</td>
                          <td className="py-3 px-2">{user.nome}</td>
                          <td className="py-3 px-2">
                            {user.cargo_nome ? (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                {user.cargo_nome}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">Sem cargo</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button 
                              onClick={() => editarUsuario(user)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Alterar Cargo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-4 py-8">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-bold">Alterar Cargo</h3>
                    <p className="text-gray-500 text-sm">{usuarioEdicao.nome} ({usuarioEdicao.username})</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Cargo</label>
                    <select 
                      value={cargoUsuarioSelecionado}
                      onChange={(e) => setCargoUsuarioSelecionado(e.target.value)}
                      className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Nenhum (Acesso Restrito)</option>
                      {cargos.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={() => setUsuarioEdicao(null)}
                      className="flex-1 py-2 border rounded hover:bg-gray-50 text-gray-700"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSalvarUsuario}
                      disabled={loading}
                      className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default RBACManager;
