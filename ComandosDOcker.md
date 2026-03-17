
# Ejecución en Local

Limpia lo que haya antes (por seguridad):
-----------------------------------------

    -  docker stop $(docker ps -aq) 2>/dev/null

Cómo lanzarlo todo
------------------

Para levantar los servicios por separado, usa estos comandos:

**Levantar la DB:**
    
    - docker compose -f docker-compose.db.yaml up -d

**Levantar la App:**

    - docker compose -f docker-compose.app.yaml up -d

<br>
<br>
<br>
<br>

# REMOTO

Paso 1: Preparación (En tu PC Local)
-------------------------------------



**Antes de subir nada, asegúrate de que tu código esté "limpio".**

_Git_: **Sube tu código a un repositorio (GitHub, GitLab o Bitbucket). IMPORTANTE: Asegúrate de que los archivos .env estén en el .gitignore. Nunca los subas a Git.**



**Paso 2: Conexión al VPS (SSH)**

Abre tu terminal en Windows (PowerShell o CMD) y entra en tu servidor:

PowerShell
ssh usuario@ip-de-tu-servidor | ssh external@cworker1.cticontrol.com  | Password: *****






# El nuevo flujo de trabajo (Simplificado)

 **Así es como queda tu vida ahora que usas Docker Hub:**

 1. En tu PC (Cuando hagas un cambio):
        
    Solo ejecutas estos comandos (puedes meterlos en un script .bat):
```
    PowerShell  
    docker build -t javierm735/fichaje-backend:{version} .  
    docker push javierm735/fichaje-backend:{version}

```

2. En el VPS (Para actualizar):


    **haces git pull:**
```
    Bash  

    docker pull javierm735/fichaje-backend:{version}
```


# Paso A Paso

    - docker login


# Primero construyes (el punto es importante)

    - docker build -t commac-local .

# Luego etiquetas (NombreLocal -> NombreRemoto)

    - docker tag commac-local javierm735/fichaje-backend:{version}

# Luego subes
    
    - docker push javierm735/fichaje-backend:{version}

# Para descargarlo EN EL SERVER POR SSH

    - docker pull javierm735/fichaje-backend:{version}

# Arrancarlo

    - docker rm -f commac-app # Si ya está arrancado el antiguo
    - docker run -d --name commac-app -p 8080:8020 -p 8003:8003 -p 8004:8004 javierm735/fichaje-backend:{version}

---------------------------------------------------------------------------

# Borrar contenedor corriendo

    - docker rm -f commac-app

# PARA VER LOGS Y RENDIMIENTO:
    
    - htop

# Para ver los logs del COMMAC
    
    - docker logs -f commac-app

# Para ver el rendimiento de contenedores de Docker

    - docker stats

<br>
<br>
<br>
<br>
<br>

# 1. Construye la imagen (asegúrate de estar en la carpeta donde está el Dockerfile)

    - docker build -t javierm735/fichaje-backend:latest .

# 2. Súbela a Docker Hub (esto es lo que "actualiza" la nube)
    - docker push javierm735/fichaje-backend:latest

# 1. Fuerza a Docker a bajar la versión más reciente de la nube

    - docker compose pull

# 2. Levanta todo de nuevo en segundo plano

    - docker compose up -d

# ¿Cómo saber si ahora sí está funcionando?

Una vez que termine el up -d, no intentes ejecutar yarn start:dev (porque el contenedor ya estará usando el puerto 3000). Simplemente mira los logs:

PowerShell
    
    - docker logs -f fichaje-backend-prod



# 1. Subir imagen a Docker Hub
docker push javierm735/fichaje-backend:latest

# 2. En VPS
docker pull javierm735/fichaje-backend:latest
docker compose up -d

# 3. Crear base de datos (solo primera vez)
docker exec postgres_db_prod createdb -U postgres fichaje_cti




# Paso 1: Eliminar contenedor existente
bash
    - docker stop postgres_db_prod
    - docker rm postgres_db_prod

# Paso 2: Crear red (si no existe)

    bash
    - docker network create fichaje-network

# Paso 3: Iniciar PostgreSQL

    bash
    - docker run -d \
    --name postgres_db_prod \
    --restart always \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=mypass \
    -e POSTGRES_DB=fichaje_cti \
    -v postgres_data_prod:/var/lib/postgresql/data \
    --network fichaje-network postgres:14.3

# Paso 4: Esperar a que PostgreSQL esté listo
bash
# Esperar 10-15 segundos o verificar con:

    - docker logs postgres_db_prod

# Paso 5: Iniciar Backend

    bash
    - docker run -d \
    --name fichaje-backend-prod \
    --restart always \
    -p 3000:3000 \
    --network fichaje-network javierm735/fichaje-backend:latest

#Si el backend también existe:

    bash
    - docker stop fichaje-backend-prod
    - docker rm fichaje-backend-prod