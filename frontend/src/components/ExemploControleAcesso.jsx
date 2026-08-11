import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * Componente de exemplo demonstrando controle de acesso granular
 * Pode ser usado em qualquer parte do sistema para proteger botões, menus, etc.
 */
export const ExemploControleAcesso = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasModuleAccess,
    isAdmin,
    isLoading 
  } = usePermissions();

  if (isLoading) {
    return <div className="p-4 text-gray-500">Carregando permissões...</div>;
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">
        🔐 Controle de Acesso por Permissão
      </h2>

      {/* Exemplo 1: Botão simples com permissão única */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">1. Botão com Permissão Única</h3>
        {hasPermission('nc:criar') ? (
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            ➕ Criar Nota Crédito
          </button>
        ) : (
          <button 
            disabled 
            className="px-4 py-2 bg-gray-700 text-gray-500 rounded cursor-not-allowed flex items-center gap-2"
            title="Você não tem permissão para criar notas crédito"
          >
            <Lock size={16} />
            Criar Nota Crédito
          </button>
        )}
        <p className="text-sm text-gray-400">
          Requer permissão: <code className="bg-gray-800 px-2 py-1 rounded">nc:criar</code>
        </p>
      </div>

      {/* Exemplo 2: Botão com múltiplas permissões (qualquer uma) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">2. Botão com Múltiplas Permissões (OU)</h3>
        {hasAnyPermission(['dashboard:exportar', 'dashboard:importar']) ? (
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            📊 Exportar/Importar Dados
          </button>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle size={18} />
            <span>Sem permissão para exportação ou importação</span>
          </div>
        )}
        <p className="text-sm text-gray-400">
          Requer: <code className="bg-gray-800 px-2 py-1 rounded">dashboard:exportar</code> OU{' '}
          <code className="bg-gray-800 px-2 py-1 rounded">dashboard:importar</code>
        </p>
      </div>

      {/* Exemplo 3: Acesso a módulo inteiro */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">3. Acesso ao Módulo</h3>
        {hasModuleAccess('cadastros') ? (
          <div className="p-4 bg-blue-900/20 border border-blue-800 rounded">
            <h4 className="font-semibold text-blue-400">✅ Módulo de Cadastros</h4>
            <p className="text-sm text-gray-300 mt-1">
              Você tem acesso às funcionalidades de cadastros.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-red-900/20 border border-red-800 rounded">
            <h4 className="font-semibold text-red-400">🚫 Módulo de Cadastros Bloqueado</h4>
            <p className="text-sm text-gray-300 mt-1">
              Você não tem permissão para acessar este módulo.
            </p>
          </div>
        )}
      </div>

      {/* Exemplo 4: Menu condicional */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">4. Menu Condicional</h3>
        <nav className="flex gap-2 flex-wrap">
          {hasPermission('nc:listar') && (
            <a href="/nc" className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
              Notas Crédito
            </a>
          )}
          
          {hasModuleAccess('dashboard') && (
            <a href="/dashboard" className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded hover:bg-gray-700">
              Dashboard
            </a>
          )}
          
          {hasPermission('rbac:listar_cargos') && (
            <a href="/rbac" className="px-3 py-1.5 bg-purple-900/50 text-purple-300 rounded hover:bg-purple-800/50">
              🛡️ RBAC
            </a>
          )}
          
          {isAdmin && (
            <a href="/admin" className="px-3 py-1.5 bg-red-900/50 text-red-300 rounded hover:bg-red-800/50">
              ⚡ Admin
            </a>
          )}
        </nav>
        <p className="text-sm text-gray-400">
          Menu exibido baseado nas permissões do usuário
        </p>
      </div>

      {/* Exemplo 5: Tabela com colunas condicionais */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">5. Tabela com Colunas Condicionais</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-gray-800 rounded">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3 text-gray-300">Produto</th>
                <th className="p-3 text-gray-300">Preço</th>
                {hasPermission('dashboard:ver_custos') && (
                  <th className="p-3 text-gray-300">Custo</th>
                )}
                {hasPermission('dashboard:ver_margens') && (
                  <th className="p-3 text-gray-300">Margem</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-700">
                <td className="p-3 text-gray-200">Produto A</td>
                <td className="p-3 text-gray-200">R$ 100,00</td>
                {hasPermission('dashboard:ver_custos') && (
                  <td className="p-3 text-gray-400">R$ 60,00</td>
                )}
                {hasPermission('dashboard:ver_margens') && (
                  <td className="p-3 text-green-400">40%</td>
                )}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-400">
          Colunas de Custo e Margem só aparecem se o usuário tiver permissão
        </p>
      </div>

      {/* Exemplo 6: Status das permissões atuais */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-300">6. Suas Permissões Atuais</h3>
        <div className="p-4 bg-gray-800 rounded">
          <p className="text-sm text-gray-400 mb-2">
            {isAdmin ? (
              <span className="text-red-400 font-semibold">⚡ Administrador (acesso total)</span>
            ) : (
              `Nível de acesso: ${localStorage.getItem('nivel_acesso') || 'N/A'}`
            )}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {JSON.parse(localStorage.getItem('permissoes') || '[]').map((perm, index) => (
              <span 
                key={index} 
                className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded"
              >
                {perm}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Exemplo 7: Mensagem de acesso negado personalizada */}
      {!hasPermission('dashboard:recalcular') && (
        <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded flex items-start gap-3">
          <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-semibold text-yellow-400">Acesso Restrito</h4>
            <p className="text-sm text-gray-300 mt-1">
              Você não possui permissão para recalcular dados. 
              Solicite ao administrador do sistema que conceda a permissão{' '}
              <code className="bg-yellow-900/50 px-1 rounded">dashboard:recalcular</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExemploControleAcesso;
