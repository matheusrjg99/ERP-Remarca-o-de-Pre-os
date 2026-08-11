-- ============================================================
-- SCRIPT DE POPULAÇÃO RBAC - Sistema de Permissões
-- ============================================================
-- Execute este script no banco de dados para criar permissões,
-- cargos e associar usuários para testes do sistema RBAC.
-- ============================================================

-- ============================================================
-- 1. LIMPEZA (Opcional - cuidado em produção!)
-- ============================================================
-- DELETE FROM dbo.cargo_permissoes;
-- DELETE FROM dbo.API_USUARIOS WHERE cargo_id IS NOT NULL;
-- DELETE FROM dbo.cargos;
-- DELETE FROM dbo.permissoes;

-- ============================================================
-- 2. CRIAÇÃO DE PERMISSÕES POR MÓDULO
-- ============================================================

-- Módulo ADMIN (geração do sistema)
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('admin_total', 'Acesso total ao sistema - Admin', 'admin', 1);

-- Módulo NC (Não Conformidades)
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('nc:listar', 'Listar não conformidades', 'nc', 1),
('nc:criar', 'Criar nova não conformidade', 'nc', 1),
('nc:editar', 'Editar não conformidade existente', 'nc', 1),
('nc:excluir', 'Excluir não conformidade', 'nc', 1),
('nc:visualizar_relatorio', 'Visualizar relatório de NCs', 'nc', 1),
('nc:exportar', 'Exportar relatório de NCs', 'nc', 1);

-- Módulo Cadastros
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('cadastros:colaboradores:visualizar', 'Visualizar lista de colaboradores', 'cadastros', 1),
('cadastros:colaboradores:criar', 'Cadastrar novo colaborador', 'cadastros', 1),
('cadastros:colaboradores:editar', 'Editar dados de colaborador', 'cadastros', 1),
('cadastros:colaboradores:excluir', 'Excluir colaborador', 'cadastros', 1),
('cadastros:usuarios:visualizar', 'Visualizar usuários do sistema', 'cadastros', 1),
('cadastros:usuarios:gerenciar', 'Gerenciar usuários e cargos', 'cadastros', 1);

-- Módulo Comissões
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('comissoes:configurar', 'Configurar parâmetros de comissões', 'comissoes', 1),
('comissoes:ver', 'Visualizar comissões calculadas', 'comissoes', 1),
('comissoes:ver_resumo_total', 'Visualizar resumo total de comissões', 'comissoes', 1),
('comissoes:exportar', 'Exportar relatório de comissões', 'comissoes', 1);

-- Módulo Precificação
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('precificacao:visualizar', 'Visualizar precificação de produtos', 'precificacao', 1),
('precificacao:editar', 'Editar preços de produtos', 'precificacao', 1),
('precificacao:recalcular', 'Recalcular precificação em lote', 'precificacao', 1),
('precificacao:historico', 'Visualizar histórico de alterações de preço', 'precificacao', 1);

-- Módulo Precificação (antigo Dashboard)
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('precificacao:visualizar', 'Acessar módulo de precificação', 'precificacao', 1),
('precificacao:ver_custos', 'Visualizar coluna de custos', 'precificacao', 1),
('precificacao:ver_margens', 'Visualizar colunas de margens e lucros', 'precificacao', 1),
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
('precificacao:editar_desconto', 'Editar coluna de desconto', 'precificacao', 1),
('precificacao:ver_custo', 'Visualizar coluna de custo', 'precificacao', 1),
('precificacao:ver_margem', 'Visualizar coluna de margem', 'precificacao', 1),
('precificacao:ver_lucro', 'Visualizar coluna de lucro', 'precificacao', 1);

-- Módulo RBAC (gestão de acessos)
INSERT INTO dbo.permissoes (codigo, descricao, modulo, ativo) VALUES
('rbac:listar_cargos', 'Listar cargos do sistema', 'rbac', 1),
('rbac:criar_cargo', 'Criar novo cargo', 'rbac', 1),
('rbac:editar_cargo', 'Editar cargo existente', 'rbac', 1),
('rbac:excluir_cargo', 'Excluir cargo', 'rbac', 1),
('rbac:listar_permissoes', 'Listar permissões do sistema', 'rbac', 1),
('rbac:gerenciar_usuarios_cargo', 'Atribuir cargos a usuários', 'rbac', 1);

PRINT '✅ Permissões criadas com sucesso!';

-- ============================================================
-- 3. CRIAÇÃO DE CARGOS
-- ============================================================

-- Cargo: Administrador (já existe via nivel_acesso, mas pode ter cargo também)
INSERT INTO dbo.cargos (nome, descricao, ativo) VALUES
('Administrador', 'Acesso completo ao sistema', 1);

-- Cargo: Gerente de Qualidade
INSERT INTO dbo.cargos (nome, descricao, ativo) VALUES
('Gerente de Qualidade', 'Gestão completa de não conformidades e relatórios', 1);

-- Cargo: Operador de NC
INSERT INTO dbo.cargos (nome, descricao, ativo) VALUES
('Operador de NC', 'Pode criar e visualizar não conformidades', 1);

-- Cargo: Analista Comercial
INSERT INTO dbo.cargos (nome, descricao, ativo) VALUES
('Analista Comercial', 'Acesso a comissões e precificação', 1);

-- Cargo: Visualizador
INSERT INTO dbo.cargos (nome, descricao, ativo) VALUES
('Visualizador', 'Apenas visualização geral sem edições', 1);

PRINT '✅ Cargos criados com sucesso!';

-- ============================================================
-- 4. ASSOCIAÇÃO DE PERMISSÕES AOS CARGOS
-- ============================================================

-- Obter IDs dos cargos (ajuste conforme IDs reais no seu banco)
DECLARE @id_admin INT = (SELECT id FROM dbo.cargos WHERE nome = 'Administrador');
DECLARE @id_gerente_q INT = (SELECT id FROM dbo.cargos WHERE nome = 'Gerente de Qualidade');
DECLARE @id_operador_nc INT = (SELECT id FROM dbo.cargos WHERE nome = 'Operador de NC');
DECLARE @id_analista_com INT = (SELECT id FROM dbo.cargos WHERE nome = 'Analista Comercial');
DECLARE @id_visualizador INT = (SELECT id FROM dbo.cargos WHERE nome = 'Visualizador');

-- Administrador: Todas as permissões de gestão
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_admin, p.id FROM dbo.permissoes p 
WHERE p.codigo IN ('rbac:listar_cargos', 'rbac:criar_cargo', 'rbac:editar_cargo', 'rbac:gerenciar_usuarios_cargo');

-- Gerente de Qualidade: NC completo + relatórios + Precificação (visualização)
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_gerente_q, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'nc:listar', 'nc:criar', 'nc:editar', 'nc:excluir', 'nc:visualizar_relatorio', 'nc:exportar',
    'cadastros:colaboradores:visualizar',
    'precificacao:visualizar', 'precificacao:ver_custos', 'precificacao:ver_margens', 'precificacao:exportar'
);

-- Operador de NC: Apenas operações básicas de NC
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_operador_nc, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'nc:listar', 'nc:criar', 'nc:visualizar_relatorio',
    'cadastros:colaboradores:visualizar'
);

-- Analista Comercial: Comissões e Precificação completo
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_analista_com, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'comissoes:configurar', 'comissoes:ver', 'comissoes:ver_resumo_total', 'comissoes:exportar',
    'precificacao:visualizar', 'precificacao:editar', 'precificacao:recalcular', 'precificacao:exportar',
    'precificacao:ver_custos', 'precificacao:ver_margens', 'precificacao:editar_custo', 'precificacao:editar_preco'
);

-- Visualizador: Apenas leitura geral
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @id_visualizador, p.id FROM dbo.permissoes p 
WHERE p.codigo IN (
    'nc:listar', 'nc:visualizar_relatorio',
    'cadastros:colaboradores:visualizar',
    'comissoes:ver',
    'precificacao:visualizar', 'precificacao:ver_custos', 'precificacao:ver_margens'
);

PRINT '✅ Permissões associadas aos cargos com sucesso!';

-- ============================================================
-- 5. ATRIBUIÇÃO DE CARGOS A USUÁRIOS EXISTENTES
-- ============================================================

-- Exemplo: Atribuir cargo de Gerente de Qualidade para usuário específico
-- Substitua 'usuario_teste' pelo login real do usuário
-- UPDATE dbo.API_USUARIOS 
-- SET cargo_id = @id_gerente_q 
-- WHERE login = 'usuario_teste';

-- Exemplo: Atribuir cargo de Operador de NC
-- UPDATE dbo.API_USUARIOS 
-- SET cargo_id = @id_operador_nc 
-- WHERE login = 'operador_usuario';

-- Exemplo: Atribuir cargo de Analista Comercial
-- UPDATE dbo.API_USUARIOS 
-- SET cargo_id = @id_analista_com 
-- WHERE login = 'analista_usuario';

-- Exemplo: Atribuir cargo de Visualizador para estagiário
-- UPDATE dbo.API_USUARIOS 
-- SET cargo_id = @id_visualizador 
-- WHERE login = 'estagiario_usuario';

PRINT 'ℹ️ Para atribuir cargos a usuários, descomente e ajuste os comandos UPDATE acima.';

-- ============================================================
-- 6. VERIFICAÇÃO FINAL
-- ============================================================

-- Listar todos os cargos com suas permissões
SELECT 
    c.nome AS Cargo,
    p.codigo AS Permissao,
    p.descricao AS Descricao,
    p.modulo AS Modulo
FROM dbo.cargos c
LEFT JOIN dbo.cargo_permissoes cp ON c.id = cp.cargo_id AND c.ativo = 1
LEFT JOIN dbo.permissoes p ON cp.permissao_id = p.id AND p.ativo = 1
ORDER BY c.nome, p.modulo, p.codigo;

-- Listar usuários com seus cargos
SELECT 
    u.login AS Usuario,
    u.nome AS Nome,
    c.nome AS Cargo,
    u.nivel_acesso AS NivelAcesso
FROM dbo.API_USUARIOS u
LEFT JOIN dbo.cargos c ON u.cargo_id = c.id AND c.ativo = 1
WHERE u.ativo = 1
ORDER BY u.nome;

PRINT '✅ Script concluído! Verifique os resultados nas consultas acima.';
