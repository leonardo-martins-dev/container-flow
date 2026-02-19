-- ============================================================================
-- Container Flow - Tabelas adicionais (schema container_flow)
-- Executar após restaurar o backup BancoTAM
-- SQL Server
-- ============================================================================

-- Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'container_flow')
    EXEC('CREATE SCHEMA container_flow');
GO

-- ----------------------------------------------------------------------------
-- regras_sequenciamento
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'regras_sequenciamento')
BEGIN
    CREATE TABLE container_flow.regras_sequenciamento (
        id INT IDENTITY(1,1) PRIMARY KEY,
        process_id INT NOT NULL,
        before_processes NVARCHAR(MAX) NULL,  -- JSON array of process IDs
        after_processes NVARCHAR(MAX) NULL,
        parallel_processes NVARCHAR(MAX) NULL,
        separated_processes NVARCHAR(MAX) NULL,
        same_worker_processes NVARCHAR(MAX) NULL,
        requires_senior_junior BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_regras_process ON container_flow.regras_sequenciamento(process_id);
END
GO

-- ----------------------------------------------------------------------------
-- processos_delay
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'processos_delay')
BEGIN
    CREATE TABLE container_flow.processos_delay (
        id INT IDENTITY(1,1) PRIMARY KEY,
        process_id INT NOT NULL,
        process_name NVARCHAR(100) NULL,
        delay_minutos INT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        UNIQUE(process_id)
    );
    CREATE INDEX IX_processos_delay_process ON container_flow.processos_delay(process_id);
END
GO

-- ----------------------------------------------------------------------------
-- processos_dois_trabalhadores
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'processos_dois_trabalhadores')
BEGIN
    CREATE TABLE container_flow.processos_dois_trabalhadores (
        id INT IDENTITY(1,1) PRIMARY KEY,
        process_id INT NOT NULL,
        process_name NVARCHAR(100) NULL,
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        UNIQUE(process_id)
    );
    CREATE INDEX IX_processos_dois_process ON container_flow.processos_dois_trabalhadores(process_id);
END
GO

-- ----------------------------------------------------------------------------
-- processos_mesmo_trabalhador_sequencia
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'processos_mesmo_trabalhador_sequencia')
BEGIN
    CREATE TABLE container_flow.processos_mesmo_trabalhador_sequencia (
        id INT IDENTITY(1,1) PRIMARY KEY,
        processo_a_id INT NOT NULL,
        processo_b_id INT NOT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        UNIQUE(processo_a_id, processo_b_id)
    );
    CREATE INDEX IX_mesmo_worker_a ON container_flow.processos_mesmo_trabalhador_sequencia(processo_a_id);
    CREATE INDEX IX_mesmo_worker_b ON container_flow.processos_mesmo_trabalhador_sequencia(processo_b_id);
END
GO

-- ----------------------------------------------------------------------------
-- cronograma_macro
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'cronograma_macro')
BEGIN
    CREATE TABLE container_flow.cronograma_macro (
        id INT IDENTITY(1,1) PRIMARY KEY,
        linha INT NOT NULL,
        dia INT NOT NULL,
        proposta_id INT NULL,
        container_id NVARCHAR(50) NULL,
        inicio_previsto DATETIME2 NULL,
        fim_previsto DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_cron_macro_linha_dia ON container_flow.cronograma_macro(linha, dia);
    CREATE INDEX IX_cron_macro_proposta ON container_flow.cronograma_macro(proposta_id);
END
GO

-- ----------------------------------------------------------------------------
-- cronograma_diario
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'cronograma_diario')
BEGIN
    CREATE TABLE container_flow.cronograma_diario (
        id INT IDENTITY(1,1) PRIMARY KEY,
        data DATE NOT NULL,
        worker_id INT NOT NULL,
        container_id NVARCHAR(50) NULL,
        proposta_id INT NULL,
        processo_id INT NULL,
        processo_nome NVARCHAR(100) NULL,
        inicio DATETIME2 NOT NULL,
        fim DATETIME2 NOT NULL,
        hora_extra_minutos INT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_cron_diario_data ON container_flow.cronograma_diario(data);
    CREATE INDEX IX_cron_diario_worker ON container_flow.cronograma_diario(worker_id, data);
END
GO

-- ----------------------------------------------------------------------------
-- hora_extra
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'hora_extra')
BEGIN
    CREATE TABLE container_flow.hora_extra (
        id INT IDENTITY(1,1) PRIMARY KEY,
        worker_id INT NOT NULL,
        data DATE NOT NULL,
        minutos INT NOT NULL DEFAULT 0,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        UNIQUE(worker_id, data)
    );
    CREATE INDEX IX_hora_extra_worker ON container_flow.hora_extra(worker_id);
    CREATE INDEX IX_hora_extra_data ON container_flow.hora_extra(data);
END
GO

-- ----------------------------------------------------------------------------
-- config_horario_trabalho
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'config_horario_trabalho')
BEGIN
    CREATE TABLE container_flow.config_horario_trabalho (
        id INT IDENTITY(1,1) PRIMARY KEY,
        dia_semana INT NOT NULL,
        hora_inicio TIME NOT NULL,
        hora_fim TIME NOT NULL,
        almoco_inicio TIME NULL,
        almoco_fim TIME NULL,
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        UNIQUE(dia_semana)
    );
    CREATE INDEX IX_config_horario_dia ON container_flow.config_horario_trabalho(dia_semana);
END
GO
