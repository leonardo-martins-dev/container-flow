-- ============================================================================
-- Container Flow - Tabela containers (pedidos persistidos)
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'containers')
BEGIN
    CREATE TABLE container_flow.containers (
        id INT IDENTITY(1,1) PRIMARY KEY,
        numero NVARCHAR(50) NOT NULL,
        type NVARCHAR(100) NOT NULL,
        cliente NVARCHAR(200) NULL,
        delivery_deadline DATE NULL,
        start_date DATE NULL,
        current_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        process_stages NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        proposta_id INT NULL
    );
    CREATE INDEX IX_containers_numero ON container_flow.containers(numero);
    CREATE INDEX IX_containers_proposta_id ON container_flow.containers(proposta_id);
END
GO
