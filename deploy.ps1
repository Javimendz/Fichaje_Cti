# --- 1. Verificar Permisos de Administrador ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "--- ERROR: Ejecuta PowerShell como ADMINISTRADOR ---" -ForegroundColor Red
    exit
}

Write-Host "--- Iniciando despliegue de Fichaje CTI ---" -ForegroundColor Cyan

# --- 2. Limpieza Previa (Teardown) ---
Write-Host "Limpiando contenedores y redes de instalaciones anteriores..." -ForegroundColor Yellow
# El '2>$null' oculta los errores en caso de que los contenedores ya no existan
docker rm -f postgres postgres_bbdd fichaje_backend nginx_proxy 2>$null
docker network rm red_fichaje 2>$null
Write-Host "Entorno limpio." -ForegroundColor Green

# --- 2. Crear red de Docker si no existe ---
Write-Host "Configurando red de Docker..." -ForegroundColor Yellow
$networkCheck = docker network ls --filter name=red_fichaje -q
if (-not $networkCheck) {
    docker network create red_fichaje
    Write-Host "Red red_fichaje creada." -ForegroundColor Green
} else {
    Write-Host "La red red_fichaje ya existe."
}

# --- 3. Liberar puerto 80 ---
Write-Host "Liberando puerto 80 (net stop http)..." -ForegroundColor Yellow
net stop http /y 2>$null
Write-Host "Puerto 80 liberado." -ForegroundColor Green

# --- 4. Levantar Base de Datos ---
Write-Host "Levantando BBDD..." -ForegroundColor Yellow
Set-Location "bbdd"    # 👈 Quitamos el "infra/"
docker compose up -d
if ($LASTEXITCODE -ne 0) { Write-Host "Error en BBDD"; Set-Location "../"; exit }
Set-Location "../"

# --- 5. Levantar Backend ---
Write-Host "Levantando Backend..." -ForegroundColor Yellow
Set-Location "backend"
docker compose up -d --build
if ($LASTEXITCODE -ne 0) { Write-Host "Error en Backend"; Set-Location "../"; exit }
Set-Location "../"

# --- 6. Levantar Proxy (Nginx) ---
Write-Host "Levantando Proxy..." -ForegroundColor Yellow
Set-Location "infra/proxy"
docker compose up -d
if ($LASTEXITCODE -ne 0) { Write-Host "Error en Proxy"; Set-Location "../../"; exit }
Set-Location "../../"

Write-Host "--- DESPLIEGUE COMPLETADO ---" -ForegroundColor Green
docker ps