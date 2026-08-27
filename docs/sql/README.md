# Archivo Histórico de Scripts SQL (DEPRECATED)

> [!WARNING]
> **AVISO DE GOBERNANZA DE BASE DE DATOS (§5.1, §10 Tarea 7):**
> Los archivos `.sql` contenidos en esta carpeta (`docs/sql/`) son **scripts históricos de referencia inicial**.
> **NO deben ejecutarse manualmente ni utilizarse para nuevos despliegues.**
> 
> La **Única Fuente de Verdad (Single Source of Truth - SSOT)** para el esquema y las políticas de base de datos de Dulce Fe se encuentra en el directorio oficial versionado:
> 👉 [`supabase/migrations/`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/)

---

## Tabla de Correspondencia de Migraciones Oficiales

| Script Histórico (Obsoleto) | Migración Oficial en `supabase/migrations/` | Descripción |
| :--- | :--- | :--- |
| `security_policies.sql`, `admin_policies.sql`, `admin_policies_v2.sql` | [`20260826000001_phase1_security_rls.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260826000001_phase1_security_rls.sql) | Habilitación de RLS formal, cierre de vulnerabilidad S4 (`auth.role()`), blindaje S10 con `SET search_path = public, pg_temp` en `is_admin()` y `handle_new_user()`. |
| `user_profiles.sql` | Integrado en esquema base y migración de seguridad. | Perfiles, direcciones y pedidos. |
| `cart_tables.sql` | **Desactivado (§4, D3)** | El carrito de compras opera 100% en cliente con Pinia + Cookies para invitados. |
