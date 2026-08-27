---
tipo: api-endpoint
metodo: POST
ruta: /api/cart
autenticacion: true
rol_requerido: USER
estado: deshabilitado
---

# ⚡ `POST` /api/cart

## 🎯 Propósito
Endpoint histórico de inserción de carrito en servidor. Deshabilitado por [[ADR-006-carrito-cliente-pinia-cookies]].

## 🔐 Requisitos de Seguridad
* **Auth:** 👤 `requireUser(event)`.

## 📥 Request (Payload)
* **Headers:** `Content-Type: application/json`
```json
{
  "product_id": 1,
  "quantity": 2
}
```

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
