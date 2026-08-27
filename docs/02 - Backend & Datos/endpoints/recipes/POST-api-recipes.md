---
tipo: api-endpoint
metodo: POST
ruta: /api/recipes
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/recipes

## 🎯 Propósito
Agrega un ingrediente con su cantidad exacta (`quantity_used` en gramos/ml/kg) a la receta técnica de un postre.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
```json
{
  "product_id": 1,
  "raw_material_id": 8,
  "quantity_used": 0.16
}
```

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 102,
      "product_id": 1,
      "raw_material_id": 8,
      "quantity_used": 0.16,
      "created_at": "2026-08-26T16:00:00.000Z"
    }
  ]
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: `product_id`, `raw_material_id` o `quantity_used` ausentes.
* `403 Forbidden`: Permiso denegado.
