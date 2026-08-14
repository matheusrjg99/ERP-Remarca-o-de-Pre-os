-- ============================================================
-- SCRIPT UNIFICADO DE CRIAÇÃO/ATUALIZAÇÃO - ESTRUTURA COM RBAC
-- Ambiente: PRODUÇÃO/DESENVOLVIMENTO/Bddemo
-- Data: 2024
-- ============================================================
-- OBSERVAÇÕES:
-- 1. Script idempotente - pode ser executado múltiplas vezes
-- 2. Remove coluna legada 'nivel_acesso' e migra para RBAC
-- 3. Tabelas _v2 são recriadas (DROP + CREATE)
-- 4. Estrutura RBAC é atualizada incrementalmente
-- 5. Logs de auditoria agora incluem usuario_id para rastreabilidade
-- ============================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- 0. TABELA: API_USUARIOS (Cria ou Atualiza)
-- Descrição: Armazena os usuários do sistema com autenticação
-- ============================================================
IF OBJECT_ID('dbo.API_USUARIOS', 'U') IS NULL
BEGIN
    PRINT 'Criando tabela API_USUARIOS...';
    
    CREATE TABLE dbo.API_USUARIOS (
        id INT IDENTITY(1,1) PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        nome VARCHAR(100),
        cargo_id INT NULL,
        ativo BIT DEFAULT 1,
        preferencias_json VARCHAR(MAX) NULL,
        criado_em DATETIME NOT NULL DEFAULT GETDATE(),
        atualizado_em DATETIME NULL
    );
    
    -- Índices para performance
    CREATE INDEX IX_API_USUARIOS_Login ON dbo.API_USUARIOS(login);
    CREATE INDEX IX_API_USUARIOS_Ativo ON dbo.API_USUARIOS(ativo);
    CREATE INDEX IX_API_USUARIOS_Cargo ON dbo.API_USUARIOS(cargo_id);
    
    PRINT 'Tabela API_USUARIOS criada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Tabela API_USUARIOS já existe. Verificando colunas...';
    
    -- Adiciona coluna 'preferencias_json' se não existir
    IF COL_LENGTH('dbo.API_USUARIOS', 'preferencias_json') IS NULL
    BEGIN
        ALTER TABLE dbo.API_USUARIOS ADD preferencias_json VARCHAR(MAX) NULL;
        PRINT 'Coluna ''preferencias_json'' adicionada à tabela API_USUARIOS.';
    END
    
    -- Adiciona coluna 'ativo' se não existir
    IF COL_LENGTH('dbo.API_USUARIOS', 'ativo') IS NULL
    BEGIN
        ALTER TABLE dbo.API_USUARIOS ADD ativo BIT DEFAULT 1;
        PRINT 'Coluna ''ativo'' adicionada à tabela API_USUARIOS.';
    END
    
    -- Adiciona coluna 'cargo_id' se não existir
    IF COL_LENGTH('dbo.API_USUARIOS', 'cargo_id') IS NULL
    BEGIN
        ALTER TABLE dbo.API_USUARIOS ADD cargo_id INT NULL;
        PRINT 'Coluna ''cargo_id'' adicionada à tabela API_USUARIOS.';
        
        -- Índice será criado após a tabela cargos existir
    END
    
    -- Adiciona colunas de timestamp se não existirem
    IF COL_LENGTH('dbo.API_USUARIOS', 'criado_em') IS NULL
    BEGIN
        ALTER TABLE dbo.API_USUARIOS ADD criado_em DATETIME NOT NULL DEFAULT GETDATE();
        PRINT 'Coluna ''criado_em'' adicionada à tabela API_USUARIOS.';
    END
    
    IF COL_LENGTH('dbo.API_USUARIOS', 'atualizado_em') IS NULL
    BEGIN
        ALTER TABLE dbo.API_USUARIOS ADD atualizado_em DATETIME NULL;
        PRINT 'Coluna ''atualizado_em'' adicionada à tabela API_USUARIOS.';
    END
    
    -- REMOVE coluna legada 'nivel_acesso' (migração para RBAC)
    IF COL_LENGTH('dbo.API_USUARIOS', 'nivel_acesso') IS NOT NULL
    BEGIN
        -- Primeiro remove o índice se existir
        IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_API_USUARIOS_Nivel')
        BEGIN
            DROP INDEX IX_API_USUARIOS_Nivel ON dbo.API_USUARIOS;
            PRINT 'Índice IX_API_USUARIOS_Nivel removido.';
        END
        
        -- Remove a coluna
        ALTER TABLE dbo.API_USUARIOS DROP COLUMN nivel_acesso;
        PRINT 'Coluna legada ''nivel_acesso'' removida com sucesso. Migração para RBAC concluída.';
    END
    
    PRINT 'Tabela API_USUARIOS verificada/atualizada com sucesso!';
END
GO

-- ============================================================
-- 1. TABELA: colaboradores (cria se não existir)
-- Descrição: Cadastro de colaboradores do sistema
-- ============================================================
IF OBJECT_ID('dbo.colaboradores', 'U') IS NULL
BEGIN
    PRINT 'Criando tabela colaboradores...';
    
    CREATE TABLE dbo.colaboradores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(200) NOT NULL,
        cargo NVARCHAR(100) NULL,
        departamento NVARCHAR(100) NULL,
        ativo BIT NOT NULL DEFAULT 1,
        criado_em DATETIME NOT NULL DEFAULT GETDATE(),
        atualizado_em DATETIME NULL,
        usuario_id INT NULL
    );
    
    CREATE INDEX IX_Colaboradores_Nome ON dbo.colaboradores(nome);
    CREATE INDEX IX_Colaboradores_Ativo ON dbo.colaboradores(ativo);
    CREATE INDEX IX_Colaboradores_Usuario ON dbo.colaboradores(usuario_id);
    
    -- Adiciona constraint de chave estrangeira
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Colaboradores_Usuario')
    BEGIN
        ALTER TABLE dbo.colaboradores 
        ADD CONSTRAINT FK_Colaboradores_Usuario 
        FOREIGN KEY (usuario_id) REFERENCES API_USUARIOS(id) ON DELETE SET NULL;
        PRINT 'Constraint FK_Colaboradores_Usuario criada com sucesso.';
    END
    
    PRINT 'Tabela colaboradores criada com sucesso!';
END
ELSE
BEGIN
    PRINT 'Tabela colaboradores já existe. Verificando colunas...';
    
    -- Adiciona coluna 'ativo' se não existir
    IF COL_LENGTH('dbo.colaboradores', 'ativo') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores ADD ativo BIT NOT NULL DEFAULT 1;
        PRINT 'Coluna ''ativo'' adicionada à tabela colaboradores.';
    END
    
    -- Adiciona coluna 'criado_em' se não existir
    IF COL_LENGTH('dbo.colaboradores', 'criado_em') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores ADD criado_em DATETIME NOT NULL DEFAULT GETDATE();
        PRINT 'Coluna ''criado_em'' adicionada à tabela colaboradores.';
    END
    
    -- Adiciona coluna 'atualizado_em' se não existir
    IF COL_LENGTH('dbo.colaboradores', 'atualizado_em') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores ADD atualizado_em DATETIME NULL;
        PRINT 'Coluna ''atualizado_em'' adicionada à tabela colaboradores.';
    END
    
    -- Adiciona coluna 'cargo' se não existir
    IF COL_LENGTH('dbo.colaboradores', 'cargo') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores ADD cargo NVARCHAR(100) NULL;
        PRINT 'Coluna ''cargo'' adicionada à tabela colaboradores.';
    END
    
    -- Adiciona coluna 'departamento' se não existir
    IF COL_LENGTH('dbo.colaboradores', 'departamento') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores ADD departamento NVARCHAR(100) NULL;
        PRINT 'Coluna ''departamento'' adicionada à tabela colaboradores.';
    END
    
    -- Adiciona coluna 'usuario_id' se não existir (vínculo com API_USUARIOS)
    IF COL_LENGTH('dbo.colaboradores', 'usuario_id') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores ADD usuario_id INT NULL;
        PRINT 'Coluna ''usuario_id'' adicionada à tabela colaboradores.';
        
        -- Adiciona constraint de chave estrangeira
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Colaboradores_Usuario')
        BEGIN
            ALTER TABLE dbo.colaboradores 
            ADD CONSTRAINT FK_Colaboradores_Usuario 
            FOREIGN KEY (usuario_id) REFERENCES API_USUARIOS(id) ON DELETE SET NULL;
            PRINT 'Constraint FK_Colaboradores_Usuario criada com sucesso.';
        END
        
        IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Colaboradores_Usuario')
        BEGIN
            CREATE INDEX IX_Colaboradores_Usuario ON dbo.colaboradores(usuario_id);
            PRINT 'Índice em usuario_id criado com sucesso.';
        END
    END
    
    PRINT 'Tabela colaboradores verificada/atualizada com sucesso!';
END
GO

-- ============================================================
-- 2. TABELA: nao_conformidades_v2
-- Descrição: Registro principal das não conformidades
-- ============================================================
IF OBJECT_ID('dbo.nao_conformidades_v2', 'U') IS NOT NULL
    DROP TABLE dbo.nao_conformidades_v2;
GO

CREATE TABLE dbo.nao_conformidades_v2 (
    id INT IDENTITY(1,1) PRIMARY KEY,
    colaborador_id INT NOT NULL,
    descricao NVARCHAR(500) NOT NULL,
    data_ocorrencia DATETIME NOT NULL DEFAULT GETDATE(),
    status NVARCHAR(20) NOT NULL DEFAULT 'Pendente', -- Pendente, Contestada, Resolvida, Aceita
    veredito NVARCHAR(20) NULL, -- 'Deferido' (não debita), 'Indeferido' (debita), NULL (sem verdito = debita)
    criado_em DATETIME NOT NULL DEFAULT GETDATE(),
    atualizado_em DATETIME NULL,

    -- Chave estrangeira para a tabela existente 'colaboradores'
    CONSTRAINT FK_NC_V2_Colaborador FOREIGN KEY (colaborador_id)
        REFERENCES dbo.colaboradores(id)
        ON DELETE CASCADE
);
GO

-- Índices para performance
CREATE INDEX IX_NC_V2_Colaborador ON dbo.nao_conformidades_v2(colaborador_id);
CREATE INDEX IX_NC_V2_Data ON dbo.nao_conformidades_v2(data_ocorrencia);
CREATE INDEX IX_NC_V2_Status ON dbo.nao_conformidades_v2(status);
CREATE INDEX IX_NC_V2_Veredito ON dbo.nao_conformidades_v2(veredito);
GO

-- ============================================================
-- 3. TABELA: contestacoes_v2
-- Descrição: Registro das contestações e defesas dos colaboradores
-- ============================================================
IF OBJECT_ID('dbo.contestacoes_v2', 'U') IS NOT NULL
    DROP TABLE dbo.contestacoes_v2;
GO

CREATE TABLE dbo.contestacoes_v2 (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nao_conformidade_id INT NOT NULL,
    mensagem NVARCHAR(MAX) NOT NULL,
    usuario NVARCHAR(100) NOT NULL, -- 'COLABORADOR' ou 'ADMIN' ou nome do usuário
    usuario_id INT NULL, -- Vínculo com API_USUARIOS para auditoria precisa
    data_hora DATETIME NOT NULL DEFAULT GETDATE(),
    lida BIT NOT NULL DEFAULT 0,

    -- Chaves estrangeiras
    CONSTRAINT FK_CONTEST_V2_NC FOREIGN KEY (nao_conformidade_id)
        REFERENCES dbo.nao_conformidades_v2(id)
        ON DELETE CASCADE,
    CONSTRAINT FK_CONTEST_V2_Usuario FOREIGN KEY (usuario_id)
        REFERENCES dbo.API_USUARIOS(id)
        ON DELETE SET NULL
);
GO

CREATE INDEX IX_CONTEST_V2_NC ON dbo.contestacoes_v2(nao_conformidade_id);
CREATE INDEX IX_CONTEST_V2_Usuario ON dbo.contestacoes_v2(usuario_id);
GO

-- ============================================================
-- 4. TABELA: historico_nc_v2
-- Descrição: Auditoria de todas as alterações de status
-- ============================================================
IF OBJECT_ID('dbo.historico_nc_v2', 'U') IS NOT NULL
    DROP TABLE dbo.historico_nc_v2;
GO

CREATE TABLE dbo.historico_nc_v2 (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nao_conformidade_id INT NOT NULL,
    status_anterior NVARCHAR(20) NULL,
    status_novo NVARCHAR(20) NOT NULL,
    justificativa NVARCHAR(500) NULL,
    usuario_alteracao NVARCHAR(100) NULL, -- Nome ou ID de quem alterou
    usuario_id INT NULL, -- Vínculo com API_USUARIOS para auditoria precisa
    data_alteracao DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_HIST_V2_NC FOREIGN KEY (nao_conformidade_id)
        REFERENCES dbo.nao_conformidades_v2(id)
        ON DELETE CASCADE,
    CONSTRAINT FK_HIST_V2_Usuario FOREIGN KEY (usuario_id)
        REFERENCES dbo.API_USUARIOS(id)
        ON DELETE SET NULL
);
GO

CREATE INDEX IX_HIST_V2_NC ON dbo.historico_nc_v2(nao_conformidade_id);
CREATE INDEX IX_HIST_V2_Usuario ON dbo.historico_nc_v2(usuario_id);
GO

-- ============================================================
-- 5. TABELA: comissoes_config
-- Descrição: Configuração do salário base e percentual de desconto por colaborador
-- ============================================================
IF OBJECT_ID('dbo.comissoes_config', 'U') IS NOT NULL
    DROP TABLE dbo.comissoes_config;
GO

CREATE TABLE dbo.comissoes_config (
    id INT IDENTITY(1,1) PRIMARY KEY,
    colaborador_id INT NOT NULL,
    salario_base DECIMAL(10,2) NOT NULL DEFAULT 0,
    percentual_desconto DECIMAL(5,2) NOT NULL DEFAULT 0, -- Ex: 4.00 para 4%
    criado_em DATETIME NOT NULL DEFAULT GETDATE(),
    atualizado_em DATETIME NULL,

    CONSTRAINT FK_COMISSOES_CONFIG_Colaborador FOREIGN KEY (colaborador_id)
        REFERENCES dbo.colaboradores(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_COMISSOES_CONFIG_Colaborador ON dbo.comissoes_config(colaborador_id);
GO

PRINT 'Tabela comissoes_config criada com sucesso!';

-- ============================================================
-- 6. TABELAS: Sistema RBAC (Role-Based Access Control)
-- Descrição: Controle de acesso granular por permissões e cargos
-- ============================================================

-- 6.1 TABELA: permissoes
-- Descrição: Catálogo de todas as permissões disponíveis no sistema
IF OBJECT_ID('dbo.permissoes', 'U') IS NOT NULL
    DROP TABLE dbo.permissoes;
GO

CREATE TABLE dbo.permissoes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    codigo NVARCHAR(100) NOT NULL UNIQUE,      -- Ex: 'nc:criar', 'nc:editar', 'precificacao:visualizar'
    descricao NVARCHAR(255) NOT NULL,          -- Ex: 'Criar não conformidade'
    modulo NVARCHAR(50) NOT NULL,              -- Ex: 'nao_conformidades', 'precificacao', 'cadastros', 'admin'
    ativo BIT NOT NULL DEFAULT 1,
    criado_em DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Permissoes_Modulo ON dbo.permissoes(modulo);
CREATE INDEX IX_Permissoes_Codigo ON dbo.permissoes(codigo);
GO

-- 6.2 TABELA: cargos
-- Descrição: Cargos/funções que podem ser atribuídos aos usuários
IF OBJECT_ID('dbo.cargos', 'U') IS NOT NULL
    DROP TABLE dbo.cargos;
GO

CREATE TABLE dbo.cargos (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nome NVARCHAR(100) NOT NULL UNIQUE,        -- Ex: 'Administrador', 'Gestor', 'Operador'
    descricao NVARCHAR(255) NULL,
    ativo BIT NOT NULL DEFAULT 1,
    criado_em DATETIME NOT NULL DEFAULT GETDATE(),
    atualizado_em DATETIME NULL
);
GO

CREATE INDEX IX_Cargos_Nome ON dbo.cargos(nome);
CREATE INDEX IX_Cargos_Ativo ON dbo.cargos(ativo);
GO

-- 6.3 TABELA: cargo_permissoes (Associativa)
-- Descrição: Relaciona cargos com suas permissões
IF OBJECT_ID('dbo.cargo_permissoes', 'U') IS NOT NULL
    DROP TABLE dbo.cargo_permissoes;
GO

CREATE TABLE dbo.cargo_permissoes (
    cargo_id INT NOT NULL,
    permissao_id INT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT GETDATE(),

    -- Chaves estrangeiras
    CONSTRAINT FK_CARGO_PERM_Cargo FOREIGN KEY (cargo_id)
        REFERENCES dbo.cargos(id) ON DELETE CASCADE,
    CONSTRAINT FK_CARGO_PERM_Permissao FOREIGN KEY (permissao_id)
        REFERENCES dbo.permissoes(id) ON DELETE CASCADE,
    
    -- Chave primária composta
    CONSTRAINT PK_CARGO_PERM PRIMARY KEY (cargo_id, permissao_id)
);
GO

CREATE INDEX IX_CARGO_PERM_Cargo ON dbo.cargo_permissoes(cargo_id);
CREATE INDEX IX_CARGO_PERM_Permissao ON dbo.cargo_permissoes(permissao_id);
GO

-- ============================================================
-- 7. TABELA: API_LOGS
-- Descrição: Logs de auditoria das operações
-- ============================================================
IF OBJECT_ID('dbo.API_LOGS', 'U') IS NOT NULL
    DROP TABLE dbo.API_LOGS;
GO

CREATE TABLE dbo.API_LOGS (
    id INT PRIMARY KEY IDENTITY(1,1),
    data_hora DATETIME DEFAULT GETDATE(),
    usuario_login VARCHAR(50),
    usuario_id INT NULL,
    operacao VARCHAR(20),
    banco_destino VARCHAR(30),
    endpoint VARCHAR(100),
    detalhes TEXT,
    ip_origem VARCHAR(50) NULL,
    query_executada TEXT NULL,

    CONSTRAINT FK_API_LOGS_Usuario FOREIGN KEY (usuario_id)
        REFERENCES dbo.API_USUARIOS(id) ON DELETE SET NULL
);
GO

-- Índices para performance
CREATE INDEX IX_API_LOGS_DataHora ON dbo.API_LOGS(data_hora);
CREATE INDEX IX_API_LOGS_Usuario ON dbo.API_LOGS(usuario_id);
CREATE INDEX IX_API_LOGS_Operacao ON dbo.API_LOGS(operacao);
GO

-- ============================================================
-- 8. SEED: Dados iniciais do sistema RBAC
-- ============================================================

-- 8.1 Inserir permissões padrão
PRINT 'Inserindo permissões padrão...';

INSERT INTO dbo.permissoes (codigo, descricao, modulo)
SELECT codigo, descricao, modulo FROM (VALUES
-- Módulo Não Conformidades
('nc:criar', 'Criar novas não conformidades', 'nao_conformidades'),
('nc:visualizar', 'Visualizar lista de não conformidades', 'nao_conformidades'),
('nc:editar', 'Editar não conformidades (apenas descrição)', 'nao_conformidades'),
('nc:excluir', 'Excluir não conformidades', 'nao_conformidades'),
('nc:contestar', 'Contestar não conformidades', 'nao_conformidades'),
('nc:auditoria', 'Realizar auditoria e definir veredito', 'nao_conformidades'),
('nc:relatorios', 'Acessar relatórios de não conformidades', 'nao_conformidades'),

-- Módulo Precificação
('precificacao:consultar', 'Consultar precificação de produtos', 'precificacao'),
('precificacao:editar', 'Editar precificação (preço, custo, markup)', 'precificacao'),

-- Módulo Cadastros
('cadastros:colaboradores', 'Gerenciar colaboradores (CRUD completo)', 'cadastros'),
('cadastros:comissoes', 'Configurar comissões de colaboradores', 'cadastros'),

-- Módulo Admin
('admin:usuarios', 'Gerenciar usuários do sistema', 'admin'),
('admin:cargos', 'Gerenciar cargos e permissões', 'admin'),
('admin:configuracoes', 'Acessar configurações do sistema', 'admin'),
('admin:logs', 'Visualizar logs de auditoria', 'admin'),

-- Módulo RBAC (Gestão de Cargos e Permissões)
('rbac:cargo_criar', 'Criar novos cargos', 'rbac'),
('rbac:cargo_visualizar', 'Visualizar cargos', 'rbac'),
('rbac:cargo_editar', 'Editar cargos', 'rbac'),
('rbac:cargo_excluir', 'Excluir cargos', 'rbac'),
('rbac:permissao_criar', 'Criar novas permissões', 'rbac'),
('rbac:permissao_visualizar', 'Visualizar permissões', 'rbac'),
('rbac:permissao_editar', 'Editar permissões', 'rbac'),
('rbac:permissao_excluir', 'Excluir permissões', 'rbac')
) AS novas_permissoes(codigo, descricao, modulo)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.permissoes p 
    WHERE p.codigo = novas_permissoes.codigo
);

PRINT 'Permissões inseridas/atualizadas com sucesso!';

-- 8.2 Inserir cargos padrão
PRINT 'Inserindo cargos padrão...';

INSERT INTO dbo.cargos (nome, descricao)
SELECT nome, descricao FROM (VALUES
('Administrador', 'Acesso total a todas as funcionalidades do sistema'),
('Gestor', 'Acesso gerencial com permissão para auditoria e relatórios'),
('Operador', 'Acesso operacional básico para criação e visualização'),
('Colaborador', 'Acesso restrito apenas para visualização e contestação de NCs')
) AS novos_cargos(nome, descricao)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.cargos c 
    WHERE c.nome = novos_cargos.nome
);

PRINT 'Cargos inseridos/atualizados com sucesso!';

-- 8.3 Atribuir permissões aos cargos
PRINT 'Atribuindo permissões aos cargos...';

-- Administrador: TODAS as permissões (incluindo RBAC)
DECLARE @AdminId INT = (SELECT id FROM cargos WHERE nome = 'Administrador');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @AdminId, p.id FROM dbo.permissoes p
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @AdminId AND cp.permissao_id = p.id
);

-- Gestor: Permissões gerenciais (sem gestão de RBAC)
DECLARE @GestorId INT = (SELECT id FROM cargos WHERE nome = 'Gestor');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @GestorId, p.id FROM dbo.permissoes p
WHERE p.modulo IN ('nao_conformidades', 'precificacao', 'cadastros', 'admin')
  AND p.codigo NOT LIKE 'rbac:%'
  AND NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @GestorId AND cp.permissao_id = p.id
);

-- Operador: Permissões operacionais básicas
DECLARE @OperadorId INT = (SELECT id FROM cargos WHERE nome = 'Operador');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @OperadorId, p.id FROM dbo.permissoes p
WHERE p.codigo IN (
    'nc:criar', 'nc:visualizar', 'nc:editar', 'nc:contestar',
    'precificacao:consultar', 'precificacao:editar',
    'cadastros:colaboradores', 'cadastros:comissoes'
)
AND NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @OperadorId AND cp.permissao_id = p.id
);

-- Colaborador: Apenas visualizar e contestar NCs
DECLARE @ColaboradorId INT = (SELECT id FROM cargos WHERE nome = 'Colaborador');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @ColaboradorId, p.id FROM dbo.permissoes p
WHERE p.codigo IN ('nc:visualizar', 'nc:contestar')
AND NOT EXISTS (
    SELECT 1 FROM dbo.cargo_permissoes cp 
    WHERE cp.cargo_id = @ColaboradorId AND cp.permissao_id = p.id
);

PRINT 'Permissões atribuídas aos cargos com sucesso!';

-- ============================================================
-- 9. ATUALIZA ÍNDICES PENDENTES
-- ============================================================
-- Cria índice em cargo_id na tabela API_USUARIOS se ainda não existir
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_USUARIOS_Cargo')
BEGIN
    CREATE INDEX IX_USUARIOS_Cargo ON dbo.API_USUARIOS(cargo_id);
    PRINT 'Índice IX_USUARIOS_Cargo criado com sucesso.';
END

-- ============================================================
-- MENSAGEM FINAL
-- ============================================================
PRINT '============================================================';
PRINT 'ESTRUTURA DO BANCO DE DADOS CRIADA/ATUALIZADA COM SUCESSO!';
PRINT '============================================================';
PRINT 'Tabelas criadas/verificadas:';
PRINT '  - dbo.API_USUARIOS (com remoção da coluna nivel_acesso)';
PRINT '  - dbo.colaboradores';
PRINT '  - dbo.nao_conformidades_v2';
PRINT '  - dbo.contestacoes_v2';
PRINT '  - dbo.historico_nc_v2';
PRINT '  - dbo.comissoes_config';
PRINT '  - dbo.permissoes (RBAC)';
PRINT '  - dbo.cargos (RBAC)';
PRINT '  - dbo.cargo_permissoes (RBAC)';
PRINT '  - dbo.API_LOGS';
PRINT '';
PRINT 'Migração RBAC:';
PRINT '  - Coluna ''nivel_acesso'' removida da tabela API_USUARIOS';
PRINT '  - Sistema agora utiliza cargos e permissões para controle de acesso';
PRINT '';
PRINT 'Próximos passos:';
PRINT '  1. Execute este script no SQL Server';
PRINT '  2. Atualize o backend Python (security.py) para usar RBAC';
PRINT '  3. Atribua cargos aos usuários existentes';
PRINT '============================================================';
