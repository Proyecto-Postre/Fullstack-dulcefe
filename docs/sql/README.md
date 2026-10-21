# Archivo Histórico de Scripts SQL y Catálogo de Migraciones

> [!WARNING]
> **AVISO DE GOBERNANZA DE BASE DE DATOS (§5.1, §10 Tarea 7):**
> Los archivos `.sql` contenidos en esta carpeta (`docs/sql/`) son **scripts históricos de referencia inicial**.
> **NO deben ejecutarse manualmente ni utilizarse para nuevos despliegues.**
> 
> La **Única Fuente de Verdad (Single Source of Truth - SSOT)** para el esquema y las políticas de base de datos de Dulce Fe se encuentra en el directorio oficial versionado:
> 👉 [`supabase/migrations/`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/)

---

## Tabla de Correspondencia de Migraciones Oficiales (`supabase/migrations/`)

| Orden | Archivo de Migración Oficial | Fase / Dominio | Descripción Técnica |
| :---: | :--- | :---: | :--- |
| **01** | [`20260826000001_phase1_security_rls.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260826000001_phase1_security_rls.sql) | Fase 1 / S1-S10 | Habilitación de RLS formal, función `is_admin()`, cierre de vulnerabilidad S4 (`auth.role()`), blindaje S10 con `SET search_path = public, pg_temp`. |
| **02** | [`20260905000001_phase3_tables_and_columns.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260905000001_phase3_tables_and_columns.sql) | Fase 3 / PR-3a | Tabla de idempotencia `checkout_idempotency_keys` (TTL 24h), rate limit `checkout_rate_windows`, auditoría inmutable `audit_events` y kardex `inventory_movements`. |
| **03** | [`20260905000002_phase3_cut_s9_and_rpc_revoke.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260905000002_phase3_cut_s9_and_rpc_revoke.sql) | Fase 3 / S9 | Revocación total de permisos RPC públicos obsoletos y sellado de seguridad de PostgreSQL. |
| **04** | [`20260907000001_phase6_guest_tracking.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260907000001_phase6_guest_tracking.sql) | Fase 6 / ADR-002 (D2) | Soporte de Guest Tracking con `tracking_token` opaco e inmutable para consulta sin login (Ley 29733). |
| **05** | [`20260907000002_phase6_cancellation_reversal.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260907000002_phase6_cancellation_reversal.sql) | Fase 6 / ADR-001 (D1) | Función `revert_order_inventory()` para reversión atómica de stock o declaración de mermas ante cancelaciones. |
| **06** | [`20260907000003_phase6_payment_receipts.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260907000003_phase6_payment_receipts.sql) | Fase 6 / ADR-005 (D5) | Soporte de métodos de pago Yape/Plin/Efectivo, bucket `payment-receipts` y validación de comprobantes en 1-click. |
| **07** | [`20260907000004_phase6_cost_snapshots.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260907000004_phase6_cost_snapshots.sql) | Fase 6 / ADR-008 (D8) | Snapshot inmutable de escandallo de costos (`cost_snapshot`, `total_cost_cents`, `gross_margin_cents`). |
| **08** | [`20260914000001_create_categories_table.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260914000001_create_categories_table.sql) | Refinamiento UI | Tabla `public.categories` con RLS para dinamizar categorías del catálogo de postres. |
| **09** | [`20260921000001_fix_profiles_email_and_signup_trigger.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260921000001_fix_profiles_email_and_signup_trigger.sql) | Auth | Sincronización de email y nombre en trigger `handle_new_user()` sobre `profiles`. |
| **10** | [`20260922152500_create_batch_recipes_and_yields.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260922152500_create_batch_recipes_and_yields.sql) | Fase 7 / ADR-008 | Motor de Tandas Maestras (`base_recipes`, `base_recipe_items`), Rendimientos (`recipe_yields`), Mapeos (`product_recipe_mappings`), Empaques (`product_packaging_items`) y Mermas (`piece_waste_logs`). |
| **11** | [`20260924160000_harden_security_and_fix_search_paths.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260924160000_harden_security_and_fix_search_paths.sql) | Fase 7 / Seguridad | Blindaje `SECURITY DEFINER` con `SET search_path = public` inmutable en todas las funciones y triggers de PostgreSQL. |
| **12** | [`20260924170000_add_type_to_raw_materials.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260924170000_add_type_to_raw_materials.sql) | Fase 7 / Inventario | Clasificación contractual de materias primas entre insumos culinarios (`ingredient`) y materiales de empaque (`packaging`). |
| **13** | [`20261004180000_seed_initial_showcase_products.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20261004180000_seed_initial_showcase_products.sql) | Catálogo / Vitrina | Columnas `description` e `is_featured` en `products` para notas de autor y destacados. |
| **14** | [`20261012160000_link_products_to_categories.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20261012160000_link_products_to_categories.sql) | Catálogo | Columna `category_id` (FK a `categories.id`) e índice para filtrado comercial dinámico. |
| **15** | [`20261013174500_add_shelf_life_to_products.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20261013174500_add_shelf_life_to_products.sql) | Calidad / Consumo | Columna `shelf_life` en `products` para recomendaciones de conservación artesanal. |
| **16** | [`20261020120000_add_portions_and_delivery_options.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20261020120000_add_portions_and_delivery_options.sql) | Cliente / Entregas | Columna `portions` en `products`, y columnas `delivery_mode`, `delivery_slot` y `meeting_point_details` en `orders`. |

---

## Reglas de Gobernanza e Inmutabilidad de Migraciones

1. **Inmutabilidad Absoluta:**
   - Jamás renombrar, borrar ni modificar los prefijos de tiempo (`YYYYMMDDHHMMSS`) de los archivos `.sql` ya commiteados.
   - Cualquier cambio estructural posterior DEBE crearse como una nueva migración que avance hacia adelante.
   - Romper esta regla causa errores de sincronización con `supabase_migrations.schema_migrations` (`Remote migration versions not found in local migrations directory`).

2. **Despliegue Exclusivo por CI/CD (GitOps):**
   - Prohibido ejecutar comandos DDL manuales (`ALTER TABLE`, `CREATE TABLE`) directamente en el editor web de Supabase para producción.
   - Toda migración se promueve mediante Pull Request: `feature/*` -> `dev` (aplica en DEV) -> `main` (aplica en PROD).

3. **Conexión en CI/CD:**
   - Secretos `SUPABASE_DB_URL_PROD` y `SUPABASE_DB_URL_DEV` deben utilizar siempre la URI de **Connection Pooling (Session Mode, puerto 5432)** (`aws-*-*.pooler.supabase.com:5432`).
   - Caracteres especiales de contraseñas deben estar codificados en percent-encoding (ej. `%23`).

4. **Protocolo de Recuperación ante Desincronización de Historial:**
   Si Supabase CLI rechaza el push por versiones remotas no encontradas localmente:
   ```bash
   # 1. Revertir referencias huérfanas en el historial remoto
   npx supabase migration repair --status reverted --db-url "$DB_URL" <VERSIONES_HUERFANAS>

   # 2. Marcar las migraciones oficiales ya aplicadas
   npx supabase migration repair --status applied --db-url "$DB_URL" <VERSIONES_APLICADAS>

   # 3. Aplicar las nuevas pendientes
   npx supabase db push --include-all --db-url "$DB_URL"
   ```
