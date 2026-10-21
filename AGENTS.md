# Reglas de Desarrollo — Proyecto Dulce Fe

## 1. Gobernanza de Base de Datos y Migraciones (Supabase)
- **Inmutabilidad de archivos SQL:** Todo archivo en `supabase/migrations/` es estrictamente inmutable. Prohibido renombrar, alterar timestamp o eliminar migraciones ya existentes. Modificaciones de esquema siempre avanzan hacia adelante mediante un nuevo archivo `YYYYMMDDHHMMSS_<nombre>.sql`.
- **Despliegue exclusivo vía GitOps:** Prohibido ejecutar DDL manual (`ALTER TABLE`, `CREATE TABLE`) directamente en el editor web de Supabase para producción. Todo cambio estructural debe pasar por Pull Request hacia `dev` y luego a `main` donde GitHub Actions lo aplica de forma automática y versionada.
- **Conexión en CI/CD:** Secretos `SUPABASE_DB_URL_PROD` y `SUPABASE_DB_URL_DEV` en GitHub deben usar la URI del **Connection Pooler (Session Mode, puerto 5432)** (`aws-*-*.pooler.supabase.com:5432`) para garantizar compatibilidad IPv4 con los runners de GitHub Actions. Contraseñas con caracteres especiales deben codificarse con percent-encoding (ej. `%23`).

## 2. Consulta Obligatoria de Documentación Existente
- Antes de realizar cualquier cambio arquitectónico, modificar tablas o sugerir configuraciones operativas, consultar primero la carpeta `docs/`, especialmente:
  - `docs/sql/README.md` (Catálogo oficial de migraciones).
  - `docs/05 - Operaciones/playbook-operaciones.md` (Playbook operativo de despliegues y secretos).
  - `docs/Dashboard.md` (Índice de la arquitectura y estado del proyecto).

## 3. Calidad y Cero Regresiones
- Mantener la suite de 274 pruebas pasando limpia (`npm test`).
- Todo commit debe pasar validación de `npm run lint`, `npm run typecheck` y compilar con `npm run build`.
- Cero emojis en archivos de código, respuestas técnicas y commits.
