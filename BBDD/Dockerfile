# 🐳 Dockerfile para Base de Datos PostgreSQL - Fichaje CTI
# Optimizado para producción con extensiones y configuración inicial

FROM postgres:14.3

# 🏷️ Metadatos
LABEL maintainer="javierm735"
LABEL description="PostgreSQL con extensiones para Fichaje CTI"
LABEL version="1.0"

# 📁 Variables de entorno por defecto
ENV POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=mypass \
    POSTGRES_DB=fichaje_cti \
    TZ=Europe/Madrid

# 📦 Instalar dependencias adicionales
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    vim \
    less \
    && rm -rf /var/lib/apt/lists/*

# 🗄️ Configuración de PostgreSQL
COPY postgresql.conf /etc/postgresql/postgresql.conf
COPY pg_hba.conf /etc/postgresql/pg_hba.conf

# 📂 Scripts de inicialización
COPY --chown=postgres:postgres init/ /docker-entrypoint-initdb.d/

# 📊 Configuración de logging
RUN echo "log_statement = 'all'" >> /etc/postgresql/postgresql.conf && \
    echo "log_destination = 'stderr'" >> /etc/postgresql/postgresql.conf && \
    echo "logging_collector = on" >> /etc/postgresql/postgresql.conf && \
    echo "log_directory = 'log'" >> /etc/postgresql/postgresql.conf && \
    echo "log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'" >> /etc/postgresql/postgresql.conf

# 🗂️ Crear directorios necesarios
RUN mkdir -p /var/log/postgresql && \
    chown postgres:postgres /var/log/postgresql

# 🚀 Exponer puerto
EXPOSE 5432

# 📁 Volume para datos persistentes
VOLUME ["/var/lib/postgresql/data"]

# 🔐 Script de entrada personalizado
COPY --chown=postgres:postgres entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# 🏃 Comando por defecto
CMD ["postgres"]
