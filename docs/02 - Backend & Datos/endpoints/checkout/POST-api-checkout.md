---
tipo: api-endpoint
metodo: POST
ruta: /api/checkout
autenticacion: false
rol_requerido: PUBLIC_OR_AUTHENTICATED
estado: produccion
---

# ⚡ `POST` /api/checkout

## 🎯 Propósito
Crea una orden de compra transaccional en el servidor. Soporta tanto compradores invitados (*guest checkout*) como usuarios autenticados.
Calcula los precios unitarios y el total oficial directamente desde la base de datos (PostgreSQL), trabajando en **céntimos enteros** para evitar errores de coma flotante. Protegido contra ataques de duplicación mediante **llaves de idempotencia** y mitigación de abuso con **rate limit por IP**.

## 🔐 Requisitos de Seguridad & Cabeceras
* **Auth:** Opcional (si existe sesión de Supabase Auth, se asocia el pedido al `profile_id`; si no hay sesión, se registra como `guest` con `profile_id = null`).
* **Headers requeridos:**
  * `Content-Type: application/json`
  * `Idempotency-Key: <UUIDv4>` (Obligatorio. Llave única de 24h generada por el cliente).
* **Headers opcionales:**
  * `X-Request-Id: <UUIDv4>` (Si no se envía, el servidor genera uno y lo inyecta en la respuesta).
* **Defensa CSRF / Origin:** Valida que el header `Origin` coincida con la URL oficial de la aplicación (`siteUrl` o preview autorizada de Vercel).
* **Rate Limiting:** Máximo 10 peticiones por ventana de 15 minutos por dirección IP.

## 📥 Request (Payload)

```json
{
  "channel": "direct",
  "customer_name": "Valeria Gómez",
  "customer_phone": "987654321",
  "address": "Av. Las Palmeras 123, Dpto 402",
  "delivery_date": "2026-09-10",
  "delivery_time": "16:00",
  "notes": "Dejar en portería por favor.",
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

### Reglas de Validación (Zod DTO):
* `channel`: `'direct'` o `'whatsapp_chat'`.
* `customer_name`: 2 a 80 caracteres.
* `customer_phone`: Obligatorio si `channel = 'direct'`. Debe cumplir formato peruano de 9 dígitos que comience con 9 (ej. `987654321` o `+51987654321`).
* `address`: Obligatorio si `channel = 'direct'`. Entre 5 y 200 caracteres.
* `delivery_date` (opcional): Formato `YYYY-MM-DD`.
* `delivery_time` (opcional): Formato `HH:mm`.
* `notes` (opcional): Máximo 500 caracteres. No debe duplicar PII sensible.
* `items`: Array de 1 a 30 elementos. Cada elemento requiere `product_id` numérico y `quantity` entre 1 y 50.
* **Precios:** El cliente **no** envía precios; cualquier valor de precio enviado en el cuerpo es ignorado por el servidor.

---

## 📤 Response

### ✅ `201 Created` (Nueva orden creada) o `200 OK` (Reintento idempotente)
```json
{
  "request_id": "b18dc862-28e7-4972-886f-ea901cb00940",
  "order": {
    "id": "e4299b84-4863-4c99-923f-42e5652516fa",
    "status": "pending",
    "profile_id": null,
    "customer_name": "Valeria Gómez",
    "customer_phone": "987654321",
    "address": "Av. Las Palmeras 123, Dpto 402",
    "delivery_date": "2026-09-10",
    "delivery_time": "16:00",
    "notes": "Dejar en portería por favor.",
    "total_amount": "45.00",
    "created_at": "2026-09-05T20:45:00.000Z",
    "items": [
      {
        "product_id": 1,
        "name": "Porción Torta de Chocolate Húmeda",
        "quantity": 2,
        "price_at_time": "15.00"
      },
      {
        "product_id": 3,
        "name": "Porción Tres Leches Tradicional",
        "quantity": 1,
        "price_at_time": "15.00"
      }
    ]
  }
}
```

---

## ❌ Manejo de Errores Comunes
Formato unificado: `{ error: { code, message, request_id, details? } }`

* `400 Bad Request` (`IDEMPOTENCY_KEY_REQUIRED`): Falta la cabecera `Idempotency-Key`.
* `400 Bad Request` (`VALIDATION_ERROR`): Fallo de validación en esquema Zod (ej. teléfono inválido, nombre vacío, ítems vacíos).
* `403 Forbidden` (`FORBIDDEN`): Cabecera `Origin` no autorizada.
* `409 Conflict` (`IDEMPOTENCY_IN_PROGRESS`): Petición concurrente simultánea con la misma llave aún en proceso de base de datos (cabecera `Retry-After: 2`).
* `409 Conflict` (`IDEMPOTENCY_KEY_REUSED`): Misma `Idempotency-Key` utilizada pero con diferente contenido del pedido.
* `422 Unprocessable Entity` (`PRODUCT_NOT_FOUND` / `PRODUCT_UNAVAILABLE`): Uno de los productos no existe o no está publicado.
* `429 Too Many Requests` (`RATE_LIMITED`): Se superó el límite de 10 pedidos cada 15 minutos desde la misma IP.
