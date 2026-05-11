FROM postgres:14.3

LABEL maintainer="javierm735"
LABEL version="1.1"

# 🚩 ELIMINAMOS ENV CON PASSWORDS (se pasan por el .env de compose)
ENV TZ=Europe/Madrid

# 📦 Instalar herramientas útiles
RUN apt-get update && apt-get install -y \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# 📂 Scripts de inicialización (SQL y Shell)
# Estos se ejecutan automáticamente al crear la BD por primera vez
COPY --chown=postgres:postgres init/ /docker-entrypoint-initdb.d/

# 🗄️ Configuración de PostgreSQL
# Es mejor dejar que Postgres use los de la carpeta data o pasarlos via CMD
COPY postgresql.conf /tmp/postgresql.conf
COPY pg_hba.conf /tmp/pg_hba.conf

# 🚀 Exponer puerto
EXPOSE 5432

# Usamos el entrypoint oficial pero podemos pasarle los archivos de config
CMD ["postgres", "-c", "config_file=/tmp/postgresql.conf", "-c", "hba_file=/tmp/pg_hba.conf"]