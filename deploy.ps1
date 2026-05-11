# --- 1. Verificar Permisos de Administrador ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "--- ERROR: Ejecuta PowerShell como ADMINISTRADOR ---" -ForegroundColor Red
    exit
}

Write-Host "--- Iniciando despliegue de Fichaje CTI ---" -ForegroundColor Cyan

# --- 2. Limpieza Radical (Teardown) ---
Write-Host "Limpiando contenedores y liberando red (Manteniendo Volúmenes de BBDD)..." -ForegroundColor Yellow

# 🚨 CORRECCIÓN: Quitamos el -v en BBDD para no borrar los datos 🚨
if (Test-Path "bbdd") { 
    Set-Location "bbdd"
    docker compose down 2>$null # <-- Sin el -v, los datos persisten
    Set-Location ".." 
}
if (Test-Path "backend") { Set-Location "backend"; docker compose down 2>$null; Set-Location ".." }
if (Test-Path "infra/proxy") { Set-Location "infra/proxy"; docker compose down 2>$null; Set-Location "../../" }

# Eliminamos la red explícitamente para asegurar que se crea desde cero
Write-Host "Borrando red antigua (si existe)..."
docker network rm red_fichaje 2>$null

Write-Host "Entorno limpio." -ForegroundColor Green

# --- 3. Crear red de Docker Limpia ---
Write-Host "Configurando red de Docker..." -ForegroundColor Yellow
docker network create red_fichaje
Write-Host "Red red_fichaje creada." -ForegroundColor Green

# --- 4. Liberar puerto 80 (Conflictos con IIS/HTTP) ---
Write-Host "Liberando puerto 80..." -ForegroundColor Yellow
net stop http /y 2>$null
Write-Host "Puerto 80 liberado." -ForegroundColor Green

# --- 5. Levantar Base de Datos y pgAdmin ---
if (Test-Path "bbdd") {
    Write-Host "Levantando BBDD y pgAdmin..." -ForegroundColor Yellow
    Set-Location "bbdd"
    docker compose up -d 
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Error en BBDD o pgAdmin." -ForegroundColor Red
        Set-Location ".."
        exit 
    }
    Set-Location ".."
    Write-Host "BBDD y pgAdmin iniciados correctamente." -ForegroundColor Green
}

# --- 6. Levantar Backend ---
if (Test-Path "backend") {
    Write-Host "Levantando Backend..." -ForegroundColor Yellow
    Set-Location "backend"
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Error en Backend." -ForegroundColor Red
        Set-Location ".."
        exit 
    }
    Set-Location ".."
}

# --- 7. Levantar Proxy (Nginx) ---
if (Test-Path "infra/proxy") {
    Write-Host "Levantando Proxy..." -ForegroundColor Yellow
    Set-Location "infra/proxy"
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Error en Proxy." -ForegroundColor Red
        Set-Location "../../"
        exit 
    }
    Set-Location "../../"
}

Write-Host "`n--- DESPLIEGUE COMPLETADO ---" -ForegroundColor Green
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "network=red_fichaje"