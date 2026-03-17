# 🗄️ Base de Datos PostgreSQL - Docker Compose Separado

## 📋 **Descripción**
Este directorio contiene la configuración Docker para la base de datos PostgreSQL de forma independiente.

## 🚀 **Uso**

### **Iniciar la base de datos:**
```bash
cd database
docker-compose up -d
```

### **Verificar estado:**
```bash
docker-compose ps
docker-compose logs -f postgres
```

### **Detener la base de datos:**
```bash
docker-compose down
```

## 🌐 **Acceso a la Base de Datos**

### **Conexión desde la aplicación:**
- **Host**: `host.docker.internal` (Docker Desktop) o `postgres` (bridge network)
- **Puerto**: `5432`
- **Base de datos**: `${DB_NAME}`
- **Usuario**: `${DB_USERNAME}`
- **Contraseña**: `${DB_PASSWORD}`

### **pgAdmin (Opcional):**
- **URL**: `http://localhost:5050`
- **Email**: `${PGADMIN_EMAIL:-admin@cticontrol.com}`
- **Contraseña**: `${PGADMIN_PASSWORD:-admin123}`

## 📁 **Estructura de Archivos**

```
database/
├── docker-compose.yaml    # Configuración de PostgreSQL + pgAdmin
├── init.sql            # Scripts de inicialización (opcional)
├── postgres_data/       # Volumen persistente de datos
└── README.md          # Este archivo
```

## 🔧 **Variables de Entorno Requeridas**

En el archivo `.env` del directorio principal:

```env
DB_USERNAME=postgres
DB_PASSWORD=tu_contraseña_segura
DB_NAME=fichaje_cti_prod
DB_PORT=5432

# Opcionales para pgAdmin
PGADMIN_EMAIL=admin@cticontrol.com
PGADMIN_PASSWORD=admin123
PGADMIN_PORT=5050
```

## 🔄 **Comandos Útiles**

### **Backup de la base de datos:**
```bash
docker-compose exec postgres pg_dump -U ${DB_USERNAME} ${DB_NAME} > backup_$(date +%Y%m%d).sql
```

### **Restaurar backup:**
```bash
docker-compose exec -T postgres psql -U ${DB_USERNAME} ${DB_NAME} < backup_20240317.sql
```

### **Acceder a PostgreSQL directamente:**
```bash
docker-compose exec postgres psql -U ${DB_USERNAME} ${DB_NAME}
```

## 🌍 **Redes Docker**

La base de datos crea una red `fichaje-network` que puede ser utilizada por otros contenedores para conectarse.

### **Para conectar desde otro docker-compose:**
```yaml
networks:
  fichaje-network:
    external: true
```

## 📊 **Monitoreo**

### **Verificar salud de PostgreSQL:**
```bash
docker-compose exec postgres pg_isready -U ${DB_USERNAME}
```

### **Ver logs en tiempo real:**
```bash
docker-compose logs -f postgres
```

## 🔒 **Seguridad**

- La base de datos solo es accesible desde la red Docker
- pgAdmin accesible desde localhost:5050
- Contraseñas configuradas vía variables de entorno
- Volumen persistente para datos

## 🚨 **Troubleshooting**

### **Si la base de datos no inicia:**
```bash
# Limpiar volúmenes
docker-compose down -v
docker system prune -f

# Reiniciar
docker-compose up -d
```

### **Si no puedes conectar desde la aplicación:**
1. Verifica que la red `fichaje-network` existe: `docker network ls`
2. Verifica variables de entorno: `docker-compose config`
3. Revisa logs de PostgreSQL: `docker-compose logs postgres`
