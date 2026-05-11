#!/bin/bash
# 🚀 Entrypoint personalizado para PostgreSQL - Fichaje CTI

set -e

echo "🐳 Iniciando PostgreSQL para Fichaje CTI..."
echo "📍 Base de datos: $POSTGRES_DB"
echo "👤 Usuario: $POSTGRES_USER"
echo "🕐 Timezone: $TZ"

# 🔄 Función para esperar a que PostgreSQL esté listo
wait_for_postgres() {
    echo "⏳ Esperando a que PostgreSQL esté listo..."
    
    # Usar pg_isready si está disponible
    if command -v pg_isready &> /dev/null; then
        until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
            echo "⏳ PostgreSQL no está listo - esperando..."
            sleep 2
        done
    else
        # Alternativa: esperar al socket
        until pg_ctl status -D "$PGDATA" 2>/dev/null; do
            echo "⏳ PostgreSQL no está listo - esperando..."
            sleep 2
        done
    fi
    
    echo "✅ PostgreSQL está listo!"
}

# 📊 Función para mostrar estado de la base de datos
show_database_status() {
    echo "📊 Estado de la base de datos:"
    
    # Mostrar información básica
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        SELECT 
            '📋 Base de Datos: ' || current_database() as info,
            '👤 Usuario Actual: ' || current_user as info,
            '🕐 Fecha y Hora: ' || now() as info,
            '🔢 Versión: ' || version() as info;
        
        -- Mostrar extensiones instaladas
        SELECT 
            '📦 Extensiones Instaladas:' as info;
        
        SELECT extname, extversion 
        FROM pg_extension 
        ORDER BY extname;
EOSQL
}

# 🚨 Función para verificar extensiones críticas
verify_extensions() {
    echo "🔍 Verificando extensiones críticas..."
    
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Verificar extensiones críticas
        DO \$\$
        DECLARE
            extension_missing TEXT;
        BEGIN
            -- Verificar uuid-ossp
            IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
                RAISE EXCEPTION '❌ Extensión uuid-ossp no encontrada';
            END IF;
            
            -- Verificar pgcrypto
            IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
                RAISE EXCEPTION '❌ Extensión pgcrypto no encontrada';
            END IF;
            
            -- Verificar btree_gist
            IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
                RAISE EXCEPTION '❌ Extensión btree_gist no encontrada';
            END IF;
            
            RAISE NOTICE '✅ Todas las extensiones críticas están instaladas';
        END \$\$;
EOSQL
}

# 🎯 Ejecutar el entrypoint original de PostgreSQL
echo "🚀 Ejecutando entrypoint original de PostgreSQL..."
exec docker-entrypoint.sh "$@" &

# Esperar a que PostgreSQL esté listo
wait_for_postgres

# Verificar extensiones
verify_extensions

# Mostrar estado
show_database_status

echo "🎉 PostgreSQL para Fichaje CTI iniciado correctamente!"
echo "🔗 Conexión: postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB"

# Mantener el contenedor corriendo
wait
