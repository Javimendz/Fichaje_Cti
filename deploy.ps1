# --- 1. Verificar Permisos de Administrador ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "--- ERROR: Ejecuta PowerShell como ADMINISTRADOR ---" -ForegroundColor Red
    exit
}

Write-Host "--- Iniciando despliegue local de Fichaje CTI ---" -ForegroundColor Cyan

# --- 2. Limpieza Radical ---
Write-Host "Limpiando contenedores..." -ForegroundColor Yellow
if (Test-Path "bbdd") { Set-Location "bbdd"; docker compose down 2>$null; Set-Location ".." }
if (Test-Path "backend") { Set-Location "backend"; docker compose down 2>$null; Set-Location ".." }
if (Test-Path "infra/proxy") { Set-Location "infra/proxy"; docker compose down 2>$null; Set-Location "../../" }

# --- 3. Crear redes OBLIGATORIAS antes de arrancar nada ---
Write-Host "Creando redes necesarias..." -ForegroundColor Yellow
docker network rm red_fichaje 2>$null
docker network rm bbdd_test_network 2>$null

docker network create red_fichaje
docker network create bbdd_test_network
Write-Host "Redes creadas correctamente." -ForegroundColor Green

# --- 4. Liberar puerto 80 ---
net stop http /y 2>$null

# --- 5. Levantar servicios ---
Write-Host "Levantando BBDD..." -ForegroundColor Yellow
Set-Location "bbdd"
docker compose up -d 
Set-Location ".."

Write-Host "Levantando Backend..." -ForegroundColor Yellow
Set-Location "backend"
docker compose up -d --build
Set-Location ".."

Write-Host "Levantando Proxy..." -ForegroundColor Yellow
Set-Location "infra/proxy"
docker compose up -d
Set-Location "../../"

Write-Host "`n--- DESPLIEGUE COMPLETADO ---" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"