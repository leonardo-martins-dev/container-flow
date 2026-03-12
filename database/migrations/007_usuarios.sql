-- ============================================================================
-- Container Flow - Tabela de usuários para login e níveis de acesso
-- ============================================================================

IF NOT EXISTS (SELECT * FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = 'container_flow' AND t.name = 'usuarios')
BEGIN
    CREATE TABLE container_flow.usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nome NVARCHAR(100) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        senha_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(30) NOT NULL DEFAULT 'lider',
        ativo BIT NOT NULL DEFAULT 1,
        created_at DATETIME2 DEFAULT GETUTCDATE(),
        updated_at DATETIME2 DEFAULT GETUTCDATE()
    );
    CREATE UNIQUE INDEX IX_usuarios_email ON container_flow.usuarios(email);
END
GO

-- Seed admin: executado pelo backend na primeira requisição de login se a tabela estiver vazia (senha: admin123)
