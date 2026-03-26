-- =========================================
-- ESTRUTURA DA TABELA DE LOGS (AUDITORIA)
-- =========================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'API_LOGS')
BEGIN
    -- Se a tabela já existir, vamos adicionar as colunas que faltam
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('API_LOGS') AND name = 'banco_destino')
        ALTER TABLE API_LOGS ADD banco_destino VARCHAR(30);

    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('API_LOGS') AND name = 'detalhes')
        ALTER TABLE API_LOGS ADD detalhes TEXT;
        
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('API_LOGS') AND name = 'query_executada')
        ALTER TABLE API_LOGS ADD query_executada TEXT;
END
ELSE
BEGIN
    -- Caso a tabela nem exista, cria do zero com a estrutura correta
    CREATE TABLE API_LOGS (
        id INT PRIMARY KEY IDENTITY(1,1),
        data_hora DATETIME DEFAULT GETDATE(),
        usuario_login VARCHAR(50),
        operacao VARCHAR(20),
        banco_destino VARCHAR(30),
        endpoint VARCHAR(100),
        detalhes TEXT,
        ip_origem VARCHAR(50),
        query_executada TEXT
    );
END

-- =========================================
-- ESTRUTURA DA TABELA DE USUÁRIOS E PREFERÊNCIAS
-- =========================================
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'API_USUARIOS')
BEGIN
    -- Se a tabela já existir, verifica se tem a coluna de preferências (adicionada na v1.1)
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('API_USUARIOS') AND name = 'preferencias_json')
        ALTER TABLE API_USUARIOS ADD preferencias_json VARCHAR(MAX);
END
ELSE
BEGIN
    -- Criação da tabela de usuários do zero
    CREATE TABLE API_USUARIOS (
        id INT PRIMARY KEY IDENTITY(1,1),
        login VARCHAR(50) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        nome VARCHAR(100),
        nivel_acesso VARCHAR(20) DEFAULT 'COMUM',
        ativo BIT DEFAULT 1,
        preferencias_json VARCHAR(MAX) -- Armazena cores, regras e filtros salvos do usuário
    );
END