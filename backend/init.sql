-- ============================================================
-- SCRIPT DE CRIAÇÃO - NOVA ESTRUTURA NORMALIZADA (V2)
-- Ambiente: DESENVOLVIMENTO
-- Data: 2024
-- ============================================================
-- OBSERVAÇÕES:
-- 1. A tabela 'colaboradores' será criada se não existir.
-- 2. As novas tabelas usam o sufixo '_v2' para coexistir com a antiga.
-- 3. Não há migração automática de dados neste script.
-- 4. Logs de aplicação NÃO são gerados aqui (reservado para Remarcação).
-- ============================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- 0. TABELA: colaboradores (cria se não existir)
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
        atualizado_em DATETIME NULL
    );
    
    CREATE INDEX IX_Colaboradores_Nome ON dbo.colaboradores(nome);
    CREATE INDEX IX_Colaboradores_Ativo ON dbo.colaboradores(ativo);
    
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
        
        CREATE INDEX IX_Colaboradores_Usuario ON dbo.colaboradores(usuario_id);
        PRINT 'Índice em usuario_id criado com sucesso.';
    END
    
    PRINT 'Tabela colaboradores verificada/atualizada com sucesso!';
END
GO

-- ============================================================
-- 1. TABELA: nao_conformidades_v2
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
-- 2. TABELA: contestacoes_v2
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
    data_hora DATETIME NOT NULL DEFAULT GETDATE(),
    lida BIT NOT NULL DEFAULT 0,

    -- Chave estrangeira
    CONSTRAINT FK_CONTEST_V2_NC FOREIGN KEY (nao_conformidade_id)
        REFERENCES dbo.nao_conformidades_v2(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_CONTEST_V2_NC ON dbo.contestacoes_v2(nao_conformidade_id);
GO

-- ============================================================
-- 3. TABELA: historico_nc_v2
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
    data_alteracao DATETIME NOT NULL DEFAULT GETDATE(),

    CONSTRAINT FK_HIST_V2_NC FOREIGN KEY (nao_conformidade_id)
        REFERENCES dbo.nao_conformidades_v2(id)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_HIST_V2_NC ON dbo.historico_nc_v2(nao_conformidade_id);
GO

PRINT '============================================================';
PRINT 'NOVA ESTRUTURA V2 CRIADA COM SUCESSO!';
PRINT '============================================================';
PRINT 'Tabelas criadas:';
PRINT '  - dbo.colaboradores (se não existia)';
PRINT '  - dbo.nao_conformidades_v2';
PRINT '  - dbo.contestacoes_v2';
PRINT '  - dbo.historico_nc_v2';
PRINT '';
PRINT 'Próximo passo: Ajustar o backend Python para usar as tabelas _v2.';
PRINT '============================================================';
-- ============================================================
-- 4. TABELA: comissoes_config
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
-- 5. TABELAS: Sistema RBAC (Role-Based Access Control)
-- Descrição: Controle de acesso granular por permissões e cargos
-- ============================================================

-- 5.1 TABELA: permissoes
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

-- 5.2 TABELA: cargos
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

-- 5.3 TABELA: cargo_permissoes (Associativa)
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

-- 5.4 ALTERAÇÃO: Tabela API_USUARIOS
-- Adiciona coluna cargo_id para vincular usuário ao cargo
IF COL_LENGTH('dbo.API_USUARIOS', 'cargo_id') IS NULL
BEGIN
    ALTER TABLE dbo.API_USUARIOS ADD cargo_id INT NULL;
    PRINT 'Coluna ''cargo_id'' adicionada à tabela API_USUARIOS.';

    -- Adiciona constraint de chave estrangeira
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_USUARIOS_Cargo')
    BEGIN
        ALTER TABLE dbo.API_USUARIOS
        ADD CONSTRAINT FK_USUARIOS_Cargo
        FOREIGN KEY (cargo_id) REFERENCES dbo.cargos(id) ON DELETE SET NULL;
        PRINT 'Constraint FK_USUARIOS_Cargo criada com sucesso.';
    END

    CREATE INDEX IX_USUARIOS_Cargo ON dbo.API_USUARIOS(cargo_id);
    PRINT 'Índice em cargo_id criado com sucesso.';
END
ELSE
BEGIN
    PRINT 'Coluna ''cargo_id'' já existe na tabela API_USUARIOS.';
END
GO

-- ============================================================
-- 6. SEED: Dados iniciais do sistema RBAC
-- ============================================================

-- 6.1 Inserir permissões padrão
PRINT 'Inserindo permissões padrão...';

INSERT INTO dbo.permissoes (codigo, descricao, modulo) VALUES
-- Módulo Não Conformidades
('nc:criar', 'Criar novas não conformidades', 'nao_conformidades'),
('nc:visualizar', 'Visualizar lista de não conformidades', 'nao_conformidades'),
('nc:editar', 'Editar não conformidades (apenas descrição)', 'nao_conformidades'),
('nc:excluir', 'Excluir não conformidades', 'nao_conformidades'),
('nc:contestar', 'Contestar não conformidades', 'nao_conformidades'),
('nc:auditoria', 'Realizar auditoria e definir veredito', 'nao_conformidades'),
('nc:relatorios', 'Acessar relatórios de não conformidades', 'nao_conformidades'),

-- Módulo Precificação
('precificacao:visualizar', 'Visualizar tela de precificação', 'precificacao'),
('precificacao:alterar_preco', 'Alterar preço de venda', 'precificacao'),
('precificacao:alterar_custo', 'Alterar custo do produto', 'precificacao'),
('precificacao:alterar_markup', 'Alterar markup do produto', 'precificacao'),
('precificacao:remarcacao', 'Executar remarcação de preços em lote', 'precificacao'),

-- Módulo Cadastros
('cadastros:colaboradores', 'Gerenciar colaboradores (CRUD completo)', 'cadastros'),
('cadastros:comissoes', 'Configurar comissões de colaboradores', 'cadastros'),

-- Módulo Admin
('admin:usuarios', 'Gerenciar usuários do sistema', 'admin'),
('admin:cargos', 'Gerenciar cargos e permissões', 'admin'),
('admin:configuracoes', 'Acessar configurações do sistema', 'admin');

PRINT 'Permissões inseridas com sucesso!';

-- 6.2 Inserir cargos padrão
PRINT 'Inserindo cargos padrão...';

INSERT INTO dbo.cargos (nome, descricao) VALUES
('Administrador', 'Acesso total a todas as funcionalidades do sistema'),
('Gestor', 'Acesso gerencial com permissão para auditoria e relatórios'),
('Operador', 'Acesso operacional básico para criação e visualização'),
('Colaborador', 'Acesso restrito apenas para visualização e contestação de NCs');

PRINT 'Cargos inseridos com sucesso!';

-- 6.3 Atribuir permissões aos cargos
PRINT 'Atribuindo permissões aos cargos...';

-- Administrador: TODAS as permissões
DECLARE @AdminId INT = (SELECT id FROM cargos WHERE nome = 'Administrador');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @AdminId, id FROM dbo.permissoes;

-- Gestor: Permissões gerenciais
DECLARE @GestorId INT = (SELECT id FROM cargos WHERE nome = 'Gestor');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @GestorId, id FROM dbo.permissoes 
WHERE codigo IN (
    'nc:visualizar', 'nc:auditoria', 'nc:relatorios',
    'precificacao:visualizar', 'precificacao:alterar_preco', 'precificacao:alterar_custo', 'precificacao:alterar_markup', 'precificacao:remarcacao',
    'cadastros:colaboradores', 'cadastros:comissoes',
    'admin:configuracoes'
);

-- Operador: Permissões operacionais
DECLARE @OperadorId INT = (SELECT id FROM cargos WHERE nome = 'Operador');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @OperadorId, id FROM dbo.permissoes 
WHERE codigo IN (
    'nc:criar', 'nc:visualizar', 'nc:editar', 'nc:contestar',
    'precificacao:visualizar', 'precificacao:alterar_preco', 'precificacao:alterar_custo', 'precificacao:alterar_markup',
    'cadastros:colaboradores'
);

-- Colaborador: Apenas visualização e contestação
DECLARE @ColaboradorId INT = (SELECT id FROM cargos WHERE nome = 'Colaborador');
INSERT INTO dbo.cargo_permissoes (cargo_id, permissao_id)
SELECT @ColaboradorId, id FROM dbo.permissoes 
WHERE codigo IN (
    'nc:visualizar', 'nc:contestar'
);

PRINT 'Permissões atribuídas aos cargos com sucesso!';

PRINT '============================================================';
PRINT 'SISTEMA RBAC CRIADO COM SUCESSO!';
PRINT '============================================================';
PRINT 'Tabelas criadas:';
PRINT '  - dbo.permissoes';
PRINT '  - dbo.cargos';
PRINT '  - dbo.cargo_permissoes';
PRINT '  - API_USUARIOS.cargo_id (coluna adicionada)';
PRINT '';
PRINT 'Dados seed inseridos:';
PRINT '  - 20 permissões distribuídas em 4 módulos';
PRINT '  - 4 cargos pré-definidos';
PRINT '  - Matriz de permissões configurada';
PRINT '';
PRINT 'Próximo passo: Implementar backend Python para gestão de RBAC';
PRINT '============================================================';
