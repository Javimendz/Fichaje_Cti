<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# FICHAJE-CTI - Sistema de Gestión de Presencia y Recursos

Este proyecto ha sido evolucionado a una arquitectura de Micro-contenedores, separando la infraestructura de la aplicación 
para permitir un despliegue profesional y escalable.

## Instalación y Configuración

# Clonar y entrar en la carpeta
  
```
  - git clone [url-del-repo]
  - cd Fichaday
  - yarn install

```

# Script para levantar la infraestructura

```
  - en una terminal como administrador, ejecutar el siguiente comando en la carpeta raiz del proyecto:

  - bash .\deploy.ps1 

  
```

-----------------------------------------------------




🚀 Guía Maestra de Despliegue: Fichaday v0.7
Esta guía configura un entorno profesional con aislamiento total entre Producción y Test.

1. Preparación de Terreno (Redes y Volúmenes)
Antes de meter los contenedores, necesitamos las "habitaciones" y los "baúles" de datos.

Bash
# Crear las redes (si no existen)
docker network create red_fichaje || true
docker network create test_network || true

# Crear los volúmenes para que los datos no se borren
docker volume create postgres_data_bbdd
docker volume create postgres_data_test
2. Capa de Datos: PostgreSQL (Imagen v0.7)
Usamos tu imagen personalizada. Separamos Producción en el puerto 5432 y Test en el 5433.

A. Base de Datos de Producción
Bash
docker run -d \
  --name postgres_bbdd \
  --network red_fichaje \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_bbdd:/var/lib/postgresql/data \
  -p 5432:5432 \
  javierm735/postgres_bbdd-0.7:latest
B. Base de Datos de Test
Bash
docker run -d \
  --name postgres_bbdd_test \
  --network test_network \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_test:/var/lib/postgresql/data \
  -p 5433:5432 \
  javierm735/postgres_bbdd-0.7:latest
3. Capa de Aplicación: Backend NestJS
Aquí es donde ocurre la magia de la sincronización de tablas. Asegúrate de tener tu archivo .env en la carpeta actual.

A. API de Producción
Bash
docker run -d \
  --name fichaday_backend \
  --network red_fichaje \
  --restart always \
  -e TYPEORM_SYNCHRONIZE=true \
  javierm735/fichaday-backend-0.22:latest

B. API de Test
Bash
docker run -d \
  --name fichaday_backend_test \
  --network test_network \
  --restart always \
  -e DB_HOST=postgres_bbdd_test \
  -e TYPEORM_SYNCHRONIZE=true \
  javierm735/fichaday-backend-0.21:latest

4. Capa de Acceso: Nginx Proxy (Doble Dominio)
Lanzamos el proxy inyectando la configuración para que no dependa de archivos externos en el VPS.

Nota: He escapado los símbolos \$ para que la terminal no los borre.

docker rm -f nginx_proxy

docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  nginx:1.25-alpine /bin/sh -c "echo 'events { worker_connections 1024; }
http {
    # PRODUCCIÓN
    server {
        listen 80;
        server_name fichaday.cticontrol.com;
        location /api/ {
            proxy_pass http://fichaday_backend:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        location / {
            proxy_pass http://fichaje-frontend:3000;
        }
    }
    # TEST
    server {
        listen 80;
        server_name fichadaytest.cticontrol.com;
        location / {
            proxy_pass http://fichaday_backend_test:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}' > /etc/nginx/nginx.conf && nginx -g \"daemon off;\""


Unir los cables finales:
Bash
# 1. Conectar Frontend a la red (si no estaba)
docker network connect red_fichaje fichaje-frontend || true
## docker network connect test_network pgadmin_bbdd || true    Conectar pgadmin a la misma red de prueba
# 2. Conectar Proxy a la red de Test
docker network connect test_network nginx_proxy

# 3. Reiniciar para aplicar
docker restart nginx_proxy
5. Verificación y Limpieza
Una vez ejecutado todo, sigue estos pasos para asegurar un entorno profesional:

------------------
Pasos cuando falla el nginx

# 1. Borramos el proxy actual
docker rm -f nginx_proxy

# 2. Lo levantamos con la configuración corregida
# 1. Borramos el proxy con el error

# 1. Descargar la imagen que acabas de subir
docker pull javierm735/nginx_proxy:latest

# 2. Fulminar el proxy antiguo si seguía corriendo
docker rm -f nginx_proxy

# 3. Levantar el nuevo contenedor en la red de producción
docker run -d --name nginx_proxy --network red_fichaje --restart always -p 80:80 -p 443:443 javierm735/nginx_proxy-0.03:latest


# 4. Enchufarle la red de test del VPS
docker network connect test_network nginx_proxy

# 1. Borramos el proxy con el nombre incorrecto
docker rm -f nginx_proxy

# 2. Levantamos el proxy con los nombres EXACTOS para Front y Back
docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  nginx:1.25-alpine /bin/sh -c "echo 'worker_processes auto;
events { worker_connections 2048; }
http {
    include       mime.types;
    default_type  application/octet-stream;
    
    resolver 127.0.0.11 valid=30s;

    # ==========================================
    # 🌍 SERVIDOR PRODUCCIÓN (fichaday.cticontrol.com)
    # ==========================================
    server {
        listen 80;
        server_name fichaday.cticontrol.com;

        # API apunta al backend de prod
        location /api/ {
            set \$backend_prod \"http://fichaday_backend:3000\";
            proxy_pass \$backend_prod;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        }

        # La raíz apunta al frontend de prod
        location / {
            set \$frontend_prod \"http://fichaje-frontend-prod:3000\";
            proxy_pass \$frontend_prod;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }

    # ==========================================
    # 🧪 SERVIDOR TEST (fichadaytest.cticontrol.com)
    # ==========================================
    server {
        listen 80;
        server_name fichadaytest.cticontrol.com;

        # La raíz apunta al frontend de test
        location / {
            set \$frontend_test \"http://fichaje-frontend-test:3000\";
            proxy_pass \$frontend_test;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }

        # API apunta al backend de test
        location /api/ {
            set \$backend_test_api \"http://fichaday_backend_test:3000\";
            proxy_pass \$backend_test_api;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}' > /etc/nginx/nginx.conf && nginx -g \"daemon off;\""

# 3. Conectamos la red de test
docker network connect test_network nginx_proxy

# 3. Lo conectamos a la red de test para que vea ese backend también
docker network connect test_network nginx_proxy
docker restart nginx_proxy




Check de Tablas: Mira los logs del backend (docker logs fichaday_backend). Si ves que NestJS ha terminado de arrancar sin errores de "relation users not exist", las tablas se han creado con éxito.

Seguridad: Ahora que las tablas existen, es recomendable recrear los backends con TYPEORM_SYNCHRONIZE=false para evitar desastres accidentales en el futuro.

Radiografía:

docker ps: Debes ver los 5-6 contenedores en Up.

docker network inspect red_fichaje: Debes ver a Nginx, el Front, el Backend de Prod y su DB.







### Servicio para Email
https://app.brevo.com/transactional/email/logs 



----------------------------------------------------



# Crear la red necesaria para la comunicación entre servicios

```
  - docker network create red_fichaje

```

Variables de Entorno:

  Configurar los archivos .env en sus respectivas carpetas siguiendo los archivos .template:

```
    - backend/.env.backend

    - infra/bbdd/.env.bbdd
```

Levantar Infraestructura (Base de Datos):

```
    Bash
    - cd infra/bbdd
    - docker compose --env-file .env.bbdd up -d
```

Levantar Aplicación (Backend):

```
    Bash
    - cd ../../backend
    - docker compose --env-file .env.backend up -d --build
```

Levantar Proxy (Nginx):
  
  Asegúrate de liberar el puerto 80 (net stop http en Windows Admin).
```
Bash
  
   - cd ../infra/proxy
   - docker compose up -d
```

Despliegue en Producción (VPS)
Para producción, utilizamos un flujo de Integración Continua basado en Docker Hub para evitar compilar en el servidor y ahorrar recursos.

1. Preparación y Subida (Local)
  
  Bash
# Iniciar sesión en Docker Hub

```
  - docker login

```

# Construir y subir la imagen (Backend)

```
  - cd backend
  - docker build -t tu_usuario/fichaday-backend:latest .       (javierm735)
  - docker push tu_usuario/fichaday-backend:latest
```
2. Puesta en marcha (VPS)

En el servidor, no clonamos todo el código, solo necesitamos los archivos de configuración (docker-compose.yaml y .env):

Bash
# Crear red y descargar imagen

  - docker network create red_fichaje
  # para el contenedor de prueba red
  
  - docker network create test_network

  - docker pull tu_usuario/fichaday-backend:latest

# Levantar servicios

# Levantar bbdd

```
docker run -d \
  --name postgres_bbdd  \
  --network red_fichaje \
  --restart always \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl  \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_bbdd:/var/lib/postgresql/data \
  -p 5432:5432 \
  javierm735/postgres_bbdd-0.8:latest

## Segundo contenedor

docker run -d \
  --name postgres_bbdd_test \
  --network test_network \
  --restart always \
  -e TYPEORM_SYNCHRONIZE=false \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=Jp10.Mnl \
  -e POSTGRES_DB=fichaje_cti \
  -v postgres_data_test:/var/lib/postgresql/data \
  -p 5433:5432 \
  javierm735/postgres_bbdd-0.8:latest

```



# Permisos necesarios para ejecutar el .env.prod

```
docker run -d \
  --name fichaday-backend01 \
  --network red_fichaje \
  --restart always \
  --env-file .env.prod \
  javierm735/fichaday-backend01:latest

```

# Sin permisos ejecuto todo el comando

```

# 1. Borramos el que está fallando
docker rm -f fichaday-backend01 || true

# 2. Lanzamos el nuevo con las variables corregidas

docker run -d \
  --name fichaday_backend \
  --network red_fichaje \
  --restart always \
  -e DB_HOST=postgres_bbdd \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Jp10.Mnl  \
  -e DB_NAME=fichaje_cti \
  -e DB_PORT=5432 \
  -e NODE_ENV=development \
  -e PORT=3000 \
  -e CORS_ORIGIN=* \
  -e TZ=Europe/Madrid \
  -e JWT_SECRET=tu_secreto_para_access \
  -e JWT_REFRESH_SECRET=tu_secreto_para_refresh \
  -e JWT_ADMIN_EXPIRATION=24h \
  -e JWT_WORKER_EXPIRATION=1h \
  -e JWT_ADMIN_EXP_HOURS=24 \
  -e JWT_WORKER_EXP_HOURS=1 \
  -e JWT_REFRESH_EXPIRATION=7d \
  -e SEED_SECRET_KEY=123 \
  -e MAX_FICHAR_DISTANCE=600 \
  -e DEFAULT_DAYS_ISSUES=5 \
  -e DEFAULT_DAYS_REQUESTS=15 \
  javierm735/fichaday-backend-0.22:latest  


## Contenedor de prueba

docker run -d \
  --name fichaje_backend_test \
  --network test_network \
  --restart always \
  -e DB_HOST=postgres_bbdd \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Jp10.Mnl  \
  -e DB_NAME=fichaje_cti \
  -e DB_PORT=5432 \
  -e NODE_ENV=development \
  -e PORT=3000 \
  -e CORS_ORIGIN=* \
  -e TZ=Europe/Madrid \
  -e JWT_SECRET=tu_secreto_para_access \
  -e JWT_REFRESH_SECRET=tu_secreto_para_refresh \
  -e JWT_ADMIN_EXPIRATION=24h \
  -e JWT_WORKER_EXPIRATION=1h \
  -e JWT_ADMIN_EXP_HOURS=24 \
  -e JWT_WORKER_EXP_HOURS=1 \
  -e JWT_REFRESH_EXPIRATION=7d \
  -e SEED_SECRET_KEY=123 \
  -e MAX_FICHAR_DISTANCE=600 \
  -e DEFAULT_DAYS_ISSUES=5 \
  -e DEFAULT_DAYS_REQUESTS=15 \
  javierm735/fichaday-backend-0.20:latest  

# 1. Borramos el backend que está en el bucle de error
docker rm -f fichaday_backend

# 2. Lo lanzamos con el DB_HOST correcto
docker run -d \
  --name fichaday_backend \
  --network red_fichaje \
  --restart always \
  -p 3000:3000 \
  -e DB_HOST=postgres_bbdd \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Jp10.Mnl \
  -e DB_NAME=fichaje_cti \
   -e DB_PORT=5432 \
  -e NODE_ENV=development \
  -e PORT=3000 \
  -e CORS_ORIGIN=* \
  -e TZ=Europe/Madrid \
  -e JWT_SECRET=tu_secreto_para_access \
  -e JWT_REFRESH_SECRET=tu_secreto_para_refresh \
  -e JWT_ADMIN_EXPIRATION=24h \
  -e JWT_WORKER_EXPIRATION=1h \
  -e JWT_ADMIN_EXP_HOURS=24 \
  -e JWT_WORKER_EXP_HOURS=1 \
  -e JWT_REFRESH_EXPIRATION=7d \
  -e SEED_SECRET_KEY=123 \
  -e MAX_FICHAR_DISTANCE=600 \
  -e DEFAULT_DAYS_ISSUES=5 \
  -e DEFAULT_DAYS_REQUESTS=15 \
  javierm735/fichaday-backend-0.13:latest  

----

docker run -d \
  --name fichaday_backend \
  --network red_fichaje \
  --restart always \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=mypass \
  -e DB_NAME=fichaje_cti \
  -e DB_PORT=5432 \
  -e NODE_ENV=development \
  -e PORT=3000 \
  -e CORS_ORIGIN=* \
  -e TZ=Europe/Madrid \
  -e JWT_ADMIN_EXPIRATION=24h \
  -e JWT_WORKER_EXPIRATION=2h \
  -e JWT_ADMIN_EXP_HOURS=24 \
  -e JWT_WORKER_EXP_HOURS=2 \
  -e JWT_REFRESH_EXPIRATION=7d \
  -e SEED_SECRET_KEY=123 \
  -e MAX_FICHAR_DISTANCE=600 \
  -e DEFAULT_DAYS_ISSUES=5 \
  -e DEFAULT_DAYS_REQUESTS=15 \
  javierm735/fichaday_backend00:latest






```

```
PGADMIN

# 1. Borramos cualquier rastro
docker rm -f nginx_proxy

# 2. Lanzamos vinculando el archivo específico del volumen

docker network connect test_network nginx_proxy


docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  -v nginx_config_vol:/etc/nginx/configs \
  nginx:1.25-alpine nginx -g 'daemon off;' -c /etc/nginx/configs/nginx.conf



# Lanzar sin nginx

```
docker run -d \
  --name fichaday-backend-nginx \
  --network red_fichaje \
  --restart always \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=Jp10.Mnl \
  -e DB_NAME=fichaje_cti \
  -e NODE_ENV=production \
  -e JWT_SECRET=un_secreto_seguro \
  javierm735/fichaday-backend-0.22:latest


usar este sino


# 1. Borramos el proxy actual
docker rm -f nginx_proxy

# 2. Lanzamos la configuración que mantiene el prefijo /api
docker run -d \
  --name nginx_proxy \
  --network red_fichaje \
  -p 80:80 \
  nginx:1.25-alpine /bin/sh -c "echo 'events { worker_connections 1024; }
http {
    server {
        listen 80;
        location / {
            proxy_pass http://fichaje-frontend:3000;
            proxy_set_header Host \$host;
        }
        location /api/ {
            proxy_pass http://fichaday_backend:3000;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}' > /etc/nginx/nginx.conf && nginx -g \"daemon off;\""


```

  - docker compose up -d

# Conextar PGADMIN

  ```
    http://57.129.139.212:5050/

    Entra con admin@cticontrol.com y la clave admin123

```
  
dddd
3. Dependencias necesarias (Dentro de directorio ```backend```):

```Bash
yarn add cors @nestjs/schedule @nestjs/platform-socket.io @nestjs/websockets cookie-parser class-validator class-transformer
yarn add -D @types/cookie-parser @nestjs/config
yarn add date-holidays
yarn add @nestjs/throttler
```
4. Levantar Infraestructura (Base de Datos):

```Bash
docker-compose up -d
```

5. Levantar Aplicación:

```Bash
yarn start:dev

```

**app.module.ts / dropSchema:** **`true`** — Poner a **`false`** para no borrar la BBDD.



# Flujo de Trabajo (Workflow)

**Inicializar**: Ejecutar Seed para crear el SuperAdmin.

**Estructura**: Login SuperAdmin -> Crear Empresa y su Admin.

**Planificación**: Login Admin -> Crear Horario (Schedule).

**Personal**: Admin da de alta Trabajador -> Asignar Horario a Trabajador.

**Operativa**: Login Trabajador -> Check-in / Check-out.

**Gestión**: Crear Solicitudes/Incidencias -> Admin Aprueba/Resuelve.








# Endpoints - Completos


```
SEED/LOGIN
🛠️ Método	   📍 Endpoint	              📝 Descripción	                               📦 Requerimientos / Body
POST          /api/seeds/run              Inicializa el SuperAdmin y datos base.                Header: x-seed-key
POST          /api/auth/login             Inicio de sesión para todos los roles.                "{ email, password }"
POST          /api/auth/logout            Cierra sesión y revoca token.                         Token (Cualquiera)
GET           /api/auth/me                Obtiene información del usuario autenticado.          Token (Cualquiera)
Post          /api/auth/refresh           Actualiza el token de acceso usando el refresh token. Token (Cualquiera)

```

```


EMPRESA (COMPANY)
🛠️ Método         📍 Endpoint                  📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/empresa/crear-empresa          Setup Inicial: Crea empresa + Admin principal.       Token (SUPERADMIN) + Body: 
GET         /api/empresa/list-empresas          Lista todas las empresas (con auditoría).            Token (SUPERADMIN/ADMIN)
GET         /api/empresa/find/:id               Obtiene detalles de una empresa específica.          Token (SUPERADMIN)
PUT         /api/empresa/update/:id             Actualiza datos de geolocalización o razón social.   Token (SUPERADMIN) + Body
DELETE      /api/empresa/delete/:id             Elimina la empresa y sus datos vinculados.           Token (SUPERADMIN)
PUT         /api/empresa/settings/archive     Configura días para archivar solicitudes e incidencias Token (SUPERADMIN) + Body: { daysArchiveRequests : DIAS, daysArchiveIssues : DIAS}

```


```
USERS (USUARIOS)
🛠️ Método       📍 Endpoint                    📝 Descripción                                       📦 Requerimientos / Auth
POST             /api/users/crear-user          Crea un usuario (Admin o Worker).                    Token (SUPERADMIN/ADMIN) + Body
GET              /api/users/list-users          Lista todos los usuarios (según permisos).           Token (SUPERADMIN/ADMIN)
GET              /api/users/find/:id            Busca un usuario específico por su ID.               Token (SUPERADMIN/ADMIN)
PUT              /api/users/update/:id          Actualiza los datos de un usuario.                   Token (ADMIN) + Body: UpdateUserDto
DELETE           /api/users/delete/:id          Elimina un usuario (Borrado lógico).                 Token (ADMIN)

```

```
WORKER
🛠️ Método	     📍 Endpoint	                     📝 Descripción	                                📦 Requerimientos / Body
POST             /api/worker/crear-worker           Registra/Pre-autoriza un nuevo trabajador.     Token (ADMIN) + Body
GET              /api/worker/list-workers           Lista todos los trabajadores de la empresa.    Token (ADMIN) + Body
GET              /api/worker/find/:id               Obtiene la ficha de un trabajador.             Token (ADMIN/WORKER)
PUT              /api/worker/update/:id             Actualiza información del trabajador.          Token (ADMIN) + Body
DELETE           /api/worker/delete/:id             Borra un trabajador autorizado.                Token (ADMIN)
PUT              /api/worker/assign-schedule/:id    Asignar Horario: Vincula horario a trabajador. Token (ADMIN) + Body

```


```
SOLICITUDES (REQUESTS)
🛠️ Método      📍 Endpoint                        📝 Descripción                                      📦 Requerimientos / Auth
POST            /api/request/crear-request         Crea una nueva solicitud (Permisos, Bajas, etc.).    Token (ADMIN/WORKER) + Body
PUT             /api/request/check/:id             Aprueba o rechaza una solicitud específica.          Token (ADMIN) + Body
GET             /api/request/company-request       Lista todas las solicitudes de la empresa.           Token (ADMIN)
GET	            /api/request/find/:id	             Obtiene el detalle de una solicitud específica por su ID.	Token (ADMIN/WORKER)
PATCH	          /api/request/edit-request/:id	     Permite al trabajador modificar una solicitud pendiente.	Token (WORKER) + Body
GET             /api/request/historial             Obtiene el historial de solicitudes de la empresa.    Token (ADMIN) + Query: ?estado=APROBADA|RECHAZADA
GET     /api/request/historial??estado=APROBADA|RECHAZADA  Obtiene el historial de solicitudes de la empresa por estado.    Token (ADMIN) + Query: ?
GET             /api/request/my-request             Obtiene todas las solicitudes del trabajador autenticado.    Token (WORKER)
GET             /api/request/user/:userId          Lista todas las solicitudes de un trabajador específico.    Token (ADMIN) + Param: :userId
```

```
HORARIOS (SCHEDULES)
🛠️ Método     📍 Endpoint                          📝 Descripción                                       📦 Requerimientos / Auth
POST           /api/schedule/crear-schedule          Crea un nuevo horario (Planificación base).          Token (ADMIN) + Body
GET            /api/schedule/list-schedules          Lista los horarios de la empresa con sus franjas.    Token (ADMIN/WORKER)
GET            /api/schedule/find/:id                Busca los detalles de un horario por su ID.          Token (ADMIN/WORKER)
DELETE         /api/schedule/delete/:id              Elimina un horario completo del sistema.             Token (ADMIN)
PUT	           /api/schedule/editar/:id	             Actualiza un horario existente por su ID.	          Token (ADMIN) + Body
GET            /api/schedule/stats/objetivo          Horas objetivo filtradas por la semana actual.  Token (ADMIN/WORKER)
GET            /api/schedule/stats/real              Obtiene las horas que el trabajador lleva trabajadas.Token (ADMIN/WORKER)
GET            /api/schedule/stats/progreso          Obtiene el % de cumplimiento semanal (Real vs Objetivo).Token (ADMIN/WORKER)
GET            /api/schedule/stats/progreso/:userId  Consulta el progreso de cualquier trabajador por su  ID.Token (ADMIN) 
GET            /api/schedule/test-rotacion           Simula y calcula a qué semana de rotación pertenece. Token (ADMIN) + Querys: ?fechaInicio=2026-03-09&fechaPrueba=2026-03-23&ciclo=2
GET            /api/schedule/turno-hoy                Devuelve el turno exacto de HOY calculando la rotación.       Token (Cualquiera)
```

```
LEAVES (VACACIONES Y PERMISOS)
🛠️ Método     📍 Endpoint                           📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/leaves/range                        Crea permisos en un rango de fechas (Vacaciones).    Token (ADMIN) + Body
GET         /api/leaves/my-leaves                    Lista los permisos aprobados del usuario actual.     Token (ADMIN/WORKER)
GET         /api/leaves/user/:id                     Lista los permisos de un trabajador específico.      Token (ADMIN)

```

```
FRANJAS HORARIAS (TIME SLOTS)
🛠️ Método    📍 Endpoint                            📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/franja-horaria/crear                Crea una franja (valida solapamientos y empresa).     Token (ADMIN) + Body
GET         /api/franja-horaria/list-franja-horaria  Lista todas las franjas de la empresa.                Token (ADMIN/WORKER)
GET         /api/franja-horaria/find/:id             Busca una franja específica por ID.                   Token (ADMIN/WORKER)
PUT         /api/franja-horaria/update/:id           Actualiza horas de una franja existente.              Token (ADMIN) + Body
DELETE      /api/franja-horaria/delete/:id           Elimina una franja del sistema (con Auditoría).       Token (ADMIN)
GET         /api/franja-horaria/by-schedule/:id      Lista las franjas vinculadas a un horario (Schedule). Token (ADMIN/WORKER)

```

```
JORNADAS (WORKDAYS)
🛠️ Método  📍 Endpoint                            📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/jornada/check-in                  Inicia una jornada (evalúa retraso y zona GPS).      Token (Cualquiera) + Body
PUT         /api/jornada/check-out                 Finaliza jornada activa (evalúa salida anticipada).  Token (Cualquiera) + Body
GET         /api/jornada/status                    Indica si el usuario tiene una jornada abierta.      Token (Cualquiera)
GET         /api/jornada/historial                 Devuelve todas las jornadas del usuario actual.      Token (Cualquiera)
GET         /api/jornada/rango?desde=X&hasta=Y     Filtra jornadas del usuario en un rango de fechas.   Token (Cualquiera) + Query params
GET         /api/jornada/dashboard/resumen         Dashboard en tiempo real de la empresa de hoy.       Token (ADMIN)
GET         /api/jornada/dashboard/stats            Estadísticas de trabajo del trabajador.              Token (ADMIN/WORKER)
GET         /api/jornada/worker/:id/stats           Estadísticas de trabajo de cualquier trabajador.     Token (ADMIN)

```


```
ASISTENCIAS (ATTENDANCE)
🛠️ Método  📍 Endpoint                              📝 Descripción                                       📦 Requerimientos / Auth
POST        /api/asistencia/crear-asistencia         Registra entrada/ausencia simple (con motivo).        Token (ADMIN/WORKER) + Body
GET         /api/asistencia/my-history               Historial personal de asistencias del usuario.        Token (ADMIN/WORKER)
GET         /api/asistencia/empresa                  Historial global de todos los empleados de la empresa.Token (ADMIN)
GET         /api/asistencia/user/:id                 Consulta el historial de un trabajador específico.    Token (ADMIN)
GET         /api/asistencia/list/:id	               Historial de fichajes de un trabajador específico.	   Token (ADMIN) + Param: :id
```

```
ALARMAS (ALARMS)
🛠️ Método  📍 Endpoint                              📝 Descripción                                      📦 Requerimientos / Auth
GET         /api/alarmas/pendientes                  Lista todas las alertas sin revisar de la empresa.   Token (ADMIN)
PUT         /api/alarmas/revisar/:id                 Marca una alarma como leída de forma rápida.         Token (ADMIN)
PUT        /api/alarmas/resolver/:id                Resuelve una alarma añadiendo una nota de gestión.   Token (ADMIN) + Body: { nota: string }
GET         /api/alarmas/user/:userId                Lista todas las alertas de un trabajador específico.    Token (ADMIN) + Param: :userId


```

```
🔐 AUTENTICACIÓN DE TRABAJADORES (WORKER AUTH)

🛠️ Método,  📍 Endpoint,                            📝 Descripción,                        📦 Requerimientos / Auth
POST,       /api/worker-auth/company-config-login,   Login para acceder al modo configuración (zona privada).,"Throttler (Público) + Body: { empresaId, password }"
POST,       /api/worker-auth/activate-pin,           Activa el PIN de un trabajador para habilitar su acceso.,Token (Admin/Config) + Body: { dni: string }
POST,       /api/worker-auth/login-pin,           Login rápido para trabajadores mediante PIN de 6 dígitos.,Throttler (Público) + Body: { pin: string }
PUT,       /api/worker-auth/regenerate-pin,       Resetea el PIN de un trabajador y lo activa automáticamente.,Token (Admin/Config) + Body: { dni: string }


```

```
🛠️ Método	📍 Endpoint	                     📝 Descripción	                                                      📦 Requerimientos / Auth
POST	      /api/actividades/crear	         Crea un nuevo puesto (ej: Ingeniero, Operario).	                     Token (ADMIN) + Body
PUT	        /api/actividades/editar/:id	     Modifica nombre, descripción o tipo de un puesto.	                   Token (ADMIN) + Body
DELETE	    /api/actividades/delete/:id	     Borrado de la actividad. Los usuarios asociados pasan a actividadId=null	Token (ADMIN) + Param: id
GET	      /api/actividades/catalogo  	       Lista de puestos de la empresa (Filtrable por soloActivas).	         Token (ADMIN / WORKER)
GET	      /api/actividades/:id	             Obtiene el detalle de un puesto y sus trabajadores asignados.
GET	      /api/actividades/user/:id          Cuenta trabajadores asignados a ese puesto.	                        Token (ADMIN) + Param: :id
GET       /api/actividades/list/:id          Lista todos los trabajadores asignados a ese puesto.	                Token (ADMIN) + Param: :id
```

```
⏱️ 2. Módulo de Fichajes y Jornadas (SiteLogService)

🛠️ Método,  📍 Endpoint,                 📝 Descripción,           📦 Requerimientos / Auth
POST,         /api/site-logs/check-in,    Registra la entrada en una obra (Valida GPS).,"Token (WORKER) + Body (coords, time)"
PUT,          /api/site-logs/check-out/:id,"Registra la salida, calcula horas y resta descansos.","Token (WORKER) + Body (coords, notas)"
POST,         /api/site-logs/start-break/:id,Pausa el tiempo de trabajo (Hora del bocadillo/comida).,Token (WORKER)
POST,         /api/site-logs/end-break/:id,Reanuda el tiempo de trabajo.,Token (WORKER)
GET,          /api/site-logs/my-history,Devuelve el historial de fichajes del propio trabajador.,Token (WORKER)
GET,          /api/site-logs/active/:siteId,Muestra quién está trabajando ahora mismo en la obra.,Token (ADMIN)
PUT,          /api/site-logs/admin-update/:id,"El jefe corrige un fichaje manualmente (olvidos, errores).",Token (ADMIN) + Body (fechas)
GET,          /api/site-logs/report/:userId,Saca el total de horas trabajadas para la nómina mensual.,Token (ADMIN) + Query (fechas)

```

```
  🚨 3. Módulo de Incidencias (IssueSiteService)

🛠️ Método,      📍 Endpoint,          📝 Descripción,                 📦 Requerimientos / Auth
POST,         /api/site-issues,"El trabajador reporta una rotura, falta material, etc.",Token (WORKER/ADMIN) + Body
GET,          /api/site-issues/site/:siteId,Lista todas las incidencias de una obra concreta.,Token (ADMIN)
PUT,          /api/site-issues/assign/:id,El jefe asigna la incidencia a un operario para arreglarla.,Token (ADMIN) + Body: { assignedToId }
GET,          /api/site-issues/my-tasks,El trabajador ve qué incidencias le han mandado arreglar.,Token (WORKER)
PUT,          /api/site-issues/resolve/:id,Cierra la incidencia añadiendo una nota de cómo se arregló.,Token (WORKER/ADMIN) + Body (notas)

```

```
🌴 4. Módulo de Ausencias y Vacaciones (AbsenceService)
🛠️ Método,      📍 Endpoint,            📝 Descripción,               📦 Requerimientos / Auth
POST,         /api/absences,"Solicita vacaciones, baja médica o día libre.","Token (WORKER) + Body (fechas, tipo)"
GET,          /api/absences/my-absences,El trabajador revisa el estado de sus solicitudes.,Token (WORKER)
GET,          /api/absences/pending,El administrador ve todas las peticiones sin responder.,Token (ADMIN)
PATCH,        /api/absences/:id/status,El jefe Aprueba o Rechaza la solicitud de ausencia.,Token (ADMIN) + Body (APPROVED/REJECTED)


```

```
🏗️ 5. Módulo de Obras (SiteService)

🛠️ Método,        📍 Endpoint,          📝 Descripción,         📦 Requerimientos / Auth
POST,         /api/sites,Crea una obra nueva con coordenadas GPS y radio permitido.,Token (ADMIN) + Body
GET,          /api/sites,Lista las obras activas de la empresa.,Token (ADMIN / WORKER)
PUT,          /api/sites/:id,"Edita los datos de la obra (cambiar el radio, dirección).",Token (ADMIN) + Body


```




```

🛠️ Método	 📍 Endpoint	                     📝 Descripción	                                             📦 Requerimientos / Auth
POST	       /api/incidencias/crear	           Reporta una nueva incidencia (Anti-spam 15 min).	            Token (ADMIN / WORKER) + Body
GET	         /api/incidencias/mis-incidencias	 Historial personal de incidencias reportadas por el usuario.	Token (ADMIN / WORKER)
GET	         /api/incidencias/empresa	         Panel del admin para ver incidencias (Filtrable por pendientes).	Token (ADMIN)
PUT	         /api/incidencias/resolver/:id	   Marca una incidencia como solucionada/resuelta.	            Token (ADMIN)
DELETE	     /api/incidencias/delete/:id	     Elimina un reporte de incidencia (Solo si es de su empresa).	Token (ADMIN) 
PUT	         /api/incidencias/edit-incidencia/:id	Edita una incidencia reportada (Solo si es de su empresa).Token (ADMIN / WORKER) + Body
GET          /api/incidencias/pendientes           Lista incidencias ocultas (Solo Admin).	                    Token (ADMIN)
GET          /api/incidencias/mis-tramitadas       Obtiene todas las incidencias tramitadas (resueltas) de la empresa.    Token (WORKER)
GET          /api/incidencias/mis-pendientes      Obtiene todas las incidencias pendientes de la empresa.    Token (WORKER)
GET	         /api/incidencias/user/:userId	   Lista incidencias de un trabajador específico.	              Token (ADMIN) + Param: :userId  

```


# Endpoints - Alguna funcionalidad.




1. Inicialización y Seguridad (Seed & Auth)


1.1 Ejecutar Seed (Inicialización)
Método: ```POST```

Endpoint:``` /api/seeds/run ```

Descripción: ```Crea los datos básicos iniciales y el SuperAdmin en la base de datos.```

```
POST  -  http://localhost:3000/api/seeds/run

Headers - KEY: x-seed-key - VALUE: 123
Body - none

```

1.2 Inicio de Sesión (Login SuperAdmin)


Método: ```POST```

Endpoint:``` /api/auth/login ```

Descripción: ```Obtención del Bearer Token para SuperAdmin.```

```
POST  -  http://localhost:3000/api/auth/login

Body - Json

{
  "email": "superadmin@cti.com",
  "password": "superpassword123M"
}

```


1 Renovación de Token (Refresh Token)

Método: ```POST```

Endpoint: ```/api/auth/refresh```

Descripción: ```Obtención de un nuevo par de tokens (Access y Refresh) rotando el token anterior para mantener la sesión activa sin volver a pedir credenciales.```

```

Plaintext
POST  -  http://localhost:3000/api/auth/refresh

Body - Json

{
  "userId": 1,
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsInJvb..."
}

```

1.3 Inicio de Sesión (Login Admin)


Método: ```POST```

Endpoint:``` /api/auth/login ```

Descripción: ```Obtención del Bearer Token para Administradores de empresa.```

```
POST  -  http://localhost:3000/api/auth/login

Body - Json

{
    "email": "marta.admin@globaltech.com",
    "password": "SecurePassword2026!"
}

```


Bloque 1: Fichajes Avanzados (SiteLog)
Vamos a probar las validaciones duras y el modo offline. Usa el Token del Trabajador.

1. Modo Offline (Timestamp del Cliente con Desfase):
Simularemos que el trabajador fichó hace 2 horas pero acaba de recuperar el internet.

```

POST /api/site-logs/check-in

Body:

JSON
{
  "siteId": 1, 
  "latitude": 40.4167, 
  "longitude": -3.70325,
  "clientTimestamp": "2026-04-22T10:00:00Z" 
}
Verifica: Que el servidor acepta el fichaje pero el checkIn refleja la hora de las 10:00:00, NO la hora real de tu reloj.

```

2. Geofencing en el Check-Out (Intentar engañar al sistema):
Anota el id del fichaje anterior. Vamos a intentar fichar la salida desde casa (coordenadas falsas).

```
PUT /api/site-logs/check-out/ID_DEL_LOG

Body:

JSON
{
  "latitude": 40.8000, 
  "longitude": -4.0000,
  "clientTimestamp": "2026-04-22T18:00:00Z"
}
Verifica: El sistema debería dar un error (ej. 400 Bad Request) avisando de que "Estás fuera del radio de la obra".


```


🚨 Bloque 2: Gestión Total de Incidencias (IssueSite)
Vamos a probar el flujo completo con evidencias y asignaciones.

1. Crear Incidencia con Evidencia Fotográfica:

```
Token: Trabajador.

POST /api/site-issues

Body:

JSON
{
  "siteId": 1,
  "description": "Cableado eléctrico expuesto en pasillo principal.",
  "severity": "CRITICAL",
  "evidenceUrl": "https://imgur.com/foto-falsa.jpg",
  "type": "SAFETY"
}
Verifica: Anota el ID de la incidencia que te devuelve.

```
2. Asignar la Incidencia a un Trabajador Específico:

Token: Administrador.

```
PUT /api/site-issues/assign/ID_INCIDENCIA

Body:

JSON
{
  "assignedToId": 527 
}

```
3. Resolver Incidencia con Notas:

Token: Trabajador (el 527 que acaba de recibir la tarea).

 ``` 
PUT /api/site-issues/resolve/ID_INCIDENCIA

Body:

JSON
{
  "resolutionNote": "Cables aislados y cuadro eléctrico cerrado con llave.",
  "status": "RESOLVED"
}
📊 Bloque 3: Reportes y CRUD Faltante (Solo Administrador)
Vamos a probar los métodos analíticos y correctivos. Usa el Token del Administrador.
```


1. Reporte de Nóminas (Horas Totales del Trabajador):

```
GET /api/site-logs/report/527?startDate=2026-04-01&endDate=2026-04-30

Verifica: Debería devolverte un JSON con el sumatorio de los totalSeconds o totalHours del trabajador en ese mes.

```
2. Corrección Manual de Fichaje (UPDATE):
Simulamos que el Admin ajusta un fichaje porque el trabajador se olvidó el móvil.

```
PUT /api/site-logs/admin-update/ID_DEL_LOG (Usa el ID de un log cerrado)

Body:

JSON
{
  "checkIn": "2026-04-22T08:00:00Z",
  "checkOut": "2026-04-22T17:00:00Z",
  "isManual": true,
  "notes": "Corrección manual por olvido de dispositivo."
}

```
3. Dashboard Global (Trabajadores Activos):
Saber quién está en la obra ahora mismo.

```
GET /api/site-logs/active/1 (Para la obra 1)

Verifica: Debería devolverte una lista solo con los fichajes que tienen checkOut: null.

⏰ Bloque 4: Cierre Forzado (Cron Job)
Esta es la funcionalidad más difícil de probar directamente desde Postman porque depende del reloj del servidor.

```
Para probarlo: Tendrás que crear un endpoint temporal en tu controlador (ej. @Post('force-cron')) que llame manualmente a tu función autoCheckOut().

Si haces el POST a ese endpoint, buscará todos los logs de más de 12 horas y los cerrará marcando wasAutoClosed: true




1.4 Inicio de Sesión (Login Worker)


Método: ```POST```

Endpoint:``` /api/auth/login ```

Descripción: ```Obtención del Bearer Token para Trabajadores.```

```
POST  -  http://localhost:3000/api/auth/login

Body - Json

{
    "dni": "12345678Z", 
    "password": "contraseña123M"
}


```


2. Gestión de Empresas (Exclusivo SuperAdmin)


2.1 Setup Inicial (Crear Empresa + Admin Principal)
Método: ```POST```

Endpoint:``` /api/empresa/crear-empresa ```

Descripción: ```Crea la entidad empresa y vincula a su primer administrador.```

```
POST  -  http://localhost:3000/api/empresa/crear-empresa

Token - SuperAdmin
Body - Json

{
  "nombreEmpresa": "Global Tech Logistics S.A.",
  "cif": "A87654321",
  "direccion": "Avenida Central 100, Planta 5",
  "poblacion": "Barcelona",
  "provincia": "Barcelona",
  "pais": "España",
  "email": "ops@globaltech.com",
  "codigoPostal": "08001",
  "nombreContacto": "Marta Sánchez",
  "telefonoContacto": "+34600111222",
  "telefonoEmpresa": "+34934123457",
  "admin": {
    "telefono": "+34600000001",
    "email": "marta.admin@globaltech.com",
    "password": "SecurePassword2026!"
  }
}

```


2.2 Obtiene listado de todas las empresas

Método: ```GET```

Endpoint:``` /api/empresa/list-empresas ```

Descripción: ```Lista todas las empresas (con auditoría).```

```
GET  -  http://localhost:3000/api/empresa/list-empresas

Token - SuperAdmin / Admin
Body - none

```

2.3 Obtener una única empresa


Método: ```GET```


Endpoint:``` /api/empresa/:id ```

Descripción: ```Obtiene detalles de una empresa específica.```

```
GET  -  http://localhost:3000/api/empresa/:id

Token - SuperAdmin / Admin
Body - none

```

2.4 Actualizar Empresa


Método: ```PUT```

Endpoint:``` /api/empresa/update/:id ```

Descripción: ```Actualiza datos de geolocalización o razón social.```

```
PUT  -  http://localhost:3000/api/empresa/update/:id

Token - SuperAdmin
Body - Json

{
  "nombre": "Tech Ss",
  "cif": "B12345677",
  "direccion": "Calle Falsa 123",
  "provincia": "Murcia",
  "poblacion": "Murcia",
  "contactoNombre": "Juan Pérez",
  "telefonoContacto": "+34600111233",
  "telefonoEmpresa": "910000004",
  "pais": "España",
  "email": "info@techsolutions.es",
  "isActive": true,
  "admin": {
    "email": "admin@beta.com",
    "telefono": "+34655999888",
    "nombre": "Nombre FALSE",
    "apellidos": "Apellidos Reales"
  }
}

```


2.5 Borrar empresa


Método: ```DELETE```

Endpoint:``` /api/empresa/delete/:id ```

Descripción: ```Elimina la empresa y sus datos vinculados.```

```
DELETE  -  http://localhost:3000/api/empresa/delete/:id

Token - SuperAdmin
Body - none

```

3. Gestión de Usuarios y Trabajadores (Admin)`


3.1 Dar de alta a nuevo Usuario/Trabajador


Método: ```POST```

Endpoint:``` /api/allowed-user ```

Descripción: ```Pre-autoriza a un trabajador para que pueda acceder al sistema.```

``` 
POST  -  http://localhost:3000/api/allowed-user

Token - Admin
Body - Json

{
  "telefono": "600123456",
  "nombre": "Juan",
  "apellidos": "Pérez García",
  "password": "contraseña123",
  "dni": "12345678Z",
  "email": "juan.perez@empresa.com",
  "fechaNacimiento": "1992-03-10",
  "categoria": "Oficial de Primera",
  "actividad": "Construcción",
  "diaPertenece": 1
}

```


3.2 Crear un usuario genérico (Admin o Worker manual)

Método: ```POST```

Endpoint:``` /api/users/crear-user ```

Descripción: ```Crea un usuario desde el panel.```

```
POST  -  http://localhost:3000/api/users/crear-user

Token - Admin
Body - Json

{
  "email": "empleado@empresa.com",
  "password": "Password123!",
  "nombre": "Carlos",
  "apellidos": "Ruiz",
  "rol": "WORKER"
}

```


3.3 Obtener trabajador por ID


Método: ```PATCH```

Endpoint:``` /api/users/:id ```

Descripción: ```Obtiene el trabajador por id (o actualiza según tu configuración anterior).```

```
PATCH  -  http://localhost:3000/api/users/:id

Token - Admin
Body - none (o Json con campos a actualizar)

```


3.4 Asignar Horario a un trabajador

Método: ```PUT```

Endpoint:``` /api/worker/assign-schedule/:id ```

Descripción: ```Asigna un horario predefinido a un trabajador.```

```
PUT  -  http://localhost:3000/api/worker/assign-schedule/:id

Token - Admin
Body - Json

{
  "horarioId": "3"
}

```


3.5 Comprobar visibilidad de empresa (Worker/Admin)

Método: ```GET```

Endpoint:``` /api/empresas ```

Descripción: ```Comprobar si admin solo ve su empresa.```

```
GET  -  http://localhost:3000/api/empresas

Token - Worker / Admin
Body - none

```


3.6 Listar todos los usuarios

Método: ```GET```
Método: ```GET```

Endpoint:``` /api/users/list-users ```

Descripción: ```Lista todos los usuarios (según permisos del admin).```

```
GET  -  http://localhost:3000/api/users/list-users

Token - Admin / SuperAdmin
Body - none

```

3.7 Actualizar un usuario

Método: ```PUT```

Endpoint:``` /api/users/update/:id ```

Descripción: ```Actualiza los datos de un usuario.```

```
PUT  -  http://localhost:3000/api/users/update/:id

Token - Admin
Body - Json

{
  "nombre": "Carlos Modificado",
  "apellidos": "Ruiz Gómez",
  "rol": "WORKER"
}
```

3.8 Eliminar un usuario 

Método: ```DELETE```

Endpoint:``` /api/users/delete/:id ```

Descripción: ```Elimina o desactiva un usuario del panel.```

```
DELETE  -  http://localhost:3000/api/users/delete/:id

Token - Admin
Body - none

```

3.9 Listar todos los trabajadores (Workers)

Método: ```GET```

Endpoint:``` /api/worker/list-workers ```

Descripción: ```Lista todos los trabajadores autorizados de la empresa.```

```
GET  -  http://localhost:3000/api/worker/list-workers

Token - Admin
Body - none

```

3.10 Actualizar Trabajador

Método: ```PUT```

Endpoint:``` /api/worker/update/:id ```

Descripción: ```Actualiza información de la ficha del trabajador.```

```
PUT  -  http://localhost:3000/api/worker/update/:id

Token - Admin
Body - Json

{
  "telefono": "611222333",
  "categoria": "Encargado"
}

```

3.11 Eliminar Trabajador


Método: ```DELETE```

Endpoint:``` /api/worker/delete/:id ```

Descripción: ```Borra un trabajador autorizado del sistema.```

```
DELETE  -  http://localhost:3000/api/worker/delete/:id

Token - Admin
Body - none

```

4. Horarios y Franjas Horarias (Schedules)

4.1 Crear horario

Método: ```POST```

Endpoint:``` /api/schedules ```

Descripción: ```Crea un nuevo horario maestro con sus franjas.```

```
POST  -  http://localhost:3000/api/schedules

Token - Admin
Body - Json

{
  "nombre": "Horario Invierno 2026 - IT",
  "fechaInicio": "2026-01-01",
  "fechaFin": "2026-12-31",
  "tipo": "FIJO",
  "distribuciones": [
    {
      "diaSemana": "LUNES",
      "horasDia": 8.5,
      "franjas": [
        { "inicio": "08:30", "fin": "14:00" },
        { "inicio": "15:00", "fin": "18:00" }
      ]
    },
    {
      "diaSemana": "MIERCOLES",
      "horasDia": 8.5,
      "franjas": [
        { "inicio": "08:30", "fin": "14:00" },
        { "inicio": "15:00", "fin": "18:00" }
      ]
    },
    {
      "diaSemana": "VIERNES",
      "horasDia": 7,
      "franjas": [
        { "inicio": "08:00", "fin": "15:00" }
      ]
    }
  ]
}

```


Gestión de Accesos y PINs (Worker Auth)
1.1 Login de Configuración (Zona Privada)
Método: POST

Endpoint: /api/worker-auth/company-config-login

Descripción: Permite el acceso de los responsables a la zona privada de la tablet para activar o regenerar PINs. Genera un token especial de configuración.

```
HTTP
POST - http://localhost:3000/api/worker-auth/company-config-login

Body - Json
{
  "empresaId": 1,
  "password": "password_de_configuracion_empresa"
}

```

1.2 Activación de PIN de Trabajador
Método: POST

Endpoint: /api/worker-auth/activate-pin

Descripción: Activa el PIN de un trabajador para que pueda empezar a fichar. Este endpoint debe ejecutarse dentro de la zona privada.


```
HTTP
POST - http://localhost:3000/api/worker-auth/activate-pin

Token - Config Mode Token (Paso 1.1)
Body - Json
{
  "dni": "12345678Z"
}

```
1.3 Inicio de Sesión por PIN (Trabajador)
Método: POST

Endpoint: /api/worker-auth/login-pin

Descripción: Punto de entrada para el fichaje rápido del trabajador. Permite obtener el token de acceso usando únicamente el PIN de 6 dígitos.

```
HTTP
POST - http://localhost:3000/api/worker-auth/login-pin

Body - Json
{
  "pin": "123456"
}

```

1.4 Regeneración de PIN de Trabajador
Método: PUT

Endpoint: /api/worker-auth/regenerate-pin

Descripción: Genera un nuevo PIN aleatorio para un trabajador y lo activa automáticamente. Devuelve el PIN en texto plano para ser entregado al empleado.

```
HTTP
PUT - http://localhost:3000/api/worker-auth/regenerate-pin

Token - Admin / Config Mode Token
Body - Json
{
  "dni": "12345678Z"
}


```


4.2 Obtener horario por id

Método: ```GET```

Endpoint:``` /api/schedules/:id ```

Descripción: ```Obtiene los detalles de un horario.```

```
GET  -  http://localhost:3000/api/schedules/:id

Token - Admin / Worker
Body - none


```

4.3 Borrar horario por id

Método: ```DELETE```

Endpoint:``` /api/schedules/:id ```

Descripción: ```Elimina un horario completo del sistema.```

```
DELETE  -  http://localhost:3000/api/schedules/:id

Token - Admin
Body - none

```


4.4 Crear Franja Horaria individual

Método:``` POST ```

Endpoint:``` /api/franja-horaria/crear ```

Descripción: ```Añade una franja a una distribución validando solapamientos.```

```
POST  -  http://localhost:3000/api/franja-horaria/crear

Token - Admin
Body - Json

{
  "distribucionDiaId": 5,
  "inicio": "09:00",
  "fin": "14:00"
}
```

4.5 Listar todas las franjas horarias

Método: ```GET```

Endpoint: ```/api/franja-horaria/list-franja-horaria```

Descripción: ```Lista todas las franjas de la empresa.```

```
GET  -  http://localhost:3000/api/franja-horaria/list-franja-horaria

Token - Admin / Worker
Body - none

```

4.6 Obtener franja por ID

Método: ``` GET ```

Endpoint:``` /api/franja-horaria/find/:id ```

Descripción: ```Busca una franja específica por ID.```

```
GET  -  http://localhost:3000/api/franja-horaria/find/:id

Token - Admin / Worker
Body - none

```

4.7 Actualizar Franja Horaria

Método: ```PUT```

Endpoint:``` /api/franja-horaria/update/:id ```

Descripción: ```Actualiza las horas de inicio o fin de una franja existente.```

```
PUT  -  http://localhost:3000/api/franja-horaria/update/:id

Token - Admin
Body - Json

{
  "inicio": "09:30",
  "fin": "14:30"
}

```

4.8 Eliminar Franja Horaria


Método: ```DELETE```

Endpoint:``` /api/franja-horaria/delete/:id ```

Descripción: ```Elimina una franja del sistema.```

```
DELETE  -  http://localhost:3000/api/franja-horaria/delete/:id

Token - Admin
Body - none

```

4.9 Obtener Franjas por Horario (Schedule)

Método: ```GET```

Endpoint:``` /api/franja-horaria/by-schedule/:id ```

Descripción: ```Lista las franjas vinculadas a un horario (Schedule) específico.```

```
GET  -  http://localhost:3000/api/franja-horaria/by-schedule/:id

Token - Admin / Worker
Body - none

```


5. Control de Jornadas y Asistencias (Workdays)

5.1 Check-in (Entrada)

Método: ```POST```

Endpoint:``` /api/jornadas/check-in ```

Descripción: ```Inicia una jornada evaluando la zona GPS.```

```
POST  -  http://localhost:3000/api/jornadas/check-in

Token - Worker
Body - Json

{
  "latitud": 40.4167,
  "longitud": -3.7037
}

```

5.2 Check-out (Salida)

Método: ```PATCH```

Endpoint:``` /api/jornadas/check-out ```

Descripción: ```Finaliza la jornada activa del trabajador.```

```
PATCH  -  http://localhost:3000/api/jornadas/check-out

Token - Worker
Body - none

```

5.3 Historial de Jornadas

Método: ```GET```

Endpoint:``` /api/jornada/historial ```

Descripción: ```Devuelve todas las jornadas del usuario actual.```

```
GET  -  http://localhost:3000/api/jornada/historial

Token - Worker
Body - none

```

5.4 Crear Asistencia Manual (Attendance)

Método: ```POST```

Endpoint:``` /api/asistencia/crear-asistencia ```

Descripción: ```Registra entrada/ausencia simple con motivo manual.```

```
POST  -  http://localhost:3000/api/asistencia/crear-asistencia

Token - Admin / Worker
Body - Json

{
  "tipo": "ENTRADA",
  "motivo": "Olvido de fichaje desde la app",
  "fecha": "2026-03-02"
}

```


5.5 Estado de la Jornada Actual

Método: ```GET```

Endpoint:``` /api/jornada/status ```

Descripción: ```Indica si el usuario tiene una jornada abierta en este momento.```

```
GET  -  http://localhost:3000/api/jornada/status

Token - Worker
Body - none

```

5.6 Filtrar Jornadas por Rango

Método: ```GET```

Endpoint:``` /api/jornada/rango?desde=X&hasta=Y ```

Descripción: ```Filtra jornadas del usuario en un rango de fechas.```

```
GET  -  http://localhost:3000/api/jornada/rango?desde=2026-03-01&hasta=2026-03-31

Token - Worker
Body - none

```

5.7 Dashboard Resumen de Empresa

Método: ```GET```

Endpoint:``` /api/jornada/dashboard/resumen ```

Descripción: ```Dashboard en tiempo real de los fichajes de la empresa en el día actual.```

```
GET  -  http://localhost:3000/api/jornada/dashboard/resumen

Token - Admin
Body - none

``` 

Completando: Asistencias (Attendance)


5.8 Historial Personal de Asistencias

Método: ```GET```

Endpoint:``` /api/asistencia/my-history ```

Descripción: ```Historial de registros manuales y justificaciones del usuario.```

```
GET  -  http://localhost:3000/api/asistencia/my-history

Token - Worker
Body - none

```

5.9 Historial Global de Empresa

Método: ```GET```

Endpoint:``` /api/asistencia/empresa ```

Descripción: ```Historial de asistencias manuales de todos los empleados.```

```
GET  -  http://localhost:3000/api/asistencia/empresa

Token - Admin
Body - none

```

5.10 Asistencias de un Usuario Específico

Método: ```GET```

Endpoint:``` /api/asistencia/user/:id ```

Descripción: ```Consulta el historial de justificaciones de un trabajador concreto.```

```
GET  -  http://localhost:3000/api/asistencia/user/:id

Token - Admin
Body - none

```

6. Solicitudes y Vacaciones (Requests & Leaves)

6.1 Solicitudes - Solicitar (Worker)

Método: ```POST```

Endpoint:``` /api/solicitudes ```

Descripción: ```Crear solicitud para workers (Vacaciones, Enfermedad, Permiso, Asuntos Propios).```

```
POST  -  http://localhost:3000/api/solicitudes

Token - Worker
Body - Json

{
  "tipo": "ENFERMEDAD",
  "fechaInicio": "2026-10-03",
  "fechaFin": "2026-11-15",
  "motivo": "Vacaciones de verano"
}

```
6.2 Aprobar solicitud - Admin

Método: ```PATCH```

Endpoint:``` /api/request/check/:id ```

Descripción: ```Aprueba o rechaza una solicitud pendiente.```

```
PATCH  -  http://localhost:3000/api/request/check/:id

Token - Admin
Body - Json

{
  "estado": "APROBADA",
  "comentarioAdmin": "Disfruta tus vacaciones"
}

```

6.3 Obtener todas las solicitudes

Método: ```GET```

Endpoint:``` /api/solicitudes/mis-solicitudes ```

Descripción: ```Para ver todas las solicitudes pendientes del usuario.```

```
GET  -  http://localhost:3000/api/solicitudes/mis-solicitudes

Token - Worker
Body - none

```

6.4 Crear Rango de Vacaciones (Admin)

Método: ```POST```

Endpoint:``` /api/leaves/range ```

Descripción: ```Crea permisos aprobados directamente en un rango de fechas.```

```
POST  -  http://localhost:3000/api/leaves/range

Token - Admin
Body - Json

{
  "usuarioId": 12,
  "fechaInicio": "2026-08-01",
  "fechaFin": "2026-08-15",
  "tipo": "VACACIONES",
  "observaciones": "Vacaciones de verano aprobadas"
}

```

6.5 Listar permisos de un trabajador (Admin)

Método: ```GET```

Endpoint:``` /api/leaves/user/:id ```

Descripción: ```Lista los permisos de un trabajador específico.```

```
GET  -  http://localhost:3000/api/leaves/user/12

Token - Admin
Body - none

```

6.6 Obtener solicitudes de la empresa (Admin)

Método: ```GET```

Endpoint:``` /api/request/company-request ```

Descripción: ```Lista todas las solicitudes de la empresa para que el admin las revise.```

```
GET  -  http://localhost:3000/api/request/company-request

Token - Admin
Body - none

```


7. Actividades / Puestos

7.1 Crear Nueva Actividad

Método: ```POST```

Endpoint:``` /api/actividades/crear ```

Descripción: ```Crea un nuevo puesto (ej: Ingeniero, Operario).```

```
POST  -  http://localhost:3000/api/actividades/crear

Token - Admin
Body - Json

{
  "nombre": "Técnico Especialista",
  "descripcion": "Encargado de mantenimiento de maquinaria pesada",
  "tipo": "MANTENIMIENTO",
  "fecha": "2026-03-10"
}

```

7.2 Editar Actividad

Método: ```PUT```

Endpoint:``` /api/actividades/editar/:id ```

Descripción: ```Modifica nombre, descripción o tipo de un puesto.```

```
PUT  -  http://localhost:3000/api/actividades/editar/8

Token - Admin
Body - Json

{
  "nombre": "Técnico Especialista Senior",
  "descripcion": "Liderazgo de equipo de mantenimiento y gestión de recambios"
}

```

7.3 Borrado con Desvinculación

Método: ```DELETE```

Endpoint:``` /api/actividades/delete/:id ```

Descripción: ```Borrado físico de la actividad. Los usuarios asociados pasan a tener actividadId = null.```

```
DELETE  -  http://localhost:3000/api/actividades/delete/8

Token - Admin
Body - none

```


7.4 Catálogo de Actividades

Método: ```GET```

Endpoint:``` /api/actividades/catalogo ```

Descripción: ```Lista de puestos de la empresa disponibles para asignar.```

```
GET  -  http://localhost:3000/api/actividades/catalogo

Token - Admin / Worker
Body - none

```

7.5 Obtener detalle de Actividad

Método: ```GET```

Endpoint:``` /api/actividades/:id ```

Descripción: ```Obtiene el detalle de un puesto y (opcionalmente) sus trabajadores asignados.```

```
GET  -  http://localhost:3000/api/actividades/:id

Token - Admin / Worker
Body - none

```

8. Incidencias y Alarmas (Issues & Alarms)

  NO_ASISTENCIA = 'NO_ASISTENCIA',
  TARDANZA = 'TARDANZA',
  SALIDA_ANTICIPADA = 'SALIDA_ANTICIPADA',
  FALTA_JORNADA = 'FALTA_JORNADA',
  MARCA_IRREGULAR = 'MARCA_IRREGULAR',
  INCUMPLIMIENTO_NORMAS = 'INCUMPLIMIENTO_NORMAS',
  OTRO = 'OTRO',


8.1 Crear una Incidencia

Método: ```POST```

Endpoint:``` /api/incidencias/crear ```

Descripción: ```Reporta una nueva incidencia (Anti-spam 15 min).```

```
POST  -  http://localhost:3000/api/incidencias/crear

Token - Admin / Worker
Body - Json

{
  "tipo": "TECNICO",
  "descripcion": "Fallo en la conexión del terminal de fichaje planta 1",
  "prioridad": "ALTA"
}

```

8.2 Resolver/Actualizar Incidencia

Método: ```PUT```

Endpoint:``` /api/incidencias/resolver/:id ```

Descripción: ```Marca una incidencia como solucionada/resuelta.```

```
PUT  -  http://localhost:3000/api/incidencias/resolver/5

Token - Admin
Body - Json

{
  "descripcion": "Problema con el sistema - Resuelto tras reinicio de router",
  "tipo": "TECNICO",
  "estado": "RESUELTA"
}

```

8.3 Listar Incidencias de la Empresa

Método: ```GET```

Endpoint:``` /api/incidencias/empresa?estado=PENDIENTE ```

Descripción: ```Panel del admin para ver incidencias.```

```
GET  -  http://localhost:3000/api/incidencias/empresa?estado=PENDIENTE

Token - Admin
Body - none


```

8.4 Eliminar Incidencia

Método: ```DELETE```

Endpoint:``` /api/incidencias/:id ```

Descripción: ```Elimina un reporte de incidencia.```

```
DELETE  -  http://localhost:3000/api/incidencias/5

Token - Admin
Body - none

```

8.5 Obtener Alarmas Pendientes

Método: ```GET```

Endpoint:``` /api/alarmas/pendientes ```

Descripción: ```Retorna un array con las alarmas cuyo estado sea 'PENDIENTE' o 'NO_LEIDA' dentro de tu empresa.```

```
GET  -  http://localhost:3000/api/alarmas/pendientes

Token - Admin
Body - none

```

8.6 Marcar como Leída (Rápido)

Método: ```PUT```

Endpoint:``` /api/alarmas/revisar/:id ```

Descripción: ```Cambia el estado de la alarma a 'LEIDA'.```

```
PUT  -  http://localhost:3000/api/alarmas/revisar/42

Token - Admin
Body - none

```

8.7 Resolver Alarma con Nota

Método: ```PUT```

Endpoint:``` /api/alarmas/resolver/:id ```

Descripción: ```Resuelve una alarma añadiendo una nota de gestión.```

```
PUT  -  http://localhost:3000/api/alarmas/resolver/42

Token - Admin
Body - Json

{
  "nota": "Incidencia revisada. El trabajador ya ha sido notificado sobre el cambio de turno."
}

```

```1.``` JSON de dashboard-stats (Vista del Empleado)
Este es el que devuelve el tiempo trabajado en segundos y ya formateado para que no tengas que hacer cálculos en el móvil.

```
JSON
{
  "hoy": {
    "segundos": 15420,
    "formateado": "04:17:00"
  },
  "semana": {
    "segundos": 105600,
    "formateado": "29:20:00"
  },
  "mes": {
    "segundos": 450000,
    "formateado": "125:00:00"
  },
  "isWorking": true
}

```
  segundos: Útil si quieres hacer una barra de progreso (ej: segundos / 28800 para ver el % de la jornada de 8h).

  formateado: Directo para imprimir en un <p> o <span>.

  isWorking: Boolean para saber si el cronómetro debe seguir corriendo visualmente.


```2. ``` JSON de dashboard/resumen (Vista del Administrador)
Este devuelve conteos globales de la empresa para el día de hoy.

```
JSON
{
  "fecha": "24/03/2026",
  "stats": {
    "trabajandoAhora": 12,
    "jornadasFinalizadas": 8,
    "alertasPendientes": 3
  }
}
```

  trabajandoAhora: Número de personas con una jornada abierta en este momento.

  jornadasFinalizadas: Personas que ya hicieron el check-out hoy.

  alertasPendientes: Alarmas de hoy que todavía no han sido revisadas o resueltas por el administrador.