# ADR-007: Inmutabilidad del Estado Terminal `completed` y Asignación Definitiva de Puntos (Deuda D7)

* **Estado:** Aceptado
* **Fecha:** 2026-09-06
* **Decisores:** Equipo de Arquitectura Dulce Fe
* **Referencia SSOT:** `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` (§7.3, §10.5, §17.4, §20.5 D7)

---

## 1. Contexto y Problema

En el ciclo de vida de un pedido (`pending -> processing -> ready -> completed`), la transición a `completed` representa la entrega física y el cobro final del pedido. En esta transición, el servicio de pedidos otorga los puntos de fidelidad correspondientes al perfil del cliente registrado (`floor(cents / 100)`).

¿Debe permitirse revertir una orden de `completed` hacia `pending` o `cancelled`, y si fuese así, deben deducirse automáticamente los puntos otorgados al cliente?

Permitir "des-completar" pedidos abre vectores de fraude (duplicación o saldo negativo de puntos de fidelidad), corrompe el cierre de caja y dificulta las conciliaciones contables.

---

## 2. Factores Decisivos (Decision Drivers)

1. **Inmutabilidad Financiera:** Los estados terminales de venta no deben ser alterables retrospectivamente.
2. **Prevención de Fraude:** Evitar que un usuario gaste puntos ganados en una orden y luego solicite una reversión de estado para eludir el cobro.
3. **Determinismo del Grafo de Estados:** La máquina de estados debe ser unidireccional y predecible.

---

## 3. Opciones Consideradas

* **Opción A:** Permitir transiciones bidireccionales arbitrarias entre todos los estados y programar lógica de deducción de puntos. *(Descartada por alto riesgo de inconsistencia).*
* **Opción B (Adoptada):** Definir `completed` como estado estrictamente terminal e inmutable. No se permite ninguna transición saliente desde `completed`, y los puntos asignados son definitivos.

---

## 4. Decisión Adoptada

Se adopta la **Opción B**.
1. El estado `completed` es terminal. La API (`PATCH /api/admin/orders/[id]/status`) rechaza con error 409 cualquier intento de mover una orden ya completada.
2. La columna `orders.points_awarded` se fija en `true` y previene cualquier re-otorgamiento.
3. Ante devoluciones o incidentes excepcionales post-entrega, el administrador no altera el registro histórico del pedido: emite una compensación comercial manual o registra un ajuste administrativo documentado.

---

## 5. Consecuencias

### Positivas
* Integridad matemática y contable garantizada al 100%.
* Cero riesgo de bucles de puntos infinitos o saldo negativo accidental en clientes.

### Negativas / Deuda Técnica
* No existe botón en UI para cancelar un pedido que ya fue marcado por error humano como `completed`.

---

## 6. Condiciones de Reapertura

Nunca, salvo que la empresa adopte un sistema contable formal de emisión de Notas de Crédito fiscales electrónicas que exija auditoría tributaria de cancelaciones post-venta.
