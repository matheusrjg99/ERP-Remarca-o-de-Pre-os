-- ============================================================
-- SCRIPT DE ATUALIZAÇÃO DAS PERMISSÕES DE PRECIFICAÇÃO
-- Executar este script para corrigir as permissões do módulo
-- ============================================================

PRINT '🔄 Atualizando permissões de Precificação...';

-- 1. Adicionar permissões faltantes (usando MERGE para evitar duplicatas)
MERGE dbo.permissoes AS target
USING (VALUES
  ('precificacao:visualizar', 'Acessar módulo de precificação', 'precificacao', 1),
  ('precificacao:ver_custo', 'Visualizar coluna de custo', 'precificacao', 1),
  ('precificacao:ver_margens', 'Visualizar colunas de margens e lucros', 'precificacao', 1),
  ('precificacao:ver_lucro', 'Visualizar coluna de lucro', 'precificacao', 1),
  ('precificacao:editar', 'Editar preços e valores na planilha', 'precificacao', 1),
  ('precificacao:recalcular', 'Recalcular precificação em lote', 'precificacao', 1),
  ('precificacao:exportar', 'Exportar dados de precificação', 'precificacao', 1),
  ('precificacao:importar', 'Importar dados de precificação', 'precificacao', 1),
  ('precificacao:selecionar_nota', 'Selecionar nota fiscal para busca', 'precificacao', 1),
  ('precificacao:personalizar_visual', 'Personalizar visualização da planilha', 'precificacao', 1),
  ('precificacao:editar_regras', 'Editar regras de precificação', 'precificacao', 1),
  ('precificacao:editar_custo', 'Editar coluna de custo', 'precificacao', 1),
  ('precificacao:editar_sugerido', 'Editar coluna de preço sugerido', 'precificacao', 1),
  ('precificacao:editar_preco', 'Editar coluna de preço atual', 'precificacao', 1),
  ('precificacao:editar_margem', 'Editar coluna de margem', 'precificacao', 1),
  ('precificacao:editar_desconto', 'Editar coluna de desconto', 'precificacao', 1)
) AS source (codigo, descricao, modulo, ativo)
ON target.codigo = source.codigo
WHEN NOT MATCHED THEN
  INSERT (codigo, descricao, modulo, ativo)
  VALUES (source.codigo, source.descricao, source.modulo, source.ativo);

PRINT '✅ Permissões de precificação criadas/atualizadas!';

-- 2. Atualizar cargo Gerente de Qualidade (ID=2)
-- Adiciona permissão de exportação e ver_custo
DECLARE @id_gerente_q INT = (SELECT id FROM dbo.cargos WHERE nome = 'Gerente de Qualidade');

-- Remove permissões antigas com nome errado
DELETE cp FROM dbo.cargo_permissoes cp
INNER JOIN dbo.permissoes p ON cp.permissao_id = p.id
WHERE cp.cargo_id = @id_gerente_q 
AND p.codigo IN ('precificacao:ver_custos', 'precificacao:ver_margens');

-- Adiciona permissões corretas
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_gerente_q, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'precificacao:visualizar', 'precificacao:ver_custo', 'precificacao:ver_margens', 'precificacao:exportar'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @id_gerente_q AND cp.permissao_id = p.id
);

PRINT '✅ Cargo Gerente de Qualidade atualizado!';

-- 3. Atualizar cargo Analista Comercial (ID=4)
DECLARE @id_analista_com INT = (SELECT id FROM dbo.cargos WHERE nome = 'Analista Comercial');

-- Remove permissões antigas
DELETE cp FROM dbo.cargo_permissoes cp
INNER JOIN dbo.permissoes p ON cp.permissao_id = p.id
WHERE cp.cargo_id = @id_analista_com 
AND p.codigo IN ('precificacao:ver_custos', 'precificacao:ver_margens');

-- Adiciona permissões corretas
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_analista_com, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'precificacao:visualizar', 'precificacao:editar', 'precificacao:recalcular', 'precificacao:exportar',
    'precificacao:ver_custo', 'precificacao:ver_margens', 'precificacao:editar_custo', 'precificacao:editar_preco'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @id_analista_com AND cp.permissao_id = p.id
);

PRINT '✅ Cargo Analista Comercial atualizado!';

-- 4. Atualizar cargo Visualizador (ID=5)
DECLARE @id_visualizador INT = (SELECT id FROM dbo.cargos WHERE nome = 'Visualizador');

-- Remove permissões antigas
DELETE cp FROM dbo.cargo_permissoes cp
INNER JOIN dbo.permissoes p ON cp.permissao_id = p.id
WHERE cp.cargo_id = @id_visualizador 
AND p.codigo IN ('precificacao:ver_custos', 'precificacao:ver_margens');

-- Adiciona permissões corretas
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_visualizador, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'precificacao:visualizar', 'precificacao:ver_custo', 'precificacao:ver_margens'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @id_visualizador AND cp.permissao_id = p.id
);

PRINT '✅ Cargo Visualizador atualizado!';

PRINT '';
PRINT '=====================================================';
PRINT '✅ Script concluído com sucesso!';
PRINT '=====================================================';
PRINT '';
PRINT '⚠️ IMPORTANTE: Após executar este script:';
PRINT '  1. Reinicie o backend Python';
PRINT '  2. Faça logout de todos os usuários';
PRINT '  3. Peça para fazerem login novamente';
PRINT '  4. Verifique as permissões no console do navegador';
PRINT '';
