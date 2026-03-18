# 🚀 Guía de Despliegue en VPS - cworker1.cticontrol.com

## 📋 **Archivos Necesarios para Subir**

Sube estos archivos al VPS:
- `docker-compose.vps.yaml`
- `.env.vps`
- `docker-compose.yaml` (el principal)

## 🔧 **Comandos para Subir**

```bash
# Subir archivos específicos
scp docker-compose.vps.yaml usuario@cworker1.cticontrol.com:/home/usuario/fichaje_cti/
scp .env.vps usuario@cworker1.cticontrol.com:/home/usuario/fichaje_cti/
scp docker-compose.yaml usuario@cworker1.cticontrol.com:/home/usuario/fichaje_cti/

# O subir todo el proyecto
scp -r /ruta/completa/fichaje_cti usuario@cworker1.cticontrol.com:/home/usuario/
```

## 🚀 **Pasos en el VPS**

### **1. Conectar al VPS**
```bash
ssh usuario@cworker1.cticontrol.com
```

### **2. Navegar al directorio**
```bash
cd /home/usuario/fichaje_cti
```

### **3. Verificar archivos**
```bash
ls -la
# Deberías ver:
# - docker-compose.vps.yaml
# - .env.vps
# - docker-compose.yaml
```

### **4. Instalar Docker (si no está instalado)**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER

# Verificar instalación
docker --version
docker-compose --version
```

### **5. Limpiar contenedores anteriores**
```bash
docker-compose down -v
docker system prune -f
```

### **6. Desplegar en Producción**
```bash
# Usar el archivo de VPS
docker-compose -f docker-compose.vps.yaml --env-file .env.vps up -d
```

### **7. Verificar el despliegue**
```bash
# Ver contenedores
docker-compose -f docker-compose.vps.yaml ps

# Ver logs
docker-compose -f docker-compose.vps.yaml logs -f backend

# Ver logs de la base de datos
docker-compose -f docker-compose.vps.yaml logs -f db
```

### **8. Probar la aplicación**
```bash
# Probar localmente en el VPS
curl http://localhost:3000/api

# Probar login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## 🌐 **Acceso desde Externo**

Una vez desplegado, podrás acceder a:
- **API**: `http://cworker1.cticontrol.com:3000/api`
- **Login**: `http://cworker1.cticontrol.com:3000/api/auth/login`
- **Frontend**: `http://cworker1.cticontrol.com:3567`

## 🔒 **Configurar Firewall**

```bash
# Ubuntu (UFW)
sudo ufw allow 22    # SSH
sudo ufw allow 3000  # Backend
sudo ufw allow 3567  # Frontend
sudo ufw enable

# Verificar reglas
sudo ufw status verbose
```

## 🔄 **Comandos de Mantenimiento**

### **Reiniciar servicios**
```bash
docker-compose -f docker-compose.vps.yaml restart
```

### **Ver logs en tiempo real**
```bash
docker-compose -f docker-compose.vps.yaml logs -f --tail=50 backend
```

### **Actualizar la aplicación**
```bash
# Bajar la nueva imagen
docker pull javierm735/fichaje-backend:latest

# Reiniciar el contenedor
docker-compose -f docker-compose.vps.yaml up -d --force-recreate
```

### **Backup de la base de datos**
```bash
# Crear backup
docker-compose -f docker-compose.vps.yaml exec db pg_dump -U postgres fichaje_cti > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose -f docker-compose.vps.yaml exec -T db psql -U postgres fichaje_cti < backup_20240318.sql
```

## 🚨 **Troubleshooting**

### **Si los contenedores no inician**
```bash
# Verificar logs de errores
docker-compose -f docker-compose.vps.yaml logs

# Limpiar y reiniciar
docker-compose -f docker-compose.vps.yaml down -v
docker-compose -f docker-compose.vps.yaml up -d
```

### **Si no puedes conectar desde exterior**
```bash
# Verificar que el puerto está abierto
sudo netstat -tlnp | grep 3000

# Verificar firewall
sudo ufw status

# Probar conexión local
curl http://localhost:3000/api
```

### **Si hay problemas de CORS**
Verifica que `CORS_ORIGIN` en `.env.vps` coincida con el dominio desde donde accedes.

## 📊 **Monitoreo**

### **Script de salud**
```bash
#!/bin/bash
echo "=== Contenedores ==="
docker-compose -f docker-compose.vps.yaml ps

echo -e "\n=== API Health ==="
curl -f http://localhost:3000/api || echo "API DOWN"

echo -e "\n=== Database Health ==="
docker-compose -f docker-compose.vps.yaml exec db pg_isready -U postgres || echo "DB DOWN"
```

### **Configurar log rotation**
```bash
sudo nano /etc/logrotate.d/docker-compose
```

```
/home/usuario/fichaje_cti/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

## 🎯 **Verificación Final**

Ejecuta estos comandos para verificar que todo funciona:

```bash
# 1. Verificar contenedores
docker-compose -f docker-compose.vps.yaml ps

# 2. Verificar API
curl http://localhost:3000/api

# 3. Verificar desde exterior (desde tu máquina local)
curl http://cworker1.cticontrol.com:3000/api

# 4. Verificar logs
docker-compose -f docker-compose.vps.yaml logs -f backend
```

**¡Tu aplicación estará funcionando en producción en http://cworker1.cticontrol.com:3000!** 🎉
