# Script PowerShell para configurar e gerenciar SQL Server em Docker
# Container Flow - Setup SQL Server

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "restart", "status", "restore", "connect", "logs")]
    [string]$Action = "start"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Container Flow - SQL Server Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Verificar se docker-compose está disponível
$dockerComposeCmd = "docker compose"
if (-not (docker compose version 2>$null)) {
    $dockerComposeCmd = "docker-compose"
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Host "❌ docker-compose não encontrado!" -ForegroundColor Red
        exit 1
    }
}

# Verificar se o arquivo de backup existe
$backupFile = Join-Path $PSScriptRoot "BancoTAM"
if (-not (Test-Path $backupFile)) {
    Write-Host "⚠️  Arquivo de backup 'BancoTAM' não encontrado em: $PSScriptRoot" -ForegroundColor Yellow
    Write-Host "   O container será iniciado, mas você precisará restaurar o backup manualmente." -ForegroundColor Yellow
    Write-Host ""
}

function Start-SQLServer {
    Write-Host "🚀 Iniciando SQL Server..." -ForegroundColor Green
    
    Push-Location $PSScriptRoot
    try {
        & $dockerComposeCmd up -d
        Write-Host ""
        Write-Host "✅ SQL Server iniciado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Aguardando SQL Server ficar pronto..." -ForegroundColor Yellow
        
        $maxAttempts = 30
        $attempt = 0
        $ready = $false
        
        while ($attempt -lt $maxAttempts -and -not $ready) {
            Start-Sleep -Seconds 2
            $attempt++
            
            $result = docker exec container-flow-sqlserver /opt/mssql-tools/bin/sqlcmd `
                -S localhost -U sa -P "YourStrong@Passw0rd" `
                -Q "SELECT 1" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                $ready = $true
                Write-Host "✅ SQL Server está pronto!" -ForegroundColor Green
            } else {
                Write-Host "   Aguardando... ($attempt/$maxAttempts)" -ForegroundColor Gray
            }
        }
        
        if (-not $ready) {
            Write-Host "⚠️  SQL Server pode não estar totalmente pronto ainda." -ForegroundColor Yellow
            Write-Host "   Execute 'docker logs container-flow-sqlserver' para verificar." -ForegroundColor Yellow
        }
        
        Show-ConnectionInfo
    } finally {
        Pop-Location
    }
}

function Stop-SQLServer {
    Write-Host "🛑 Parando SQL Server..." -ForegroundColor Yellow
    Push-Location $PSScriptRoot
    try {
        & $dockerComposeCmd down
        Write-Host "✅ SQL Server parado." -ForegroundColor Green
    } finally {
        Pop-Location
    }
}

function Restart-SQLServer {
    Write-Host "🔄 Reiniciando SQL Server..." -ForegroundColor Yellow
    Stop-SQLServer
    Start-Sleep -Seconds 2
    Start-SQLServer
}

function Show-Status {
    Write-Host "📊 Status do SQL Server:" -ForegroundColor Cyan
    Write-Host ""
    
    $container = docker ps -a --filter "name=container-flow-sqlserver" --format "{{.Names}}|{{.Status}}|{{.Ports}}"
    
    if ($container) {
        $parts = $container -split '\|'
        Write-Host "Container: $($parts[0])" -ForegroundColor White
        Write-Host "Status:    $($parts[1])" -ForegroundColor White
        Write-Host "Portas:    $($parts[2])" -ForegroundColor White
        Write-Host ""
        
        if ($container -match "Up") {
            Show-ConnectionInfo
        }
    } else {
        Write-Host "❌ Container não encontrado. Execute 'start' para criar." -ForegroundColor Red
    }
}

function Restore-Backup {
    Write-Host "📦 Restaurando backup BancoTAM..." -ForegroundColor Cyan
    Write-Host ""
    
    $backupFile = Join-Path $PSScriptRoot "BancoTAM"
    if (-not (Test-Path $backupFile)) {
        Write-Host "❌ Arquivo de backup não encontrado: $backupFile" -ForegroundColor Red
        exit 1
    }
    
    # Verificar se o container está rodando
    $containerStatus = docker ps --filter "name=container-flow-sqlserver" --format "{{.Names}}"
    if (-not $containerStatus) {
        Write-Host "⚠️  Container não está rodando. Iniciando..." -ForegroundColor Yellow
        Start-SQLServer
        Start-Sleep -Seconds 5
    }
    
    Write-Host "Criando banco de dados 'BancoTAM'..." -ForegroundColor Yellow
    
    # Criar banco de dados
    docker exec container-flow-sqlserver /opt/mssql-tools/bin/sqlcmd `
        -S localhost -U sa -P "YourStrong@Passw0rd" `
        -Q "IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'BancoTAM') CREATE DATABASE BancoTAM;" `
        2>&1 | Out-Null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao criar banco de dados." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Restaurando backup..." -ForegroundColor Yellow
    
    # Restaurar backup
    $restoreScript = @"
RESTORE DATABASE BancoTAM 
FROM DISK = '/backup/BancoTAM'
WITH REPLACE, RECOVERY;
"@
    
    docker exec container-flow-sqlserver /opt/mssql-tools/bin/sqlcmd `
        -S localhost -U sa -P "YourStrong@Passw0rd" `
        -Q $restoreScript
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Backup restaurado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Banco de dados 'BancoTAM' está pronto para uso." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️  Pode haver erros na restauração. Verifique os logs:" -ForegroundColor Yellow
        Write-Host "   docker logs container-flow-sqlserver" -ForegroundColor Gray
    }
}

function Show-ConnectionInfo {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Informações de Conexão" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Servidor:    localhost,1433" -ForegroundColor White
    Write-Host "Usuário:     sa" -ForegroundColor White
    Write-Host "Senha:       YourStrong@Passw0rd" -ForegroundColor White
    Write-Host "Banco:       BancoTAM (após restaurar)" -ForegroundColor White
    Write-Host ""
    Write-Host "String de conexão:" -ForegroundColor Yellow
    Write-Host "Server=localhost,1433;Database=BancoTAM;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;" -ForegroundColor Gray
    Write-Host ""
}

function Connect-SQLServer {
    Write-Host "🔌 Conectando ao SQL Server via terminal..." -ForegroundColor Cyan
    Write-Host ""
    
    $containerStatus = docker ps --filter "name=container-flow-sqlserver" --format "{{.Names}}"
    if (-not $containerStatus) {
        Write-Host "❌ Container não está rodando. Execute 'start' primeiro." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Digite comandos SQL. Digite 'EXIT' ou 'QUIT' para sair." -ForegroundColor Yellow
    Write-Host ""
    
    docker exec -it container-flow-sqlserver /opt/mssql-tools/bin/sqlcmd `
        -S localhost -U sa -P "YourStrong@Passw0rd" `
        -d BancoTAM
}

function Show-Logs {
    Write-Host "📋 Logs do SQL Server:" -ForegroundColor Cyan
    Write-Host ""
    docker logs container-flow-sqlserver --tail 50 -f
}

# Executar ação solicitada
switch ($Action) {
    "start" {
        Start-SQLServer
    }
    "stop" {
        Stop-SQLServer
    }
    "restart" {
        Restart-SQLServer
    }
    "status" {
        Show-Status
    }
    "restore" {
        Restore-Backup
    }
    "connect" {
        Connect-SQLServer
    }
    "logs" {
        Show-Logs
    }
    default {
        Write-Host "Uso: .\setup-sqlserver.ps1 [start|stop|restart|status|restore|connect|logs]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Ações disponíveis:" -ForegroundColor Cyan
        Write-Host "  start    - Inicia o SQL Server" -ForegroundColor White
        Write-Host "  stop     - Para o SQL Server" -ForegroundColor White
        Write-Host "  restart  - Reinicia o SQL Server" -ForegroundColor White
        Write-Host "  status   - Mostra status e informações de conexão" -ForegroundColor White
        Write-Host "  restore  - Restaura o backup BancoTAM" -ForegroundColor White
        Write-Host "  connect  - Conecta ao SQL Server via terminal" -ForegroundColor White
        Write-Host "  logs     - Mostra logs do container" -ForegroundColor White
    }
}
