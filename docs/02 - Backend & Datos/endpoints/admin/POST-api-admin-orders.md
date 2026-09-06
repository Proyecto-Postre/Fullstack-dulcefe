---
tipo: api-endpoint
metodo: POST
ruta: /api/admin/orders
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/admin/orders

## 🎯 Propósito
Permite al administrador crear órdenes manuales (ventas en mostrador físico o telefónicas) desde el modal administrativo.
Calcula los precios unitarios oficiales y el total directamente en el servidor utilizando **céntimos enteros**, impidiendo precios inventados por el cliente. **No crea perfiles fantasma** con IDs ficticios en la base de datos (resolviendo la deuda arquitectónica previa).

## 🔐 Requisitos de Seguridad & Cabeceras
* **Auth:** 🔒 `requireAdmin(event)` (JWT de Supabase con `is_admin: true`).
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: Bearer <TOKEN>`
  * `Idempotency-Key: <UUIDv4>` (Opcional; si el cliente no la envía, el servidor genera una automáticamente).
* **Auditoría:** Registra el evento en `audit_events` con `action = 'order.create_admin'`.

---

## 📥 Request (Payload)

```json
{
  "channel": "admin",
  "customer_name": "Luis Alberto Ramos",
  "customer_phone": "998877665",
  "address": "Calle Los Laureles 450",
  "delivery_date": "2026-09-12",
  "delivery_time": "11:00",
  "notes": "Cliente pasará a recoger al local.",
  "profile_id": null,
  "items": [
    { "product_id": 2, "quantity": 1 },
    { "product_id": 4, "quantity": 2 }
  ]
}
```

### Reglas de Validación (Zod DTO):
* `channel`: Valor fijo obligatorio `'admin'`.
* `customer_name`: 2 a 80 caracteres.
* `customer_phone` (opcional): Celular de Perú válido de 9 dígitos.
* `profile_id` (opcional): Si se envía, debe existir previamente en la tabla `profiles` (si no existe, lanza `422 PROFILE_NOT_FOUND`). Prohibido insertar perfiles huérfanos.
* `items`: Array de 1 a 30 elementos con `product_id` y `quantity` entre 1 y 50.

---

## 📤 Response

### ✅ `201 Created`
```json
{
  "request_id": "8f3b2075-8025-41a3-b6d4-3fbb138541aa",
  "order": {
    "id": "7dc1a9e3-2679-450f-90e8-07e594ee16bc",
    "status": "pending",
    "profile_id": null,
    "customer_name": "Luis Alberto Ramos",
    "customer_phone": "998877665",
    "address": "Calle Los Laureles 450",
    "total_amount": "55.00",
    "delivery_date": "2026-09-12",
    "delivery_time": "11:00",
    "notes": "Cliente pasará a recoger al local.",
    "items": [
      {
        "product_id": 2,
        "name": "Pie de Limón Clásico",
        "quantity": 1,
        "price_at_time": "25.00"
      },
      {
        "product_id": 4,
        "name": "Porción Carrot Cake",
        "quantity": 2,
        "price_at_time": "15.00"
      }
    ]
  }
}
```

---

## ❌ Manejo de Errores Comunes

* `400 Bad Request` (`VALIDATION_ERROR`): Canal diferente a `'admin'`, ítems vacíos o cantidades inválidas.
* `401 Unauthorized` (`UNAUTHORIZED`): Sin sesión.
* `403 Forbidden` (`FORBIDDEN`): Usuario no es administrador.
* `409 Conflict` (`IDEMPOTENCY_KEY_REUSED`): Misma clave de idempotencia con contenido distinto.
* `422 Unprocessable Entity` (`PROFILE_NOT_FOUND`): El `profile_id` enviado no existe.
* `422 Unprocessable Entity` (`PRODUCT_NOT_FOUND`): Uno de los `product_id` no existe en el catálogo.
