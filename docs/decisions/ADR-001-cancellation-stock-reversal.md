# ADR-001: Política de Compensación y Reversión de Stock ante Cancelación Post-Processing (Deuda D1)

* **Estado:** Aceptado / Postergado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§10.5, §17.3, §20.5 D1)

---

## 1. Contexto y Problema

Cuando un pedido transiciona al estado `processing` en el sistema (`PATCH /api/admin/orders/[id]/status`), se ejecuta el descuento atómico de materias primas en cocina mediante la función `process_order_inventory` y se generan registros inmutables de tipo `order_consumption` en `inventory_movements`.

Si un cliente o administrador cancela el pedido posteriormente (transición a `cancelled`), surge el dilema operativo:
¿Los insumos descontados (harina, huevos, crema batida, frutas frescas) regresan al inventario disponible, o deben considerarse mermas/insumos ya transformados en taller?

Una reversión automática de stock sin validación de cocina generaría discrepancias críticas entre el inventario contable y el inventario físico real.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Integridad Física del Inventario:** No sumar al stock disponible insumos que ya fueron horneados o alterados físicamente.
2. **Auditoría Inmutable:** Cada movimiento de inventario debe tener un responsable y un motivo contable justificable.
3. **Simplicidad de Fase 3 y 4:** Evitar la introducción de lógica de negocio especulativa en el refactor de arquitectura sin la validación del dueño de pastelería.

---

## 3. Opciones Consideradas

* **Opción A:** Revertir automáticamente las materias primas al stock al cancelar el pedido.
* **Opción B (Adoptada):** No revertir stock automáticamente tras `processing`. La cancelación actualiza el estado de la orden a `cancelled`, pero no genera movimientos reversos (`cancellation_reversal` no existe en el DDL actual).
* **Opción C:** Modal interactivo obligatorio de "Declaración de Mermas" al cancelar.

---

## 4. Decisión Adoptada

Se adopta la **Opción B**. En las fases actuales de refactorización:
1. Una orden en `processing` que se cancela marca `orders.status = 'cancelled'`.
2. No se alteran las existencias en `raw_materials`.
3. Si el insumo aún es recuperable (ej. pedido cancelado antes de hornear), el administrador debe registrar un movimiento compensatorio explícito mediante el endpoint de ajuste manual (`POST /api/raw-materials/[id]` con `type = 'manual_adjustment'` y motivo auditable).

---

## 5. Consecuencias

### Positivas
* Se previene la sobrestimación de insumos inexistentes en bodega.
* Se mantiene la simplicidad del disparador y de `inventory_movements`.

### Negativas / Deuda Técnica
* Requiere intervención manual del administrador de almacén para reingresar insumos si la preparación no había iniciado.

---

## 6. Condiciones de Reapertura

Esta decisión se reabrirá como una feature de producto cuando:
1. El dueño de la pastelería defina las políticas comerciales de mermas y tiempos de tolerancia de cancelación.
2. Se diseñe y apruebe una RPC `reverse_order_inventory` con soporte para motivos de merma (`spoilage`, `recycled_batch`).
