-- ============================================================================
-- Container Flow - Tabela container_types
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'container_types')
BEGIN
    CREATE TABLE container_flow.container_types (
        id INT NOT NULL PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        descricao NVARCHAR(255) NULL,
        dimensoes NVARCHAR(100) NULL,
        created_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE INDEX IX_container_types_nome ON container_flow.container_types(nome);

    INSERT INTO container_flow.container_types (id, nome, descricao, dimensoes) VALUES
        (1, '20ft Standard', 'Contêiner padrão de 20 pés', '20x8x8.5 ft'),
        (2, '40ft Standard', 'Contêiner padrão de 40 pés', '40x8x8.5 ft'),
        (3, '40ft HC', 'Contêiner High Cube de 40 pés', '40x8x9.5 ft'),
        (4, '45ft HC', 'Contêiner High Cube de 45 pés', '45x8x9.5 ft'),
        (5, '53ft Standard', 'Contêiner padrão de 53 pés', '53x8x8.5 ft');
END
GO
