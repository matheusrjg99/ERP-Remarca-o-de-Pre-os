-- ============================================================
-- SCRIPT DE CONFIGURAÇÃO DO BANCO Bddemo
-- Descrição: Cria a tabela API_USUARIOS no banco de demonstração
-- Executar no banco: Bddemo
-- ============================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- TABELA: API_USUARIOS
-- Descrição: Armazena os usuários do sistema com autenticação
-- ============================================================
IF OBJECT_ID('dbo.API_USUARIOS', 'U') IS NULL
BEGIN
    PRINT 'Criando tabela API_USUARIOS no Bddemo...';
    
    CREATE TABLE dbo.API_USUARIOS (
        id INT IDENTITY(1,1) PRIMARY KEY,
        login VARCHAR(50) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        nome VARCHAR(100),
        nivel_acesso VARCHAR(20) DEFAULT 'COMUM',
        ativo BIT DEFAULT 1,
        preferencias_json VARCHAR(MAX) NULL
    );
    
    -- Índices para performance
    CREATE INDEX IX_API_USUARIOS_Login ON dbo.API_USUARIOS(login);
    CREATE INDEX IX_API_USUARIOS_Ativo ON dbo.API_USUARIOS(ativo);
    CREATE INDEX IX_API_USUARIOS_Nivel ON dbo.API_USUARIOS(nivel_acesso);
    
    PRINT 'Tabela API_USUARIOS criada com sucesso no Bddemo!';
END
ELSE
BEGIN
    PRINT 'Tabela API_USUARIOS já existe no Bddemo. Verificando colunas...';
    
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
    
    -- Adiciona coluna 'nivel_acesso' se não existir
    IF COL_LENGTH('dbo.API_USUARIOS', 'nivel_acesso') IS NULL
    BEGIN
        ALTER TABLE dbo.API_USUARIOS ADD nivel_acesso VARCHAR(20) DEFAULT 'COMUM';
        PRINT 'Coluna ''nivel_acesso'' adicionada à tabela API_USUARIOS.';
    END
    
    PRINT 'Tabela API_USUARIOS verificada/atualizada com sucesso no Bddemo!';
END
GO

-- ============================================================
-- TABELA: API_LOGS (se necessário no Bddemo)
-- Descrição: Logs de auditoria das operações
-- ============================================================
IF OBJECT_ID('dbo.API_LOGS', 'U') IS NULL
BEGIN
    PRINT 'Criando tabela API_LOGS no Bddemo...';
    
    CREATE TABLE dbo.API_LOGS (
        id INT PRIMARY KEY IDENTITY(1,1),
        data_hora DATETIME DEFAULT GETDATE(),
        usuario_login VARCHAR(50),
        operacao VARCHAR(20),
        banco_destino VARCHAR(30),
        endpoint VARCHAR(100),
        detalhes TEXT,
        ip_origem VARCHAR(50) NULL,
        query_executada TEXT NULL
    );
    
    -- Índices para performance
    CREATE INDEX IX_API_LOGS_DataHora ON dbo.API_LOGS(data_hora);
    CREATE INDEX IX_API_LOGS_Usuario ON dbo.API_LOGS(usuario_login);
    CREATE INDEX IX_API_LOGS_Operacao ON dbo.API_LOGS(operacao);
    
    PRINT 'Tabela API_LOGS criada com sucesso no Bddemo!';
END
ELSE
BEGIN
    PRINT 'Tabela API_LOGS já existe no Bddemo.';
    
    -- Verifica colunas adicionais
    IF COL_LENGTH('dbo.API_LOGS', 'banco_destino') IS NULL
        ALTER TABLE API_LOGS ADD banco_destino VARCHAR(30);
    
    IF COL_LENGTH('dbo.API_LOGS', 'detalhes') IS NULL
        ALTER TABLE API_LOGS ADD detalhes TEXT;
        
    IF COL_LENGTH('dbo.API_LOGS', 'query_executada') IS NULL
        ALTER TABLE API_LOGS ADD query_executada TEXT;
    
    PRINT 'Tabela API_LOGS verificada/atualizada com sucesso no Bddemo!';
END
GO

PRINT '============================================================';
PRINT 'CONFIGURAÇÃO DO BDDMO CONCLUÍDA COM SUCESSO!';
PRINT '============================================================';
PRINT 'Tabelas criadas/verificadas:';
PRINT '  - dbo.API_USUARIOS';
PRINT '  - dbo.API_LOGS';
PRINT '';
PRINT 'Próximo passo:';
PRINT '  1. Execute este script no SQL Server no banco Bddemo';
PRINT '  2. Execute o script criar_admin.py para criar o usuário admin';
PRINT '============================================================';
