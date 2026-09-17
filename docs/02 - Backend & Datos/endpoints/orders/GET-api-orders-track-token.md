---
tipo: api-endpoint
metodo: GET
ruta: /api/orders/track/:token
autenticacion: false
rol_requerido: PUBLIC
estado: produccion
---

# ⚡ `GET` /api/orders/track/:token

## 🎯 Propósito
Permite a compradores invitados y registrados consultar el estado en tiempo real de su orden sin necesidad de iniciar sesión, mediante un **token criptográfico HMAC-SHA256** único generado en el momento del checkout ([[ADR-002-guest-order-tracking]]).  
Cumple estrictamente con la **Ley 29733 de Protección de Datos Personales (Perú)**: sanitiza y anonimiza la respuesta pública, ocultando la dirección física completa, el teléfono del cliente y detalles internos de costeo.

## 🔐 Requisitos de Seguridad
* **Auth:** Pública (controlada exclusivamente por posesión del token de 64 caracteres hexadecimales).
* **Validación de Token:** Expresión regular estricta `/^[a-f0-9]{64}$/`. Si no coincide, rechaza inmediatamente con `400 Bad Request`.
* **Privacidad (Zero PII Leakage):** Solo expone nombre de pila anonimizado, estado de la orden, fecha/hora programada de entrega, línea de tiempo pública e ítems comprados (nombre y cantidad).

## 📥 Request

```http
GET /api/orders/track/a3f1c2d9e8b7... (64 hex) HTTP/1.1
Host: dulcefe.pe
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "order_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "processing",
  "status_label": "En Cocina",
  "customer_first_name": "Valeria",
  "delivery_date": "2026-09-18",
  "delivery_time": "16:00 - 18:00",
  "created_at": "2026-09-15T20:00:00Z",
  "items": [
    {
      "product_name": "Torta Tres Leches Clásica",
      "quantity": 1
    }
  ],
  "timeline": [
    { "step": "pending", "label": "Pedido Recibido", "completed": true, "current": false },
    { "step": "processing", "label": "En Cocina", "completed": false, "current": true },
    { "step": "ready", "label": "Listo para Entrega", "completed": false, "current": false },
    { "step": "completed", "label": "Entregado", "completed": false, "current": false }
  ]
}
```

### ❌ `400 Bad Request`
Formato de token no coincide con SHA-256 de 64 caracteres.

### ❌ `404 Not Found`
Token válido pero no asociado a ninguna orden en base de datos.
