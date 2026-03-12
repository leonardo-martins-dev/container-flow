-- ============================================================================
-- Container Flow - Status de disponibilidade e Coringa em workers
-- ============================================================================

IF COL_LENGTH('container_flow.workers', 'status') IS NULL
BEGIN
    ALTER TABLE container_flow.workers ADD status NVARCHAR(30) NOT NULL DEFAULT 'presente';
END
GO

IF COL_LENGTH('container_flow.workers', 'coringa') IS NULL
BEGIN
    ALTER TABLE container_flow.workers ADD coringa BIT NOT NULL DEFAULT 0;
END
GO

IF COL_LENGTH('container_flow.workers', 'atraso_minutos') IS NULL
BEGIN
    ALTER TABLE container_flow.workers ADD atraso_minutos INT NULL;
END
GO
