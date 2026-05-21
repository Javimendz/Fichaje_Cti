# --- 1. Verificar Permisos de Administrador ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "--- ERROR: Ejecuta PowerShell como ADMINISTRADOR ---" -ForegroundColor Red
    exit
}

Write-Host "--- Iniciando despliegue local de Fichaje CTI ---" -ForegroundColor Cyan

# --- 2. Limpieza Radical (Teardown) ---
Write-Host "Limpiando contenedores y liberando redes (Manteniendo Volúmenes de BBDD)..." -ForegroundColor Yellow

if (Test-Path "bbdd") { 
    Set-Location "bbdd"
    docker compose down 2>$null # <-- Los datos persisten de forma segura
    Set-Location ".." 
}
if (Test-Path "backend") { Set-Location "backend"; docker compose down 2>$null; Set-Location ".." }
if (Test-Path "infra/proxy") { Set-Location "infra/proxy"; docker compose down 2>$null; Set-Location "../../" }

# Eliminamos ambas redes explícitamente para evitar conflictos residuales
Write-Host "Borrando redes antiguas (si existen)..."
docker network rm red_fichaje 2>$null
docker network rm bbdd_test_network 2>$null # 🚩 CORRECCIÓN: Añadida red de test

Write-Host "Entorno limpio." -ForegroundColor Green

# --- 3. Limpiar redes antiguas (Dejamos que Compose las gestione al levantar) ---
Write-Host "Limpiando residuos de red..." -ForegroundColor Yellow
docker network rm red_fichaje 2>$null
docker network rm bbdd_test_network 2>$null 
# 🚩 NOTA: Eliminamos los 'docker network create' de aquí. 
Write-Host "Redes preparadas para Compose." -ForegroundColor Green

# --- 3. Crear redes de Docker Limpias ---
Write-Host "Configurando redes de Docker..." -ForegroundColor Yellow

# Borramos ambas para limpiar residuos antiguos
docker network rm red_fichaje 2>$null
docker network rm bbdd_test_network 2>$null 

# 🚩 LA CLAVE: Creamos OBLIGATORIAMENTE 'red_fichaje' porque es externa y obligatoria
docker network create red_fichaje

# 🚩 NOTA: NO creamos 'bbdd_test_network' a mano. Dejamos que Compose la cree (como acaba de hacer con éxito)

Write-Host "Red maestra 'red_fichaje' creada. Red de test delegada a Compose." -ForegroundColor Green

# --- 4. Liberar puerto 80 (Conflictos con IIS/HTTP en Windows) ---
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

# --- 6. Levantar Backend (Prod y Test) ---
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
    Write-Host "Backends levantados correctamente." -ForegroundColor Green
}

# --- 7. Levantar Proxy (Nginx Local) ---
if (Test-Path "infra/proxy") {
    Write-Host "Levantando Proxy con configuración local (Puertos 80 y 8080)..." -ForegroundColor Yellow
    Set-Location "infra/proxy"
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "❌ Error en Proxy." -ForegroundColor Red
        Set-Location "../../"
        exit 
    }
    Set-Location "../../"
    Write-Host "Nginx Proxy iniciado correctamente." -ForegroundColor Green
}

Write-Host "`n--- DESPLIEGUE COMPLETADO CON ÉXITO ---" -ForegroundColor Green
Write-Host "Estado actual de los servicios:" -ForegroundColor Cyan

# 🚩 MEJORA: Mostramos todos los contenedores del proyecto sin filtrar por red para ver la foto completa
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"