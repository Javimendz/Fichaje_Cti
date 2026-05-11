-- 🗄️ Extensiones PostgreSQL - Fichaje CTI
-- Este script se ejecuta automáticamente al iniciar el contenedor

-- Extensiones para UUID y criptografía
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensiones para manejo de tiempo y fechas
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Extensión para búsqueda de texto completo (útil para búsquedas)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Extensiones PostgreSQL inicializadas correctamente';
END $$;
