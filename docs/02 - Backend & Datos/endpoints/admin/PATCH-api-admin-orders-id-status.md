---
tipo: api-endpoint
metodo: PATCH
ruta: /api/admin/orders/:id/status
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `PATCH` /api/admin/orders/:id/status

## 🎯 Propósito
Permite al administrador realizar la transición de estado de una orden en el tablero de producción (Kanban / KDS).
Garantiza el cumplimiento estricto de la matriz de estados del Plan Maestro (§7.3), ejecuta el **quiebre de inventario** atómico al pasar a `processing` (descontando de `raw_materials` y registrando en `inventory_movements`) y acumula **puntos de lealtad** en `profiles` al alcanzar el estado terminal `completed`.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (JWT de Supabase con `is_admin: true` en `profiles`).
* **Cabeceras:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`.
* **Idempotencia natural:** Si el pedido ya se encuentra en el estado solicitado, devuelve HTTP 200 sin duplicar movimientos ni recalcular puntos.

---

## 🚦 Matriz de Transiciones Permitidas
```text
pending ───► processing ───► ready ───► completed (terminal)
   │               │            │
   └───────────────┴────────────┴─────► cancelled (terminal)
```
* **Prohibido:** Salto hacia adelante sin hornear (ej. `pending` $\rightarrow$ `ready` lanza `409 FORBIDDEN_TRANSITION`).
* **Prohibido:** Reabrir órdenes desde estados terminales (`completed` o `cancelled`).

---

## 📥 Request (Payload)

* **Parámetro URL:** `:id` (UUID de la orden).
* **Body:**
```json
{
  "status": "processing"
}
```

Valores permitidos para `status`: `'processing'`, `'ready'`, `'completed'`, `'cancelled'`.

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "request_id": "c7a9161a-0bf6-466d-bcfd-bb91c953503f",
  "order_id": "e4299b84-4863-4c99-923f-42e5652516fa",
  "from": "pending",
  "to": "processing",
  "inventory_processed": true,
  "points_awarded": false
}
```

---

## ❌ Manejo de Errores Comunes

* `400 Bad Request` (`VALIDATION_ERROR`): El estado no pertenece al enum o el cuerpo no es JSON.
* `401 Unauthorized` (`UNAUTHORIZED`): Sin sesión activa.
* `403 Forbidden` (`FORBIDDEN`): El usuario autenticado no es administrador.
* `404 Not Found` (`NOT_FOUND`): La orden no existe.
* `409 Conflict` (`FORBIDDEN_TRANSITION`): La transición solicitada no está permitida por la matriz.
* `409 Conflict` (`INSUFFICIENT_STOCK`): No hay suficiente stock de materias primas para hornear los postres de la orden.
  * *Detalle para admin:* Devuelve `{ material_id, name, have, need, unit }`. El pedido se mantiene en `pending` sin descontar inventario.
