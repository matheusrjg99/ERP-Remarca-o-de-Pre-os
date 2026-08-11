import { usePermissions } from './usePermissions';

/**
 * Hook especializado para permissões do Precificacao
 * @returns {Object} Funções e estados de permissão do dashboard
 */
export const usePrecificacaoPermissions = () => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isLoading,
    isAdmin,
    permissions 
  } = usePermissions();

  // Permissões específicas do dashboard
  const podeEditarCelulas = hasPermission('precificacao:editar_valores') || isAdmin;
  const podeRecalcular = hasPermission('precificacao:recalcular') || isAdmin;
  const podePersonalizarVisual = hasPermission('precificacao:personalizar_visual') || isAdmin;
  const podeEditarRegras = hasPermission('precificacao:editar_regras') || isAdmin;
  const podeExportar = hasPermission('precificacao:exportar') || isAdmin;
  const podeImportar = hasPermission('precificacao:importar') || isAdmin;
  const podeSelecionarNota = hasPermission('precificacao:selecionar_nota') || isAdmin;
  const podeVerCustos = hasPermission('precificacao:ver_custos') || isAdmin;
  const podeVerMargens = hasPermission('precificacao:ver_margens') || isAdmin;

  // Verifica se pode editar uma célula específica
  const podeEditarColuna = (colunaKey) => {
    if (isAdmin) return true;
    
    // Mapeamento de colunas para permissões específicas
    const permissoesColuna = {
      'custo': 'precificacao:editar_custos',
      'sugerido': 'precificacao:editar_sugeridos',
      'atual': 'precificacao:editar_atuais',
      'margem': 'precificacao:editar_margens',
      'desconto': 'precificacao:editar_descontos',
    };

    const permissaoNecessaria = permissoesColuna[colunaKey];
    if (!permissaoNecessaria) return podeEditarCelulas;
    
    return hasPermission(permissaoNecessaria);
  };

  // Verifica se pode ver uma coluna específica
  const podeVerColuna = (colunaKey) => {
    if (isAdmin) return true;
    
    const colunasRestritas = {
      'custo': 'precificacao:ver_custos',
      'margem_valor': 'precificacao:ver_margens',
      'lucro': 'precificacao:ver_lucros',
    };

    const permissaoNecessaria = colunasRestritas[colunaKey];
    if (!permissaoNecessaria) return true; // Colunas sem restrição
    
    return hasPermission(permissaoNecessaria);
  };

  // Ações em massa
  const podeRecalculoEmMassa = hasAnyPermission(['precificacao:recalcular', 'precificacao:recalcular_em_massa']) || isAdmin;
  const podeImportacaoEmMassa = hasPermission('precificacao:importar_em_massa') || isAdmin;

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

export default usePrecificacaoPermissions;
