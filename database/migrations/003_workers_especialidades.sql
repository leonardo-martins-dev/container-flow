-- ============================================================================
-- Container Flow - Coluna specialty_process_ids em workers
-- Executar após 002_processos_workers_horario.sql
-- ============================================================================

IF COL_LENGTH('container_flow.workers', 'specialty_process_ids') IS NULL
BEGIN
    ALTER TABLE container_flow.workers ADD specialty_process_ids NVARCHAR(500) NULL;
END
GO
