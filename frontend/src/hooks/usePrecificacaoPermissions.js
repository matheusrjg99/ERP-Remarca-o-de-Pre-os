import { usePermissions } from './usePermissions';

/**
 * Hook específico para permissões do módulo de Precificação
 * Implementa fallback para permissões legadas e hierarquia
 */
export const usePrecificacaoPermissions = () => {
  const { hasPermission, permissions, isLoading } = usePermissions();

  // Fallback: Se não tiver a permissão específica, verifica a base
  const canConsultar = () => hasPermission('precificacao:consultar');
  
  // Hierarquia implícita: editar concede consultar
  const canEditar = () => hasPermission('precificacao:editar') || hasPermission('precificacao:consultar');
  
  // Permissões específicas ou fallback para editar
  const canRecalcular = () => hasPermission('precificacao:recalcular') || hasPermission('precificacao:editar');
  const canPersonalizarVisual = () => hasPermission('precificacao:personalizar_visual') || hasPermission('precificacao:consultar');
  const canEditarRegras = () => hasPermission('precificacao:editar_regras') || hasPermission('precificacao:editar');
  const canExportar = () => hasPermission('precificacao:exportar') || hasPermission('precificacao:consultar');
  const canImportar = () => hasPermission('precificacao:importar') || hasPermission('precificacao:editar');
  const canVerMargens = () => hasPermission('precificacao:ver_margens') || hasPermission('precificacao:consultar');
  
  // Exclusão requer permissão explícita ou editar (hierarquia)
  const canExcluir = () => hasPermission('precificacao:excluir') || hasPermission('precificacao:editar');

  return {
    isLoading,
    permissions,
    canConsultar,
    canEditar,
    canRecalcular,
    canPersonalizarVisual,
    canEditarRegras,
    canExportar,
    canImportar,
    canVerMargens,
    canExcluir,
    // Alias para compatibilidade
    podeConsultar: canConsultar,
    podeEditar: canEditar,
    podeRecalcular: canRecalcular,
    podeExcluir: canExcluir,
  };
};

export default usePrecificacaoPermissions;
