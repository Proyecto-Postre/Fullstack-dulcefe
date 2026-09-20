---
tipo: api-endpoint
metodo: GET
ruta: /api/cart
autenticacion: true
rol_requerido: USER
estado: deshabilitado
---

# ⚡ `GET` /api/cart

## 🎯 Propósito
Endpoint histórico de consulta de carrito en servidor. 

> [!NOTE]
> Deshabilitado formalmente por [[ADR-006-carrito-cliente-pinia-cookies]]. El carrito de compras opera 100% en cliente con Pinia + Cookies para eliminar latencia y consultas innecesarias.

## 🔐 Requisitos de Seguridad
* **Auth:** 👤 `requireUser(event)`.

## 📥 Request (Payload)
* **Headers:** `Authorization: Bearer <TOKEN>`

## 📤 Response
### ⚠️ `410 Gone` (Deshabilitado)
```json
{
  "error": {
    "code": "CART_API_DISABLED",
    "message": "Cart API is disabled. Cart state is managed on client via Pinia and cookies."
  }
}
```
