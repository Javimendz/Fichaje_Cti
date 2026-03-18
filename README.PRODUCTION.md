# 🚀 Guía de Despliegue en Producción - Fichaje CTI

## 📋 **Arquitectura de Producción**

```
fichaje_cti/
├── docker-compose.prod.yaml    # 🐘 Configuración producción completa
├── .env.production          # 🔐 Variables de entorno producción
├── nginx/
│   ├── nginx.conf           # 🌐 Configuración Nginx
│   └── ssl/               # 🔒 Certificados SSL
└── bbdd/init/             # 📄 Scripts inicialización BD
```

## 🚀 **Comandos de Despliegue**

### **Método 1: Docker Compose**

**Recomendado para:**
- ✅ Desarrollo local
- ✅ Entornos de prueba
- ✅ Despliegues simples

#### **Comandos:**
```bash
# Desarrollo
docker-compose up -d

# Producción
docker-compose -f docker-compose.prod.yaml --env-file .env.production up -d

# Con perfiles específicos
docker-compose -f docker-compose.prod.yaml --env-file .env.production --profile admin up -d
```

**Ventajas:**
- ✅ Gestión automática de dependencias
- ✅ Configuración declarativa
- ✅ Fácil escalado

---

### **Método 2: Docker Run (Recomendado para Producción)**

**Recomendado para:**
- ✅ Producción
- ✅ Control granular
- ✅ Debugging avanzado
- ✅ Despliegues VPS sin docker-compose

#### **🔧 Comandos Individuales:**

##### **Paso 1: Preparar VPS**
```bash
# Conectar al VPS
ssh usuario@cworker1.cticontrol.com

# Crear directorio de trabajo
mkdir -p /home/usuario/fichaje_cti
cd /home/usuario/fichaje_cti

# Crear red Docker
docker network create fichaje-prod-network

# Crear volúmenes persistentes
docker volume create postgres_prod_data
docker volume create pgadmin_prod_data
```

##### **Paso 2: Iniciar PostgreSQL**
```bash
# Iniciar PostgreSQL con docker run
docker run -d \
  --name fichaje_postgres_prod \
  --network fichaje-prod-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=mypass_prod \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_prod_data:/var/lib/postgresql/data \
  -v /home/usuario/fichaje_cti/bbdd/init:/docker-entrypoint-initdb.d \
  -p 5432:5432 \
  --restart always \
  postgres:14.3

# Verificar que está corriendo
docker ps | grep fichaje_postgres_prod
```

##### **Paso 3: Esperar a PostgreSQL**
```bash
# Esperar a que la base de datos esté lista
echo "⏳ Esperando a que PostgreSQL esté listo..."
for i in {1..30}; do
    if docker exec fichaje_postgres_prod pg_isready -U postgres >/dev/null 2>&1; then
        echo "✅ PostgreSQL está listo!"
        break
    fi
    echo "⏳ Esperando... ($i/30)"
    sleep 1
done
```

##### **Paso 4: Iniciar Backend**
```bash
# Iniciar backend con docker run
docker run -d \
  --name fichaje_backend_prod \
  --network fichaje-prod-network \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=fichaje_cti \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=mypass_prod \
  -e NODE_ENV=production \
  -e APP_PORT=3000 \
  -e CORS_ORIGIN=http://cworker1.cticontrol.com:3567 \
  -e TZ=Europe/Madrid \
  -e JWT_SECRET=tu_secreto_para_access_prod_muy_seguro \
  -e JWT_REFRESH_SECRET=tu_secreto_para_refresh_prod_muy_seguro \
  -e JWT_EXPIRATION=1h \
  -e JWT_REFRESH_EXPIRATION=7d \
  -e SEED_SECRET_KEY=123_prod_secure \
  -e MAX_FICHAR_DISTANCE=600 \
  -e DEFAULT_DAYS_ISSUES=5 \
  -e DEFAULT_DAYS_REQUESTS=15 \
  -p 3000:3000 \
  --restart always \
  --memory=1g \
  --cpus=1.0 \
  javierm735/fichaje-backend-1:latest

# Verificar que está corriendo
docker ps | grep fichaje_backend_prod
```

##### **Paso 5: (Opcional) Iniciar Nginx**
```bash
# Crear directorio para nginx
mkdir -p /home/usuario/fichaje_cti/nginx

# Copiar configuración nginx
scp -r ./nginx/* usuario@cworker1.cticontrol.com:/home/usuario/fichaje_cti/nginx/

# Iniciar nginx con docker run
docker run -d \
  --name fichaje_nginx_prod \
  --network fichaje-prod-network \
  -v /home/usuario/fichaje_cti/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  -v /home/usuario/fichaje_cti/nginx/ssl:/etc/nginx/ssl:ro \
  -p 80:80 \
  -p 443:443 \
  --restart always \
  nginx:alpine
```

##### **Paso 6: (Opcional) Iniciar pgAdmin**
```bash
# Iniciar pgAdmin con docker run
docker run -d \
  --name fichaje_pgadmin_prod \
  --network fichaje-prod-network \
  -e PGADMIN_DEFAULT_EMAIL=admin@cticontrol.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin123_prod_secure \
  -v pgadmin_prod_data:/var/lib/pgadmin \
  -p 5050:80 \
  --restart always \
  dpage/pgadmin4:latest
```

**Ventajas de docker run:**
- ✅ **Control total**: Sobre cada contenedor individualmente
- ✅ **Recursos definidos**: Memoria y CPU explícitos
- ✅ **Transparencia**: Sin abstracción de docker-compose
- ✅ **Debugging**: Más fácil aislar y diagnosticar
- ✅ **Producción**: Más adecuado para entornos críticos

---

### **Método 3: Script Automático (docker run)**

**Para despliegues automatizados con docker run:**

#### **Uso del Script Automático:**
```bash
# Hacer ejecutable el script
chmod +x deploy-vps-docker-run.sh

# Ejecutar en el VPS
./deploy-vps-docker-run.sh
```

**Características del script automático:**
- ✅ **Verificación automática** de requisitos
- ✅ **Creación inteligente** de red y volúmenes
- ✅ **Espera automática** de servicios
- ✅ **Verificación post-despliegue** integral
- ✅ **Comandos de mantenimiento** incluidos
- ✅ Geofencing activado

### **3. Seguridad de Infraestructura**
- ✅ Logs estructurados con rotación
- ✅ Límites de recursos definidos
- ✅ Health checks automáticos
- ✅ Reinicio automático de servicios

## 📊 **Monitoreo y Logs**

### **Logs de Aplicación**
```bash
# Logs del backend con timestamps
docker-compose -f docker-compose.prod.yaml logs -f --tail=100 backend

# Logs de base de datos
docker-compose -f docker-compose.prod.yaml logs -f --tail=50 postgres

# Logs de nginx (si está activo)
docker-compose -f docker-compose.prod.yaml logs -f nginx
```

### **Métricas de Salud**
```bash
# Health check general
curl http://cworker1.cticontrol.com/health

# Estado de contenedores
docker-compose -f docker-compose.prod.yaml ps

# Uso de recursos
docker stats --no-stream
```

## 🔄 **Actualización y Mantenimiento**

### **Actualizar Backend**
```bash
# Pull nueva imagen
docker pull javierm735/fichaje-backend-1:latest

# Recrear contenedor
docker-compose -f docker-compose.prod.yaml up -d --force-recreate backend
```

### **Backup de Base de Datos**
```bash
# Backup completo
docker exec fichaje_postgres_prod pg_dump -U postgres -C fichaje_cti > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup comprimido
docker exec fichaje_postgres_prod pg_dump -U postgres -C fichaje_cti | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### **Restaurar Base de Datos**
```bash
# Restaurar desde backup
docker exec -i fichaje_postgres_prod psql -U postgres -C fichaje_cti < backup_20240318_150000.sql

# Restaurar desde backup comprimido
gunzip -c backup_20240318_150000.sql.gz | docker exec -i fichaje_postgres_prod psql -U postgres -C fichaje_cti
```

## 🚨 **Troubleshooting Producción**

### **Problemas Comunes**

#### **1. Backend no conecta a BD**
```bash
# Verificar red
docker network inspect fichaje-prod-network

# Verificar conexión
docker exec fichaje_backend_prod ping postgres

# Verificar variables
docker exec fichaje_backend_prod env | grep DB_
```

#### **2. Alto uso de memoria**
```bash
# Ver uso de recursos
docker stats --no-stream

# Aumentar límites (editar docker-compose.prod.yaml)
deploy:
  resources:
    limits:
      memory: 2G  # Aumentar si es necesario
```

#### **3. Problemas de CORS**
```bash
# Verificar origen configurado
docker exec fichaje_backend_prod env | grep CORS_ORIGIN

# Probar CORS manualmente
curl -H "Origin: http://cworker1.cticontrol.com:3567" \
     http://localhost:3000/api/health
```

## 🌐 **URLs de Producción**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **API** | `http://cworker1.cticontrol.com:3000/api` | Backend principal |
| **Frontend** | `http://cworker1.cticontrol.com:3567` | Aplicación frontend |
| **pgAdmin** | `http://cworker1.cticontrol.com:5050` | Administración BD |
| **Health** | `http://cworker1.cticontrol.com/health` | Estado del sistema |
| **Nginx** | `http://cworker1.cticontrol.com` | Balanceo carga |

## 📋 **Checklist Pre-Despliegue**

- [ ] Variables de entorno configuradas
- [ ] Secrets JWT seguros generados
- [ ] Certificados SSL configurados (si es HTTPS)
- [ ] Límites de recursos definidos
- [ ] Backup strategy implementada
- [ ] Monitoreo configurado
- [ ] Firewall reglas aplicadas
- [ ] Dominio DNS apunta al VPS
- [ ] Espacio en disco suficiente

## 🎯 **Comandos Rápidos**

```bash
# Despliegue completo
docker-compose -f docker-compose.prod.yaml --env-file .env.production up -d

# Ver estado
docker-compose -f docker-compose.prod.yaml ps

# Ver logs
docker-compose -f docker-compose.prod.yaml logs -f

# Detener todo
docker-compose -f docker-compose.prod.yaml down

# Reiniciar servicios
docker-compose -f docker-compose.prod.yaml restart
```

### **4. Mantenimiento y Troubleshooting (docker run)**

#### **Problemas Comunes y Soluciones:**
docker ps | grep fichaje

# Ver logs del backend
docker logs fichaje_backend_prod --tail 20

# Ver logs de PostgreSQL
docker logs fichaje_postgres_prod --tail 10

# Probar API localmente
curl http://localhost:3000/api

# Probar login
curl -X POST http://cworker1.cticontrol.com:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'

# Verificar conexión a BD
docker exec fichaje_backend_prod ping postgres

# Verificar red Docker
docker network inspect fichaje-prod-network

# Verificar健康状态
curl -f http://localhost:3000/api/health || echo "Backend no responde"

# Verificar estado de contenedores
docker stats --no-stream | grep fichaje
```

**¡Configuración de producción lista para despliegue!** 🚀
