# Archivo Histórico de Scripts SQL (DEPRECATED)

> [!WARNING]
> **AVISO DE GOBERNANZA DE BASE DE DATOS (§5.1, §10 Tarea 7):**
> Los archivos `.sql` contenidos en esta carpeta (`docs/sql/`) son **scripts históricos de referencia inicial**.
> **NO deben ejecutarse manualmente ni utilizarse para nuevos despliegues.**
> 
> La **Única Fuente de Verdad (Single Source of Truth - SSOT)** para el esquema y las políticas de base de datos de Dulce Fe se encuentra en el directorio oficial versionado:
> 👉 [`supabase/migrations/`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/)

---

## Tabla de Correspondencia de Migraciones Oficiales (`supabase/migrations/`)

| Orden | Archivo de Migración Oficial | Fase / ADR | Descripción Técnica |
| :---: | :--- | :---: | :--- |
| **01** | [`20260826000001_phase1_security_rls.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260826000001_phase1_security_rls.sql) | Fase 1 / S1-S10 | Habilitación de RLS formal, función `is_admin()`, cierre de vulnerabilidad S4 (`auth.role()`), blindaje S10 con `SET search_path = public, pg_temp`. |
| **02** | [`20260905000001_phase3_tables_and_columns.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260905000001_phase3_tables_and_columns.sql) | Fase 3 / PR-3a | Tabla de idempotencia `checkout_idempotency_keys` (TTL 24h), rate limit `checkout_rate_windows`, auditoría inmutable `audit_events` y kardex `inventory_movements`. |
| **03** | [`20260905000002_phase3_cut_s9_and_rpc_revoke.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260905000002_phase3_cut_s9_and_rpc_revoke.sql) | Fase 3 / S9 | Revocación total de permisos RPC públicos obsoletos y sellado de seguridad de PostgreSQL. |
| **04** | [`20260907000001_phase6_guest_tracking.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260907000001_phase6_guest_tracking.sql) | Fase 6 / ADR-002 (D2) | Soporte de Guest Tracking con `tracking_token` opaco e inmutable para consulta sin login (Ley 29733). |
| **05** | [`20260907000002_phase6_cancellation_reversal.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260907000002_phase6_cancellation_reversal.sql) | Fase 6 / ADR-001 (D1) | Función `revert_order_inventory()` para reversión atómica de stock o declaración de mermas ante cancelaciones. |
| **06** | [`20260907000003_phase6_payment_receipts.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260907000003_phase6_payment_receipts.sql) | Fase 6 / ADR-005 (D5) | Soporte de métodos de pago Yape/Plin/Efectivo, bucket `payment-receipts` y validación de comprobantes en 1-click. |
| **07** | [`20260907000004_phase6_cost_snapshots.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260907000004_phase6_cost_snapshots.sql) | Fase 6 / ADR-008 (D8) | Snapshot inmutable de escandallo de costos (`cost_snapshot`, `total_cost_cents`, `gross_margin_cents`). |
| **08** | [`20260914000001_create_categories_table.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260914000001_create_categories_table.sql) | Refinamiento UI | Tabla `public.categories` con RLS para dinamizar categorías del catálogo de postres. |
