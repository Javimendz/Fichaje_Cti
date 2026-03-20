# 🐳 Base de Datos PostgreSQL - Fichaje CTI

Este directorio contiene la configuración completa de la base de datos PostgreSQL para el sistema Fichaje CTI.

## 📁 **Estructura de Archivos**

```
bbdd/
├── 📋 README.md                 # Esta guía
├── 🐳 Dockerfile               # Imagen Docker personalizada
├── ⚙️ postgresql.conf          # Configuración PostgreSQL
├── 🔐 pg_hba.conf              # Configuración de autenticación
├── 🚀 entrypoint.sh            # Script de inicio personalizado
├── 📄 .env.bbdd               # Variables de entorno BD
├── 🐘 docker-compose.yaml      # Compose para BD standalone
├── 🐘 docker-compose.bbdd.yaml  # Compose alternativo
├── 📂 init/                   # Scripts de inicialización
│   └── 01-extensions.sql      # Extensiones PostgreSQL
├── 📂 pgadmin/               # Configuración pgAdmin
│   └── servers.json         # Servidores preconfigurados
└── 📂 postgres-data/         # Datos persistentes (local)
```

## 🚀 **Construcción y Despliegue**

### **Opción 1: Build Manual**
```bash
# Construir la imagen
docker build -t javierm735/fichaje-bd-1 .

# Ejecutar contenedor
docker run --name fichaje-bd \
  -e POSTGRES_PASSWORD=mypass \
  -e POSTGRES_DB=fichaje_cti \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  -d javierm735/fichaje-bd-1
```

### **Opción 2: Docker Compose**
```bash
# Usar docker-compose.yaml
docker-compose up -d

# O usar docker-compose.bbdd.yaml
docker-compose -f docker-compose.bbdd.yaml up -d
```

### **Opción 3: Producción**
```bash
# Para producción con variables seguras
docker run --name fichaje-bd-prod \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=fichaje_cti \
  -e TZ=Europe/Madrid \
  -p 5432:5432 \
  -v postgres_prod_data:/var/lib/postgresql/data \
  --restart always \
  -d javierm735/fichaje-bd-1
```

## 🔧 **Configuración**

### **Variables de Entorno**
| Variable | Default | Descripción |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | Usuario de la base de datos |
| `POSTGRES_PASSWORD` | `mypass` | Contraseña del usuario |
| `POSTGRES_DB` | `fichaje_cti` | Nombre de la base de datos |
| `TZ` | `Europe/Madrid` | Zona horaria |

### **Extensiones Instaladas**
- ✅ **uuid-ossp**: Generación de UUID
- ✅ **pgcrypto**: Funciones criptográficas
- ✅ **btree_gist**: Índices GiST mejorados
- ✅ **btree_gin**: Índices GIN mejorados
- ✅ **pg_trgm**: Búsqueda de texto y similitud
- ✅ **plpgsql**: Lenguaje procedural PostgreSQL

### **Configuración de Rendimiento**
```ini
# Memoria
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

# Conexiones
max_connections = 100

# WAL
wal_level = replica
max_wal_size = 1GB
```

## 🔍 **Verificación y Monitoreo**

### **Verificar Estado**
```bash
# Verificar que el contenedor está corriendo
docker ps | grep fichaje-bd

# Ver logs de inicio
docker logs fichaje-bd --tail 20

# Verificar conexión
docker exec fichaje-bd pg_isready -U postgres

# Conectar a la base de datos
docker exec -it fichaje-bd psql -U postgres -d fichaje_cti
```

### **Monitoreo Básico**
```bash
# Verificar extensiones
docker exec fichaje-bd psql -U postgres -c "\dx"

# Verificar tamaño de base de datos
docker exec fichaje-bd psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('fichaje_cti'));"

# Verificar conexiones activas
docker exec fichaje-bd psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🛠️ **Mantenimiento**

### **Backup**
```bash
# Backup completo
docker exec fichaje-bd pg_dump -U postgres -C fichaje_cti > backup_$(date +%Y%m%d).sql

# Backup comprimido
docker exec fichaje-bd pg_dump -U postgres -C fichaje_cti | gzip > backup_$(date +%Y%m%d).sql.gz

# Backup solo datos
docker exec fichaje-bd pg_dump -U postgres --data-only fichaje_cti > backup_data_$(date +%Y%m%d).sql
```

### **Restauración**
```bash
# Restaurar desde backup
docker exec -i fichaje-bd psql -U postgres -C fichaje_cti < backup_20240318.sql

# Restaurar desde backup comprimido
gunzip -c backup_20240318.sql.gz | docker exec -i fichaje-bd psql -U postgres -C fichaje_cti
```

### **Limpieza**
```bash
# Limpiar logs antiguos
docker exec fichaje-bd psql -U postgres -c "SELECT pg_logfile_rotate();"

# Vacuum y analyze
docker exec fichaje-bd psql -U postgres -c "VACUUM ANALYZE;"

# Reindexar
docker exec fichaje-bd psql -U postgres -c "REINDEX DATABASE fichaje_cti;"
```

## 🔐 **Seguridad**

### **Configuración de Acceso**
- 🛡️ **Autenticación**: md5 para conexiones remotas
- 🔒 **SSL**: Desactivado por defecto (configurable)
- 🌐 **Acceso**: Permitido desde cualquier IP (configurable en pg_hba.conf)
- 👤 **Usuarios**: Solo postgres por defecto

### **Buenas Prácticas**
```bash
# Cambiar contraseña por defecto
docker exec fichaje-bd psql -U postgres -c "ALTER USER postgres PASSWORD 'nueva_contraseña_segura';"

# Crear usuario de aplicación
docker exec fichaje-bd psql -U postgres -c "CREATE USER app_user WITH PASSWORD 'app_password';"
docker exec fichaje-bd psql -U postgres -c "GRANT CONNECT ON DATABASE fichaje_cti TO app_user;"

# Limitar conexiones por IP
# Editar pg_hba.conf para restringir acceso
```

## 📊 **Rendimiento y Optimización**

### **Índices Recomendados**
```sql
-- Índices para consultas frecuentes
CREATE INDEX CONCURRENTLY idx_users_empresa_id ON users(empresa_id);
CREATE INDEX CONCURRENTLY idx_workday_usuario_fecha ON workday(usuario_id, fecha_jornada);
CREATE INDEX CONCURRENTLY idx_schedule_empresa_id ON schedules(empresa_id);
CREATE INDEX CONCURRENTLY idx_alarmas_empresa_leida ON alarms(empresa_id, leida_admin);
```

### **Configuración de Memoria**
```ini
# Para servidor con 4GB RAM
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB
```

## 🚨 **Troubleshooting**

### **Problemas Comunes**

#### **1. Contenedor no inicia**
```bash
# Verificar logs
docker logs fichaje-bd

# Verificar permisos de volumen
docker exec fichaje-bd ls -la /var/lib/postgresql/data
```

#### **2. Conexión rechazada**
```bash
# Verificar configuración pg_hba.conf
docker exec fichaje-bd cat /etc/postgresql/pg_hba.conf

# Verificar que PostgreSQL está escuchando
docker exec fichaje-bd netstat -tlnp | grep 5432
```

#### **3. Extensiones no encontradas**
```bash
# Verificar extensiones instaladas
docker exec fichaje-bd psql -U postgres -c "\dx"

# Reinstalar extensión si es necesario
docker exec fichaje-bd psql -U postgres -c "CREATE EXTENSION IF NOT EXISTS uuid-ossp;"
```

#### **4. Alto uso de memoria**
```bash
# Verificar uso de memoria
docker stats fichaje-bd

# Ajustar configuración de memoria
# Editar postgresql.conf y reiniciar contenedor
```

## 🌐 **Integración con Aplicación**

### **Cadena de Conexión**
```
# Desarrollo
postgresql://postgres:mypass@localhost:5432/fichaje_cti

# Producción
postgresql://postgres:secure_password@vps-host:5432/fichaje_cti
```

### **Variables de Entorno para Backend**
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=fichaje_cti
DB_USERNAME=postgres
DB_PASSWORD=mypass
```

## 📈 **Escalabilidad**

### **Replicación (Futuro)**
```bash
# Configurar master
# Editar postgresql.conf:
wal_level = replica
max_wal_senders = 3
archive_mode = on
```

### **Particionamiento (Futuro)**
```sql
-- Particionar tablas grandes por fecha
CREATE TABLE workday_2024 PARTITION OF workday
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

## 🎯 **Resumen**

Esta configuración de PostgreSQL está optimizada para:

- ✅ **Rendimiento** con configuración de memoria ajustada
- ✅ **Seguridad** con autenticación y acceso controlado
- ✅ **Monitoreo** con logging y estadísticas
- ✅ **Mantenimiento** con scripts de backup y limpieza
- ✅ **Escalabilidad** preparada para replicación y particionamiento
- ✅ **Integración** con el sistema Fichaje CTI

**Para empezar:**
```bash
docker build -t javierm735/fichaje-bd-1 .
docker run --name fichaje-bd -e POSTGRES_PASSWORD=mypass -e POSTGRES_DB=fichaje_cti -p 5432:5432 -d javierm735/fichaje-bd-1
```

🚀 **Base de datos lista para producción!**
