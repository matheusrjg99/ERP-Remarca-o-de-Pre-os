-- ============================================================
-- SCRIPT DE CRIAÇÃO - NOVA ESTRUTURA NORMALIZADA (V2)
-- Ambiente: DESENVOLVIMENTO
-- Data: 2024
-- ============================================================
-- OBSERVAÇÕES:
-- 1. A tabela 'colaboradores' JÁ EXISTE e NÃO será criada aqui.
-- 2. As novas tabelas usam o sufixo '_v2' para coexistir com a antiga.
-- 3. Não há migração automática de dados neste script.
-- 4. Logs de aplicação NÃO são gerados aqui (reservado para Remarcação).
-- ============================================================

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
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
    remetente_tipo NVARCHAR(10) NOT NULL, -- 'COLABORADOR' ou 'ADMIN'
    data_envio DATETIME NOT NULL DEFAULT GETDATE(),
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
PRINT '  - dbo.nao_conformidades_v2';
PRINT '  - dbo.contestacoes_v2';
PRINT '  - dbo.historico_nc_v2';
PRINT '';
PRINT 'A tabela "colaboradores" foi mantida (já existente).';
PRINT 'Próximo passo: Ajustar o backend Python para usar as tabelas _v2.';
PRINT '============================================================';