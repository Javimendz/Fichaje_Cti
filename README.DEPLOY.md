# 🚀 Guía de Despliegue Separado (Base de Datos + Aplicación)

## 📋 **Arquitectura Propuesta**

```
fichaje_cti/
├── docker-compose.app.yaml    # Solo la aplicación NestJS
├── database/
│   ├── docker-compose.yaml   # Solo PostgreSQL + pgAdmin
│   └── README.md          # Documentación DB
├── .env                   # Variables de entorno compartidas
└── src/                  # Código fuente
```

## 🎯 **Ventajas de esta Arquitectura**

### **✅ Beneficios:**
- **Escalabilidad**: Puedes escalar la BD y la app por separado
- **Mantenimiento**: Actualizar la app sin afectar la BD
- **Desarrollo**: Equipo de backend y DB pueden trabajar independientemente
- **Producción**: Más robusto y fácil de monitorear
- **Backup**: Facilita backups de la BD por separado

### **🔄 Flujo de Trabajo:**
1. **Base de datos**: Corre 24/7 en su propio contenedor
2. **Aplicación**: Puede reiniciarse/actualizarse sin afectar la BD
3. **Desarrollo**: Conectar localmente a BD de desarrollo/producción

## 🚀 **Pasos de Despliegue**

### **1. Preparar Variables de Entorno (.env):**
```env
# Base de datos
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_segura
DB_NAME=fichaje_cti_prod
DB_PORT=5432

# Aplicación
NODE_ENV=production
TZ=Europe/Madrid
SEED_SECRET_KEY=tu_clave_secreta_larga_y_segura
MAX_FICHAR_DISTANCE=600
DEFAULT_DAYS_ISSUES=5
DEFAULT_DAYS_REQUESTS=15
APP_PORT=3000
CORS_ORIGIN=http://cworker1.cticontrol.com:3000

# pgAdmin (opcional)
PGADMIN_EMAIL=admin@cticontrol.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
```

### **2. Iniciar Base de Datos (una sola vez):**
```bash
cd database
docker-compose up -d

# Verificar que está funcionando
docker-compose ps
docker-compose logs -f postgres
```

### **3. Crear Red Docker Compartida:**
```bash
# Crear red externa para que los contenedores se comuniquen
docker network create fichaje-network

# Verificar que existe
docker network ls | grep fichaje-network
```

### **4. Iniciar Aplicación:**
```bash
# Desde el directorio principal
docker-compose -f docker-compose.app.yaml up -d

# Verificar que conecta a la BD
docker-compose -f docker-compose.app.yaml logs -f backend
```

## 🌐 **Configuración de Conexión**

### **Para Docker Desktop:**
```yaml
# En docker-compose.app.yaml
DB_HOST: host.docker.internal
```

### **Para Docker en Linux VPS:**
```yaml
# En docker-compose.app.yaml
DB_HOST: postgres  # Nombre del contenedor
```

### **Para Producción en VPS:**
```yaml
# En docker-compose.app.yaml
ports:
  - "80:3000"  # Mapear a puerto 80
```

## 🧪 **Verificación del Despliegue**

### **1. Verificar Contenedores:**
```bash
# Base de datos
cd database && docker-compose ps

# Aplicación
docker-compose -f docker-compose.app.yaml ps
```

### **2. Probar Conexión a BD:**
```bash
# Desde el contenedor de la app
docker-compose -f docker-compose.app.yaml exec backend npm run typeorm query "SELECT 1"
```

### **3. Probar API:**
```bash
# Local
curl -X GET http://localhost:80/api

# Remoto
curl -X GET http://cworker1.cticontrol.com:3000/api
```

### **4. Verificar pgAdmin:**
```bash
# Acceder a http://localhost:5050
# Usuario: admin@cticontrol.com
# Contraseña: admin123
```

## 🔄 **Comandos de Mantenimiento**

### **Actualizar solo la aplicación:**
```bash
docker-compose -f docker-compose.app.yaml down
docker-compose -f docker-compose.app.yaml up -d --build
```

### **Backup de la base de datos:**
```bash
cd database
docker-compose exec postgres pg_dump -U postgres fichaje_cti_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

### **Ver logs:**
```bash
# Logs de la aplicación
docker-compose -f docker-compose.app.yaml logs -f backend

# Logs de la base de datos
cd database && docker-compose logs -f postgres
```

### **Reiniciar servicios:**
```bash
# Reiniciar app
docker-compose -f docker-compose.app.yaml restart backend

# Reiniciar BD
cd database && docker-compose restart postgres
```

## 🚨 **Troubleshooting**

### **Problema: La app no conecta a la BD**
```bash
# 1. Verificar red
docker network ls

# 2. Verificar que ambos contenedores están en la misma red
docker network inspect fichaje-network

# 3. Probar conexión desde el contenedor
docker-compose -f docker-compose.app.yaml exec backend nc -z host.docker.internal 5432
```

### **Problema: La BD no inicia**
```bash
cd database
docker-compose down -v
docker-compose up -d
```

### **Problema: CORS bloqueado**
Verificar que `CORS_ORIGIN` en `.env` coincida con el dominio de acceso.

## 📊 **Monitoreo**

### **Scripts de salud:**
```bash
#!/bin/bash
# health-check.sh

echo "=== Base de Datos ==="
cd database && docker-compose ps

echo -e "\n=== Aplicación ==="
docker-compose -f docker-compose.app.yaml ps

echo -e "\n=== API Health ==="
curl -f http://localhost:80/api || echo "API DOWN"

echo -e "\n=== Database Health ==="
cd database && docker-compose exec postgres pg_isready -U postgres || echo "DB DOWN"
```

## 🎯 **URLs de Acceso**

Una vez desplegado:

- **Aplicación**: `http://cworker1.cticontrol.com:3000`
- **API**: `http://cworker1.cticontrol.com:3000/api`
- **pgAdmin**: `http://cworker1.cticontrol.com:5050`

## 🔄 **Flujo Completo de Despliegue en VPS**

```bash
# 1. Subir archivos al VPS
scp -r fichaje_cti usuario@cworker1.cticontrol.com:/home/usuario/

# 2. Conectar al VPS
ssh usuario@cworker1.cticontrol.com

# 3. Configurar variables
cd /home/usuario/fichaje_cti
nano .env

# 4. Iniciar base de datos
cd database
docker-compose up -d

# 5. Crear red compartida
docker network create fichaje-network

# 6. Iniciar aplicación
cd ..
docker-compose -f docker-compose.app.yaml up -d

# 7. Verificar todo funciona
docker-compose -f docker-compose.app.yaml logs -f backend
```

**¡Listo! Tienes una arquitectura escalable y mantenible.** 🎉
