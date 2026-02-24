-- ============================================================================
-- Container Flow - Processos, workers, worker_id_2, seed config_horario_trabalho
-- Executar após 001_schema_and_tables.sql
-- ============================================================================

-- ----------------------------------------------------------------------------
-- processos
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'processos')
BEGIN
    CREATE TABLE container_flow.processos (
        id INT NOT NULL PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        avg_minutos INT NOT NULL,
        ordem INT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_processos_ordem ON container_flow.processos(ordem);

    INSERT INTO container_flow.processos (id, nome, avg_minutos, ordem) VALUES
        (1, 'LIMPEZA', 120, 1),
        (2, 'LAVAGEM EXTERNA', 60, 2),
        (3, 'LAVAGEM INTERNA', 90, 3),
        (6, 'SOLDA', 300, 4),
        (22, 'C.QUALIDADE', 60, 5);
END
GO

-- ----------------------------------------------------------------------------
-- workers
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'workers')
BEGIN
    CREATE TABLE container_flow.workers (
        id INT NOT NULL PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        nivel NVARCHAR(20) NOT NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );

    INSERT INTO container_flow.workers (id, nome, nivel) VALUES
        (1, 'João Silva', 'senior'),
        (2, 'Maria Santos', 'senior'),
        (3, 'Pedro Oliveira', 'junior');
END
GO

-- ----------------------------------------------------------------------------
-- cronograma_diario: add worker_id_2
-- ----------------------------------------------------------------------------
IF COL_LENGTH('container_flow.cronograma_diario', 'worker_id_2') IS NULL
BEGIN
    ALTER TABLE container_flow.cronograma_diario ADD worker_id_2 INT NULL;
END
GO

-- ----------------------------------------------------------------------------
-- config_horario_trabalho: seed (dia_semana 1=Segunda .. 5=Sexta)
-- Seg-Qui 7:10-16:50, Sex 7:10-15:50, almoço 12:00-13:00
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM container_flow.config_horario_trabalho WHERE dia_semana = 1)
BEGIN
    INSERT INTO container_flow.config_horario_trabalho (dia_semana, hora_inicio, hora_fim, almoco_inicio, almoco_fim, ativo) VALUES
        (1, '07:10', '16:50', '12:00', '13:00', 1),
        (2, '07:10', '16:50', '12:00', '13:00', 1),
        (3, '07:10', '16:50', '12:00', '13:00', 1),
        (4, '07:10', '16:50', '12:00', '13:00', 1),
        (5, '07:10', '15:50', '12:00', '13:00', 1);
END
GO
