# --- 1. Verificar Permisos de Administrador ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "--- ERROR: Ejecuta PowerShell como ADMINISTRADOR ---" -ForegroundColor Red
    exit
}

Write-Host "--- Iniciando despliegue de Fichaje CTI ---" -ForegroundColor Cyan

# --- 2. Limpieza Radical (Teardown) ---
Write-Host "Limpiando contenedores y liberando red..." -ForegroundColor Yellow

# Obtenemos todos los contenedores que podrían estar usando nuestra red
$containers = docker ps -a --filter "network=red_fichaje" -q
if ($containers) {
    Write-Host "Desconectando y eliminando contenedores antiguos..."
    foreach ($id in $containers) {
        docker network disconnect -f red_fichaje $id 2>$null
        docker rm -f $id 2>$null
    }
}

# Eliminamos contenedores por nombre por si acaso
docker rm -f postgres postgres_bbdd fichaje_backend nginx_proxy 2>$null

# Borramos la red de raíz para evitar IDs huérfanos
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

# --- 5. Levantar Base de Datos ---
if (Test-Path "bbdd") {
    Write-Host "Levantando BBDD..." -ForegroundColor Yellow
    Set-Location "bbdd"
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Error en BBDD. Revisa el archivo docker-compose en /bbdd" -ForegroundColor Red
        Set-Location ".."
        exit 
    }
    Set-Location ".."
} else {
    Write-Host "❌ ERROR: No se encuentra la carpeta /bbdd" -ForegroundColor Red
}

# --- 6. Levantar Backend ---
if (Test-Path "backend") {
    Write-Host "Levantando Backend..." -ForegroundColor Yellow
    Set-Location "backend"
    docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Error en Backend. Revisa logs con 'docker logs fichaje_backend'" -ForegroundColor Red
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
docker ps --filter "network=red_fichaje"