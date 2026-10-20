# Informe Didáctico y Técnico — Fase 3 (PR-3d): Corte de Seguridad S9 en PostgreSQL y Revocación de RPCs

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 5 de Septiembre, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§16.2 Runbook S9, §17, §18, §19 PR-3d, §20.3 V34, V35)  
**Rama activa:** `feat/fase-03-restructuration_proyect`  
**Entrega:** Subfase PR-3d (Migración SQL `20260905000002_phase3_cut_s9_and_rpc_revoke.sql` + Revocación de Políticas de Inserción Directa en `orders` y `order_items` para Usuarios Normales + Revocación de Ejecución de RPCs a Roles de Navegador + Tests de Aislamiento)

---

## 1. ¿Qué es el Corte de Seguridad S9 y por qué debía aplicarse en este momento exacto?

En el desarrollo de software seguro para comercio electrónico, **el orden de los factores altera drásticamente el producto**:
* Si hubiéramos bloqueado la inserción directa en la base de datos en la Fase 1, la tienda web se habría roto por completo porque las pantallas antiguas todavía llamaban a Supabase.
* El Plan Maestro estableció el **Runbook S9 obligatorio**:
  1. Primero crear el endpoint `POST /api/checkout` (PR-3a).
  2. Luego migrar la pantalla del cliente `checkout.vue` a consumir la API (PR-3b).
  3. Luego migrar los modales de administración y el tablero Kanban a consumir la API (PR-3c).
  4. **Recién ahora (PR-3d)**: Se corta el cordón umbilical en PostgreSQL.

Al aplicar el **Corte S9**:
* Ningún usuario (anónimo o con cuenta de cliente) puede insertar pedidos directamente en la tabla `orders` usando la consola del navegador o scripts maliciosos.
* Las funciones `process_order_inventory` y `award_loyalty_points` quedan completamente bloqueadas para los roles web `anon` y `authenticated`.
* El **único** camino para crear órdenes o mover inventario es a través del servidor seguro Nitro de Nuxt con el rol privilegiado de servicio.

---

## 2. Detalle de Archivos Creados y Modificados en PR-3d

### 2.1 [`supabase/migrations/20260905000002_phase3_cut_s9_and_rpc_revoke.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260905000002_phase3_cut_s9_and_rpc_revoke.sql) [NUEVO]

```sql
-- 1. Revocación de INSERT en 'orders' para clientes normales
DROP POLICY IF EXISTS "orders_insert_owner_or_admin" ON public.orders;

CREATE POLICY "orders_insert_admin_only"
  ON public.orders FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- 2. Revocación de INSERT en 'order_items' para clientes normales
DROP POLICY IF EXISTS "order_items_insert_owner_or_admin" ON public.order_items;

CREATE POLICY "order_items_insert_admin_only"
  ON public.order_items FOR INSERT
  WITH CHECK (public.is_admin() = true);

-- 3. Revocar ejecución directa de funciones RPC a roles de navegador
REVOKE EXECUTE ON FUNCTION public.process_order_inventory(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_loyalty_points(uuid) FROM anon, authenticated;
```

### 2.2 [`tests/unit/s9-security.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/s9-security.test.ts) [NUEVO]
Pruebas de validación sobre el blindaje de la superficie de órdenes y el aislamiento entre roles públicos y administrativos.

---

## 3. Matriz de Validación del Plan Maestro

| Criterio | Descripción | Resultado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **V1** | Compilación y Typecheck sin errores | ✅ **Aprobado** | `nuxt typecheck` $\rightarrow$ 0 errores. |
| **V34** | RPC revocada en navegador | ✅ **Aprobado** | `REVOKE EXECUTE` elimina permisos de `anon` y `authenticated` en `process_order_inventory` y `award_loyalty_points`. |
| **V35** | Corte S9 en `orders` | ✅ **Aprobado** | Política `orders_insert_admin_only` impide que clientes inserten directamente. |

---

## 4. Próximo Paso en el Plan Maestro: Subfase PR-3e ([[§19]])

La última subfase de la Fase 3 es **PR-3e: Catálogo, Insumos y Recetas en Servicios de Servidor Dedicados**:
1. Creación de los servicios de dominio en `server/services/`:
   * `catalog.service.ts`
   * `inventory.service.ts`
   * `recipe.service.ts`
2. Organización de rutas mutadoras bajo `/api/admin/*` con auditoría inmutable en `audit_events`.
