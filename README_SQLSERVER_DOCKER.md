# 🐳 SQL Server Docker - Container Flow

Este guia explica como usar o SQL Server em Docker para testar e visualizar o banco de dados BancoTAM.

## 📋 Pré-requisitos

- **Docker Desktop** instalado e rodando
  - Download: https://www.docker.com/products/docker-desktop
- Arquivo de backup **BancoTAM** na raiz do projeto

## 🚀 Uso Rápido

### 1. Iniciar SQL Server

```powershell
.\setup-sqlserver.ps1 start
```

Isso irá:
- Baixar a imagem do SQL Server 2022 Express (se necessário)
- Criar e iniciar o container
- Aguardar o SQL Server ficar pronto

### 2. Restaurar o Backup

```powershell
.\setup-sqlserver.ps1 restore
```

Isso irá:
- Criar o banco de dados `BancoTAM`
- Restaurar o backup do arquivo `BancoTAM`

### 3. Conectar ao SQL Server

```powershell
.\setup-sqlserver.ps1 connect
```

Isso abrirá um terminal interativo onde você pode executar comandos SQL.

## 📖 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `start` | Inicia o SQL Server |
| `stop` | Para o SQL Server |
| `restart` | Reinicia o SQL Server |
| `status` | Mostra status e informações de conexão |
| `restore` | Restaura o backup BancoTAM |
| `connect` | Conecta ao SQL Server via terminal |
| `logs` | Mostra logs do container |

## 🔌 Informações de Conexão

Após iniciar o SQL Server:

- **Servidor:** `localhost,1433`
- **Usuário:** `sa`
- **Senha:** `YourStrong@Passw0rd`
- **Banco:** `BancoTAM` (após restaurar)

**String de conexão:**
```
Server=localhost,1433;Database=BancoTAM;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;
```

## 💻 Exemplos de Uso

### Verificar se o SQL Server está rodando

```powershell
.\setup-sqlserver.ps1 status
```

### Ver logs do container

```powershell
.\setup-sqlserver.ps1 logs
```

### Executar comandos SQL via terminal

```powershell
.\setup-sqlserver.ps1 connect
```

Depois você pode executar comandos como:
```sql
USE BancoTAM;
GO

SELECT * FROM sys.tables;
GO

SELECT TOP 10 * FROM [NomeDaTabela];
GO
```

### Executar SQL diretamente via Docker

```powershell
docker exec container-flow-sqlserver /opt/mssql-tools/bin/sqlcmd `
    -S localhost -U sa -P "YourStrong@Passw0rd" `
    -d BancoTAM `
    -Q "SELECT * FROM sys.tables;"
```

## 🔍 Explorar o Banco de Dados

### Listar todas as tabelas

```sql
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
```

### Ver estrutura de uma tabela

```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'NomeDaTabela'
ORDER BY ORDINAL_POSITION;
```

### Ver relacionamentos (Foreign Keys)

```sql
SELECT 
    fk.name AS ForeignKey,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn
FROM sys.foreign_keys fk
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
INNER JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
INNER JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
INNER JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id;
```

## 🛠️ Solução de Problemas

### Container não inicia

1. Verifique se o Docker Desktop está rodando
2. Verifique os logs: `.\setup-sqlserver.ps1 logs`
3. Verifique se a porta 1433 não está em uso: `netstat -an | findstr 1433`

### Erro ao restaurar backup

1. Verifique se o arquivo `BancoTAM` existe na raiz do projeto
2. Verifique se o container está rodando: `.\setup-sqlserver.ps1 status`
3. Verifique os logs para mais detalhes: `.\setup-sqlserver.ps1 logs`

### Erro de permissão no PowerShell

Se você receber um erro de política de execução:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📝 Notas Importantes

- O banco de dados é persistido em um volume Docker chamado `sqlserver_data`
- Para remover completamente (incluindo dados): `docker-compose down -v`
- A senha padrão é `YourStrong@Passw0rd` - altere em produção!
- O SQL Server Express tem limitações de recursos (CPU e memória)

## 🔗 Ferramentas Recomendadas

- **Azure Data Studio** (recomendado): https://docs.microsoft.com/sql/azure-data-studio/download
- **SQL Server Management Studio (SSMS)**: https://docs.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms
- **DBeaver**: https://dbeaver.io/download/

Use qualquer uma dessas ferramentas com as credenciais acima para uma interface gráfica melhor.
