---
tipo: api-endpoint
metodo: DELETE
ruta: /api/products/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `DELETE` /api/products/:id

## 🎯 Propósito
Elimina un postre del catálogo. En cascada elimina automáticamente sus vínculos en `recipe_items`.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Route Params:** `id` (number, requerido).
* **Headers:** `Authorization: Bearer <TOKEN>`

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "message": "Producto eliminado exitosamente"
}
```

## ❌ Manejo de Errores Comunes
* `403 Forbidden`: Requiere rol de administrador.
* `404 Not Found`: Producto no encontrado.
