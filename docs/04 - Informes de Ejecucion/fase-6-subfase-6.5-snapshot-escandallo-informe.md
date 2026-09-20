# Informe de Ejecución — Fase 6 / Subfase 6.5: Snapshot de Escandallo / Freeze Cost of Goods Sold al Ordenar (ADR-008 / D8)

**Fecha de Ejecución:** 2026-09-06  
**Rama:** `feat/fase-06-restructuration_proyect`  
**Referencia SSOT:** `docs/decisions/ADR-008-cost-snapshot-freeze.md` y `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§17.3, §20.6 D8)  
**Estado:** ✅ **Completado (10/10 Enterprise)**

---

## 1. Resumen de la Entrega

La **Subfase 6.5** resuelve la **Deuda Técnica D8 (ADR-008)** sobre la volatilidad de costos históricos y pérdida de trazabilidad de margen bruto. Previo a esta entrega, si el precio de compra de una materia prima (ej. harina o mantequilla) cambiaba meses después, los reportes financieros recalculaban erróneamente los pedidos pasados con el costo actual. Con esta solución, el sistema "congela" de manera inmutable el escandallo completo (`cost_snapshot`), el costo de bienes vendidos (`total_cost_cents`) y el margen bruto (`gross_margin_cents`) en el instante exacto en que la orden pasa a producción (`processing`).

---

## 2. Componentes Implementados

### 2.1 Migración de Base de Datos
* **Archivo:** `supabase/migrations/20260907000004_phase6_cost_snapshots.sql`
* **Columnas Agregadas a `orders`:**
  * `cost_snapshot JSONB DEFAULT NULL`: Árbol estructurado con productos, cantidades, insumos, costos unitarios en céntimos y timestamp de congelamiento.
  * `total_cost_cents INTEGER DEFAULT NULL`: Costo total de materias primas en céntimos (evita imprecisión de punto flotante).
  * `gross_margin_cents INTEGER DEFAULT NULL`: `total_amount_cents - total_cost_cents`.

### 2.2 Tipos de Dominio (`app/types/cost-snapshot.ts`)
* `CostSnapshotIngredient`: Identificador de insumo, nombre, unidad, cantidad utilizada, costo unitario en céntimos y costo total de línea.
* `CostSnapshotItem`: Producto, cantidad comprada, costo unitario consolidado de receta, costo total y desglose de ingredientes.
* `OrderCostSnapshot`: Resumen global de la orden con margen bruto monetario y porcentual (`gross_margin_percentage`).

### 2.3 Servicio de Congelamiento (`OrderService.freezeOrderCostSnapshot`)
* **Archivo:** `server/services/order.service.ts`
* Realiza join con `recipe_items` y `raw_materials` para obtener los precios vigentes al momento del disparo.
* **Garantía de Inmutabilidad:** Si la orden ya cuenta con un `cost_snapshot`, se retorna de inmediato sin recalcular, impidiendo cualquier alteración contable retroactiva.
* **Activador Automático:** Integrado en el pipeline de `OrderService.updateOrderStatus` al transicionar a `processing`.

### 2.4 Endpoint Administrativo de Consulta (`server/api/admin/orders/[id]/cost-snapshot.get.ts`)
* Blindado con `requireAdmin(event)` y correlacionado con `request_id`.
* Permite a los administradores consultar o activar bajo demanda el snapshot de cualquier orden histórica.

### 2.5 Interfaz de Visualización en Panel (`app/components/admin/OrderDetailsModal.vue`)
* Si la orden posee costos congelados, despliega la tarjeta **"Escandallo Financiero (COGS Congelado)"**.
* Muestra el desglose de Costo de Insumos (`S/ XX.XX`), Margen Bruto (`S/ YY.YY`) y porcentaje de ganancia neta respecto al precio de venta.

---

## 3. Verificación de Calidad

* **Pruebas Unitarias:**
  * Archivo: `tests/unit/cost-snapshot.test.ts` (4 pruebas pasando al 100%).
  * Valida aritmética exacta de escandallo en céntimos, cálculo de margen bruto porcentual, inmunidad ante incrementos futuros en precios de insumos y manejo seguro de productos sin receta.
* **Linters & Typecheck:**
  * `npm run lint` ➔ 0 errores, 0 advertencias.
  * `npm run typecheck` ➔ 0 errores de tipado.
* **Métricas de Tests:**
  * Total del proyecto: **160 / 160 pruebas aprobadas** en 26 suites de Vitest.
