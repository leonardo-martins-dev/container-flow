-- ============================================================================
-- Container Flow - Layout da fábrica (terrenos/slots por andar)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'factory_slots')
BEGIN
    CREATE TABLE container_flow.factory_slots (
        floor TINYINT NOT NULL,
        slot_id NVARCHAR(50) NOT NULL,
        name NVARCHAR(50) NOT NULL,
        x INT NOT NULL DEFAULT 0,
        y INT NOT NULL DEFAULT 0,
        width INT NOT NULL DEFAULT 180,
        height INT NOT NULL DEFAULT 80,
        container_id INT NULL,
        name_x INT NULL,
        name_y INT NULL,
        PRIMARY KEY (floor, slot_id)
    );
END
GO
