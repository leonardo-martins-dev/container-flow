# ============================================================================
# Container Flow - Criação de tabelas e objetos no banco
# Execute após restaurar o backup com: .\setup-sqlserver.ps1 restore
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
$ContainerRunning = docker ps --filter "name=$ContainerName" --format "{{.Names}}" 2>$null

if (-not $ContainerRunning) {
    Write-Host "Container SQL Server nao esta rodando." -ForegroundColor Yellow
    Write-Host "Execute primeiro: .\setup-sqlserver.ps1 start" -ForegroundColor Yellow
    Write-Host "Depois: .\setup-sqlserver.ps1 restore" -ForegroundColor Yellow
    exit 1
}

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

    $Result = docker exec $ContainerName /opt/mssql-tools/bin/sqlcmd `
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
