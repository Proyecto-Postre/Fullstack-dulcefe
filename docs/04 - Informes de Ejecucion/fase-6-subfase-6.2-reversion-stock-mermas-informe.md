# Informe de Ejecución — Fase 6 / Subfase 6.2: Reversión Atómica de Stock y Declaración de Mermas (ADR-001 / D1)

**Fecha de Ejecución:** 2026-09-06  
**Rama:** `feat/fase-06-restructuration_proyect`  
**Referencia SSOT:** `docs/decisions/ADR-001-cancellation-stock-reversal.md` y `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.5, §17.3, §20.5 D1)  
**Estado:** ✅ **Completado (10/10 Enterprise)**

---

## 1. Resumen de la Entrega

La **Subfase 6.2** resuelve la **Deuda Técnica D1 (ADR-001)**. Dota al sistema de una función atómica en PostgreSQL y lógica de servicio en Nitro para manejar cancelaciones de pedidos que ya habían iniciado producción (`processing`), permitiendo de manera explícita y auditable:
1. **Reponer físicamente los insumos al stock disponible** (`cancellation_reversal`), o
2. **Registrar formalmente la pérdida como merma de taller** (`waste_declaration`) sin inflar artificialmente el inventario real.

---

## 2. Componentes Implementados

### 2.1 Migración de Base de Datos y RPC Transaccional
* **Archivo:** `supabase/migrations/20260907000002_phase6_cancellation_reversal.sql`
* **Ampliación de Constraint:** Se agregaron los tipos `cancellation_reversal` y `waste_declaration` al enum de `inventory_movements`.
* **Función PostgreSQL `revert_order_inventory`:**
  * Parámetros: `p_order_id UUID`, `p_reason TEXT`, `p_restore_stock BOOLEAN`, `p_actor_id UUID`, `p_request_id TEXT`.
  * `SECURITY DEFINER` con `SET search_path = public`.
  * Itera sobre los movimientos de tipo `order_consumption` vinculados a la orden.
  * Si `p_restore_stock = true`: incrementa `raw_materials.stock` y crea movimiento compensatorio `cancellation_reversal`.
  * Si `p_restore_stock = false`: mantiene el stock intacto y crea movimiento `waste_declaration` para trazabilidad contable.
  * Actualiza la orden a `inventory_processed = false`.
  * Revocada para roles públicos y concedida exclusivamente a `service_role`.

### 2.2 Servicio de Inventario (`InventoryService`)
* **Archivo:** `server/services/inventory.service.ts`
* Nuevo método estático `revertOrderInventory(event, orderId, reason, restoreStock, requestId)`.
* Invocación segura a la RPC con registro de auditoría en `audit_events` (`inventory.reversal` o `inventory.waste`).

### 2.3 Contrato de API y Esquema de Cancelación
* **Archivos:** `server/utils/schemas/admin-order.ts` y `server/api/admin/orders/[id]/status.patch.ts`
* `AdminUpdateOrderStatusSchema` acepta campos opcionales:
  * `cancellation_reason`: string de 3 a 200 caracteres.
  * `restore_stock`: booleano indicando si los insumos vuelven al almacén.
* En `OrderService.updateOrderStatus`, al pasar a `cancelled` una orden con `inventory_processed === true`, se ejecuta automáticamente `InventoryService.revertOrderInventory`.

---

## 3. Verificación de Calidad

* **Pruebas Unitarias:** Nueva suite `tests/unit/cancellation-reversal.test.ts` con 8 pruebas validando:
  * Validación Zod de motivos y banderas.
  * Despacho correcto a reposición vs merma.
  * Inmunidad de pedidos en `pending` (no ejecutan reversión).
  * Inmutabilidad del estado terminal `cancelled`.
* **Total del Proyecto:** **138 / 138 tests pasando** en 23 suites de Vitest.
