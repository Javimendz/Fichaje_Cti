# --- 1. Verificar Permisos ---
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
     Write-Host "--- ERROR: Ejecuta como ADMINISTRADOR ---" -ForegroundColor Red
     exit
}

Write-Host "--- Despliegue Optimizado Fichaje CTI ---" -ForegroundColor Cyan

# --- 2. Limpieza Inteligente (Rápida) ---
Write-Host "Liberando recursos..." -ForegroundColor Yellow
# En lugar de borrar todo de raíz, solo bajamos los servicios del proyecto actual
# Esto mantiene la red si ya existe, ahorrando tiempo.
docker compose -f bbdd/docker-compose.yml down 2>$null
docker compose -f backend/docker-compose.yml down 2>$null
docker compose -f infra/proxy/docker-compose.yml down 2>$null

# Solo borrar la red si es estrictamente necesario, pero aquí la creamos si no existe
if (-not (docker network ls --filter name=red_fichaje -q)) {
    docker network create red_fichaje
    Write-Host "Red red_fichaje creada." -ForegroundColor Green
}

# --- 3. Levantar Componentes (Paralelismo sugerido) ---
$componentes = @(
    @{ Path = "bbdd"; Name = "Base de Datos" },
    @{ Path = "backend"; Name = "Backend" },
    @{ Path = "infra/proxy"; Name = "Proxy Nginx" }
)

foreach ($comp in $componentes) {
    if (Test-Path $comp.Path) {
        Write-Host ">> Levantando $($comp.Name)..." -ForegroundColor Yellow
        Set-Location $comp.Path
        # Quitamos el --build para usar la caché. Si cambias el package.json, Docker lo detectará solo.
        docker compose up -d
        if ($LASTEXITCODE -ne 0) { 
            Write-Host "❌ Error en $($comp.Name)" -ForegroundColor Red
            Set-Location $env:USERPROFILE # Volver a raíz segura
            exit 
        }
        Set-Location ".."
        if ($comp.Path -eq "infra/proxy") { Set-Location ".." } # Ajuste para ruta profunda
    }
}

Write-Host "`n--- DESPLIEGUE COMPLETADO EN TIEMPO RÉCORD ---" -ForegroundColor Green
docker ps --filter "network=red_fichaje"