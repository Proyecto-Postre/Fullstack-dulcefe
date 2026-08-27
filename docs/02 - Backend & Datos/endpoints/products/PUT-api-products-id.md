---
tipo: api-endpoint
metodo: PUT
ruta: /api/products/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `PUT` /api/products/:id

## 🎯 Propósito
Actualiza los datos comerciales (nombre, precio, stock, imagen) de un postre existente.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Route Params:** `id` (number, requerido).
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
```json
{
  "name": "Torta Selva Negra Premium",
  "price": 90.00,
  "stock": 6,
  "image_url": "https://.../selva-negra-v2.webp"
}
```

## 📤 Response
### ✅ `200 OK`
```json
{
  "id": 12,
  "name": "Torta Selva Negra Premium",
  "price": 90.00,
  "stock": 6,
  "image_url": "https://.../selva-negra-v2.webp",
  "created_at": "2026-08-26T10:00:00.000Z"
}
```

## ❌ Manejo de Errores Comunes
* `401 Unauthorized` / `403 Forbidden`: Acceso no autorizado.
* `404 Not Found`: El producto a editar no existe.
