import { usePermissions } from './usePermissions';

/**
 * Hook especializado para permissões do Dashboard
 * @returns {Object} Funções e estados de permissão do dashboard
 */
export const useDashboardPermissions = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isLoading,
    isAdmin,
    permissions 
  } = usePermissions();

  // Permissões específicas do dashboard
  const podeEditarCelulas = hasPermission('dashboard:editar_valores') || isAdmin;
  const podeRecalcular = hasPermission('dashboard:recalcular') || isAdmin;
  const podePersonalizarVisual = hasPermission('dashboard:personalizar_visual') || isAdmin;
  const podeEditarRegras = hasPermission('dashboard:editar_regras') || isAdmin;
  const podeExportar = hasPermission('dashboard:exportar') || isAdmin;
  const podeImportar = hasPermission('dashboard:importar') || isAdmin;
  const podeSelecionarNota = hasPermission('dashboard:selecionar_nota') || isAdmin;
  const podeVerCustos = hasPermission('dashboard:ver_custos') || isAdmin;
  const podeVerMargens = hasPermission('dashboard:ver_margens') || isAdmin;

  // Verifica se pode editar uma célula específica
  const podeEditarColuna = (colunaKey) => {
    if (isAdmin) return true;
    
    // Mapeamento de colunas para permissões específicas
    const permissoesColuna = {
      'custo': 'dashboard:editar_custos',
      'sugerido': 'dashboard:editar_sugeridos',
      'atual': 'dashboard:editar_atuais',
      'margem': 'dashboard:editar_margens',
      'desconto': 'dashboard:editar_descontos',
    };

    const permissaoNecessaria = permissoesColuna[colunaKey];
    if (!permissaoNecessaria) return podeEditarCelulas;
    
    return hasPermission(permissaoNecessaria);
  };

  // Verifica se pode ver uma coluna específica
  const podeVerColuna = (colunaKey) => {
    if (isAdmin) return true;
    
    const colunasRestritas = {
      'custo': 'dashboard:ver_custos',
      'margem_valor': 'dashboard:ver_margens',
      'lucro': 'dashboard:ver_lucros',
    };

    const permissaoNecessaria = colunasRestritas[colunaKey];
    if (!permissaoNecessaria) return true; // Colunas sem restrição
    
    return hasPermission(permissaoNecessaria);
  };

  // Ações em massa
  const podeRecalculoEmMassa = hasAnyPermission(['dashboard:recalcular', 'dashboard:recalcular_em_massa']) || isAdmin;
  const podeImportacaoEmMassa = hasPermission('dashboard:importar_em_massa') || isAdmin;

  return {
    // Estados gerais
    isLoading,
    isAdmin,
    permissions,
    
    // Flags de permissão
    podeEditarCelulas,
    podeRecalcular,
    podePersonalizarVisual,
    podeEditarRegras,
    podeExportar,
    podeImportar,
    podeSelecionarNota,
    podeVerCustos,
    podeVerMargens,
    
    // Funções específicas
    podeEditarColuna,
    podeVerColuna,
    podeRecalculoEmMassa,
    podeImportacaoEmMassa,
    
    // Funções originais do usePermissions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default useDashboardPermissions;
