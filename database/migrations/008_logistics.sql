-- ============================================================================
-- Container Flow - Logística: solicitações e motoristas
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'solicitacoes_logistica')
BEGIN
    CREATE TABLE container_flow.solicitacoes_logistica (
        id INT IDENTITY(1,1) PRIMARY KEY,
        container_id INT NOT NULL,
        data DATE NOT NULL,
        hora NVARCHAR(10) NULL,
        tipo NVARCHAR(50) NOT NULL DEFAULT N'movimentacao',
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_solicitacoes_logistica_data ON container_flow.solicitacoes_logistica(data);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'motoristas')
BEGIN
    CREATE TABLE container_flow.motoristas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO
