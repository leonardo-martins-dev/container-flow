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

# Verificar se docker compose está disponível (plugin "docker compose" primeiro, depois "docker-compose")
$dockerComposeCmd = @()
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        $null = docker compose version 2>&1
        if ($LASTEXITCODE -eq 0) { $dockerComposeCmd = @("docker", "compose") }
    } catch {}
}
if ($dockerComposeCmd.Count -eq 0 -and (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    $dockerComposeCmd = @("docker-compose")
}
if ($dockerComposeCmd.Count -eq 0) {
    Write-Host "❌ docker compose não encontrado! Instale o Docker Desktop (inclui o plugin 'docker compose')." -ForegroundColor Red
    exit 1
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
        $args = @($dockerComposeCmd[1..($dockerComposeCmd.Count-1)] + "up", "-d")
        & $dockerComposeCmd[0] @args
        Write-Host ""
        Write-Host "✅ SQL Server iniciado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Aguardando container e SQL Server ficarem prontos..." -ForegroundColor Yellow

        $containerName = $null
        $maxAttempts = 45
        $attempt = 0
        $ready = $false

        function Get-SQLServerContainerName {
            $out = docker ps --filter "name=container-flow-sqlserver" --format '{{.Names}}' 2>$null | Out-String
            if ($out) { $n = $out.Trim().Split("`n")[0].Trim(); if ($n) { return $n } }
            $out = docker ps --filter "ancestor=mcr.microsoft.com/mssql/server:2022-latest" --format '{{.Names}}' 2>$null | Out-String
            if ($out) { $n = $out.Trim().Split("`n")[0].Trim(); if ($n) { return $n } }
            if ($dockerComposeCmd.Count -ge 2) {
                $prevErr = $ErrorActionPreference
                $ErrorActionPreference = 'SilentlyContinue'
                try {
                    $composeArgs = @($dockerComposeCmd[1..($dockerComposeCmd.Count-1)] + "ps", "-q")
                    $id = & $dockerComposeCmd[0] @composeArgs 2>$null
                    if ($id) {
                        $id = ($id | Out-String).Trim().Split("`n")[0].Trim()
                        if ($id) {
                            $name = docker inspect --format '{{.Name}}' $id 2>$null | Out-String
                            if ($name) { return ($name.Trim().Split("`n")[0].Trim()).TrimStart('/') }
                        }
                    }
                } finally {
                    $ErrorActionPreference = $prevErr
                }
            }
            return $null
        }

        while ($attempt -lt $maxAttempts -and -not $ready) {
            Start-Sleep -Seconds 2
            $attempt++

            if (-not $containerName) {
                $containerName = Get-SQLServerContainerName
            }
            if (-not $containerName) {
                Write-Host "   Aguardando container... ($attempt/$maxAttempts)" -ForegroundColor Gray
                continue
            }

            $result = docker exec $containerName /opt/mssql-tools18/bin/sqlcmd `
                -S localhost -U sa -P "YourStrong@Passw0rd" `
                -Q "SELECT 1" 2>&1

            if ($LASTEXITCODE -eq 0) {
                $ready = $true
                Write-Host "✅ SQL Server está pronto! (container: $containerName)" -ForegroundColor Green
            } else {
                Write-Host "   Aguardando SQL Server... ($attempt/$maxAttempts)" -ForegroundColor Gray
            }
        }

        if (-not $ready) {
            Write-Host "⚠️  SQL Server pode não estar totalmente pronto ainda." -ForegroundColor Yellow
            if ($containerName) {
                Write-Host "   Execute 'docker logs $containerName' para verificar." -ForegroundColor Yellow
            } else {
                Write-Host "   Container nao encontrado. Verifique com 'docker ps -a'." -ForegroundColor Yellow
            }
        } elseif ($backupFile -and (Test-Path $backupFile)) {
            Write-Host ""
            Restore-Backup
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
        $args = @($dockerComposeCmd[1..($dockerComposeCmd.Count-1)] + "down")
        & $dockerComposeCmd[0] @args
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
    
    $container = docker ps -a --filter "name=container-flow-sqlserver" --format '{{.Names}}|{{.Status}}|{{.Ports}}'
    
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
    docker exec container-flow-sqlserver /opt/mssql-tools18/bin/sqlcmd `
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
    
    docker exec container-flow-sqlserver /opt/mssql-tools18/bin/sqlcmd `
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
    
    docker exec -it container-flow-sqlserver /opt/mssql-tools18/bin/sqlcmd `
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
