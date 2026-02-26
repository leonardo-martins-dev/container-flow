# ============================================================================
# Container Flow - Criação de tabelas e objetos no banco
# Se existir o backup BancoTAM na raiz, restaura primeiro; depois cria o banco
# (se necessário) e aplica as migrations.
# ============================================================================

param(
    [string]$Server,
    [string]$Database,
    [string]$User,
    [string]$Password
)
if (-not $Server) { $Server = if ($env:DB_SERVER) { $env:DB_SERVER } else { "localhost,1433" } }
if (-not $Database) { $Database = if ($env:DB_NAME) { $env:DB_NAME } else { "BancoTAM" } }
if (-not $User) { $User = if ($env:DB_USER) { $env:DB_USER } else { "sa" } }
if (-not $Password) { $Password = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "YourStrong@Passw0rd" } }

$ErrorActionPreference = "Stop"

$ScriptDir = $PSScriptRoot
$MigrationsDir = Join-Path $ScriptDir "database\migrations"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Container Flow - Setup Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servidor: $Server" -ForegroundColor Gray
Write-Host "Banco:    $Database" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $MigrationsDir)) {
    Write-Host "Pasta de migrations nao encontrada: $MigrationsDir" -ForegroundColor Red
    exit 1
}

$ContainerName = "container-flow-sqlserver"
$ContainerRunning = (docker ps --filter "name=$ContainerName" --format '{{.Names}}' 2>$null | Out-String).Trim().Split("`n")[0].Trim()

if (-not $ContainerRunning) {
    Write-Host "Container SQL Server nao esta rodando." -ForegroundColor Yellow
    Write-Host "Execute primeiro: .\setup-sqlserver.ps1 start" -ForegroundColor Yellow
    exit 1
}

# Restaurar backup BancoTAM se o arquivo existir (antes de criar banco e rodar migrations)
$BackupFile = Join-Path $ScriptDir "BancoTAM"
$BackupFileBak = Join-Path $ScriptDir "BancoTAM.bak"
$BackupPathInContainer = $null
if (Test-Path $BackupFile -PathType Leaf) {
    $BackupPathInContainer = "/backup/BancoTAM"
} elseif (Test-Path $BackupFileBak -PathType Leaf) {
    $BackupPathInContainer = "/backup/BancoTAM.bak"
}
if ($BackupPathInContainer) {
    Write-Host "Backup encontrado. Restaurando..." -ForegroundColor Cyan
    $null = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U $User -P $Password -d master -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BancoTAM') CREATE DATABASE BancoTAM;" -C 2>&1
    $restoreSql = "RESTORE DATABASE BancoTAM FROM DISK = N'$BackupPathInContainer' WITH REPLACE, RECOVERY;"
    $Result = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U $User -P $Password -d master -Q $restoreSql -C 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao restaurar backup:" -ForegroundColor Red
        Write-Host $Result -ForegroundColor Red
        exit 1
    }
    if ($Result -match "erro|error|failed|cannot") {
        Write-Host "Possivel falha no restore. Saida:" -ForegroundColor Yellow
        Write-Host $Result -ForegroundColor Yellow
    }
    Write-Host "  Backup restaurado." -ForegroundColor Green
    $verifyQuery = "SET NOCOUNT ON; SELECT COUNT(1) AS cnt FROM BancoTAM.sys.tables WHERE name = 'PROPOSTAS';"
    $verifyOut = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U $User -P $Password -d master -Q $verifyQuery -C -h -1 2>&1 | Out-String
    if ($verifyOut -notmatch "^\s*1\s*$") {
        Write-Host "  AVISO: Tabela PROPOSTAS nao encontrada apos restore." -ForegroundColor Yellow
        Write-Host "  Verifique se o arquivo na raiz e um backup .bak do SQL Server (Floca/BancoTAM)." -ForegroundColor Yellow
        $listQuery = "SET NOCOUNT ON; SELECT name FROM BancoTAM.sys.tables ORDER BY name;"
        $listOut = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U $User -P $Password -d master -Q $listQuery -C -h -1 -W 2>&1 | Out-String
        Write-Host "  Tabelas existentes no banco:" -ForegroundColor Gray
        Write-Host $listOut -ForegroundColor Gray
    }
    Write-Host ""
} else {
    Write-Host "Arquivo de backup nao encontrado. Coloque na raiz: BancoTAM ou BancoTAM.bak" -ForegroundColor Gray
    Write-Host "  (Caminho verificado: $BackupFile e $BackupFileBak)" -ForegroundColor Gray
    Write-Host ""
}

# Criar o banco se nao existir (conecta em master)
Write-Host "Verificando banco '$Database'..." -ForegroundColor Gray
$CreateDbQuery = "IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'$Database') CREATE DATABASE [$Database];"
$null = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U $User -P $Password -d master -Q "$CreateDbQuery" -C 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Aviso: nao foi possivel criar o banco (pode ja existir). Continuando..." -ForegroundColor Yellow
}
Write-Host ""

$SqlFiles = Get-ChildItem -Path $MigrationsDir -Filter "*.sql" | Sort-Object Name
if ($SqlFiles.Count -eq 0) {
    Write-Host "Nenhum arquivo .sql encontrado em $MigrationsDir" -ForegroundColor Red
    exit 1
}

foreach ($SqlFile in $SqlFiles) {
    Write-Host "Executando: $($SqlFile.Name)..." -ForegroundColor Yellow

    docker cp $SqlFile.FullName "${ContainerName}:/tmp/migration.sql" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Erro ao copiar arquivo para o container" -ForegroundColor Red
        exit 1
    }

    $Result = docker exec $ContainerName /opt/mssql-tools18/bin/sqlcmd `
        -S localhost -U $User -P $Password -d $Database -i /tmp/migration.sql -C 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Erro ao executar script:" -ForegroundColor Red
        Write-Host $Result -ForegroundColor Red
        exit 1
    }

    Write-Host "  OK" -ForegroundColor Green
}

Write-Host ""
Write-Host "Tabelas e objetos criados com sucesso no banco '$Database'." -ForegroundColor Green
Write-Host "Schema: container_flow" -ForegroundColor Gray
Write-Host ""
