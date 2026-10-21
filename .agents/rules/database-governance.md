# Reglas de Gobernanza de Base de Datos y Migraciones (Supabase)

## 1. Inmutabilidad Estricta de Migraciones SQL
- **Prohibido borrar o renombrar:** Una vez que un archivo `.sql` es creado en `supabase/migrations/` y commiteado, **nunca se debe borrar, renombrar ni modificar su timestamp de prefijo**.
- **Avance hacia adelante:** Cualquier cambio, corrección, nueva columna o ajuste de esquema debe realizarse mediante un **nuevo archivo de migración** cronológico con formato `YYYYMMDDHHMMSS_<descripcion>.sql`.
- **Causa raíz prevenida:** Eliminar o renombrar archivos `.sql` genera desalineación con la tabla interna `supabase_migrations.schema_migrations` de Supabase, provocando el fallo `Remote migration versions not found in local migrations directory`.

## 2. Flujo GitOps y Despliegue Automatizado
- **Cero DDL manual en producción:** Queda prohibido aplicar sentencias DDL estructurales (`ALTER TABLE`, `CREATE TABLE`, `DROP TABLE`) directamente en el editor web de Supabase para cambios permanentes.
- **Ruta de promoción:** Toda migración de datos debe seguir el flujo estándar:
  1. Creación en rama `feature/*` dentro de `supabase/migrations/`.
  2. Pull Request y merge a `dev` (valida y aplica en base de datos DEV: `vsqmstoiexuqndunorio`).
  3. Pull Request y merge de `dev` a `main` (aplica automáticamente en base de datos PROD: `rklxfrwzuwjvnfcdhmei` vía GitHub Actions).

## 3. Protocolo de Conexión en CI/CD (GitHub Actions)
- **Uso obligatorio de Connection Pooling:** En los secretos de GitHub (`SUPABASE_DB_URL_PROD` y `SUPABASE_DB_URL_DEV`), la URI de conexión debe apuntar al **Connection Pooler (Session Mode, puerto 5432)** (ej. `aws-1-sa-east-1.pooler.supabase.com:5432`) y no a la conexión directa IPv6 (`db.<ref>.supabase.co:5432`), para evitar errores de red `ECONNREFUSED` en los runners de GitHub Actions.
- **Percent-Encoding:** Caracteres especiales en la contraseña de base de datos (como `#`, `@`, `%`) deben estar obligatoriamente codificados en URL percent-encoding (ej. `#` -> `%23`).

## 4. Procedimiento de Recuperación ante Desincronización
- Si la CLI de Supabase o GitHub Actions falla con `Remote migration versions not found in local migrations directory`:
  1. Identificar las versiones huérfanas reportadas en el error.
  2. Ejecutar reparación de historial: `npx supabase migration repair --status reverted --db-url "$DB_URL" <versiones_huerfanas>`.
  3. Alinear las migraciones vigentes: `npx supabase migration repair --status applied --db-url "$DB_URL" <versiones_oficiales_ya_creadas>`.
  4. Reejecutar `supabase db push`.
