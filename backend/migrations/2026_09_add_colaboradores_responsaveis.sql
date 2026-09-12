-- ============================================================
-- MIGRATION: Tabela colaboradores_responsaveis (v2)
-- Correção: FKs com ON DELETE NO ACTION (evita multiple cascade paths)
-- Data: 2026-09
-- Idempotente: pode ser executado múltiplas vezes sem erro.
-- ============================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================
-- 0. LIMPEZA (se a tabela ficou criada parcialmente pelo erro anterior)
-- ============================================================
IF OBJECT_ID('dbo.colaboradores_responsaveis', 'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM sys.foreign_keys
       WHERE parent_object_id = OBJECT_ID('dbo.colaboradores_responsaveis')
   )
BEGIN
    PRINT 'Detectada tabela parcial (sem FKs). Removendo para recriar...';
    DROP TABLE dbo.colaboradores_responsaveis;
END
GO

-- ============================================================
-- 1. CRIAÇÃO DA TABELA
-- ============================================================
IF OBJECT_ID('dbo.colaboradores_responsaveis', 'U') IS NULL
BEGIN
    PRINT 'Criando tabela colaboradores_responsaveis...';

    BEGIN TRY
        BEGIN TRANSACTION;

        CREATE TABLE dbo.colaboradores_responsaveis (
            id INT IDENTITY(1,1) PRIMARY KEY,
            responsavel_id INT NOT NULL,
            subordinado_id INT NOT NULL,
            percentual_desconto DECIMAL(5,2) NOT NULL DEFAULT 0,
            ativo BIT NOT NULL DEFAULT 1,
            criado_em DATETIME NOT NULL DEFAULT GETDATE(),
            atualizado_em DATETIME NULL,

            -- FKs SEM cascade (evita multiple cascade paths)
            CONSTRAINT FK_RESP_Responsavel
                FOREIGN KEY (responsavel_id) REFERENCES dbo.colaboradores(id)
                ON DELETE NO ACTION,
            CONSTRAINT FK_RESP_Subordinado
                FOREIGN KEY (subordinado_id) REFERENCES dbo.colaboradores(id)
                ON DELETE NO ACTION,

            -- Regras
            CONSTRAINT UQ_RESP_Relacao
                UNIQUE (responsavel_id, subordinado_id),
            CONSTRAINT CK_RESP_NaoSelf
                CHECK (responsavel_id <> subordinado_id),
            CONSTRAINT CK_RESP_Percentual
                CHECK (percentual_desconto >= 0 AND percentual_desconto <= 100)
        );

        COMMIT TRANSACTION;
        PRINT 'Tabela colaboradores_responsaveis criada com sucesso!';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        PRINT 'ERRO ao criar tabela: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END
ELSE
BEGIN
    PRINT 'Tabela colaboradores_responsaveis já existe. Verificando colunas...';

    -- Garante coluna 'ativo'
    IF COL_LENGTH('dbo.colaboradores_responsaveis', 'ativo') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores_responsaveis ADD ativo BIT NOT NULL DEFAULT 1;
        PRINT 'Coluna ''ativo'' adicionada.';
    END

    -- Garante coluna 'criado_em'
    IF COL_LENGTH('dbo.colaboradores_responsaveis', 'criado_em') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores_responsaveis ADD criado_em DATETIME NOT NULL DEFAULT GETDATE();
        PRINT 'Coluna ''criado_em'' adicionada.';
    END

    -- Garante coluna 'atualizado_em'
    IF COL_LENGTH('dbo.colaboradores_responsaveis', 'atualizado_em') IS NULL
    BEGIN
        ALTER TABLE dbo.colaboradores_responsaveis ADD atualizado_em DATETIME NULL;
        PRINT 'Coluna ''atualizado_em'' adicionada.';
    END

    PRINT 'Tabela colaboradores_responsaveis verificada/atualizada.';
END
GO

-- ============================================================
-- 2. ÍNDICES (criação condicional)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RESP_Responsavel')
BEGIN
    CREATE INDEX IX_RESP_Responsavel ON dbo.colaboradores_responsaveis(responsavel_id);
    PRINT 'Índice IX_RESP_Responsavel criado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RESP_Subordinado')
BEGIN
    CREATE INDEX IX_RESP_Subordinado ON dbo.colaboradores_responsaveis(subordinado_id);
    PRINT 'Índice IX_RESP_Subordinado criado.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RESP_Ativo')
BEGIN
    CREATE INDEX IX_RESP_Ativo ON dbo.colaboradores_responsaveis(ativo);
    PRINT 'Índice IX_RESP_Ativo criado.';
END
GO

-- ============================================================
-- 3. VERIFICAÇÃO FINAL (só imprime "sucesso" se a tabela realmente existe)
-- ============================================================
IF OBJECT_ID('dbo.colaboradores_responsaveis', 'U') IS NOT NULL
BEGIN
    PRINT '============================================================';
    PRINT 'MIGRATION colaboradores_responsaveis CONCLUÍDA!';
    PRINT '============================================================';
    PRINT 'Colunas:';
    PRINT '  - id (PK)';
    PRINT '  - responsavel_id (FK -> colaboradores, NO ACTION)';
    PRINT '  - subordinado_id (FK -> colaboradores, NO ACTION)';
    PRINT '  - percentual_desconto DECIMAL(5,2)';
    PRINT '  - ativo BIT';
    PRINT '  - criado_em / atualizado_em';
    PRINT 'Constraints:';
    PRINT '  - UQ_RESP_Relacao (responsavel_id, subordinado_id)';
    PRINT '  - CK_RESP_NaoSelf (responsavel_id <> subordinado_id)';
    PRINT '  - CK_RESP_Percentual (0 a 100)';
    PRINT '============================================================';
END
ELSE
BEGIN
    PRINT '============================================================';
    PRINT 'ATENÇÃO: tabela NAO foi criada. Verifique os erros acima.';
    PRINT '============================================================';
END
GO