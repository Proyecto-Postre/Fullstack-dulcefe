---
tipo: api-endpoint
metodo: DELETE
ruta: /api/cart/:productId
autenticacion: true
rol_requerido: USER
estado: deshabilitado
---

# ⚡ `DELETE` /api/cart/:productId

## 🎯 Propósito
Endpoint histórico de remoción de ítems en carrito de servidor. Deshabilitado por [[ADR-006-carrito-cliente-pinia-cookies]].

## 🔐 Requisitos de Seguridad
* **Auth:** 👤 `requireUser(event)`.

## 📥 Request (Payload)
* **Route Params:** `productId` (number, requerido).

## 📤 Response
### ⚠️ `410 Gone`
```json
{
  "error": {
    "code": "CART_API_DISABLED",
    "message": "Cart API is disabled. Cart state is managed on client via Pinia and cookies."
  }
}
```
