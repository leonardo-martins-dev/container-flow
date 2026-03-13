-- ============================================================================
-- Container Flow - Histórico diário de faltas e atrasos por trabalhador
-- ============================================================================

IF NOT EXISTS (
  SELECT *
  FROM sys.tables t
  JOIN sys.schemas s ON t.schema_id = s.schema_id
  WHERE s.name = 'container_flow' AND t.name = 'worker_presencas'
)
BEGIN
    CREATE TABLE container_flow.worker_presencas (
        id INT IDENTITY(1,1) PRIMARY KEY,
        worker_id INT NOT NULL,
        data DATE NOT NULL,
        status NVARCHAR(30) NOT NULL,
        atraso_minutos INT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );

    CREATE INDEX IX_worker_presencas_worker_date
        ON container_flow.worker_presencas(worker_id, data);
END
GO

