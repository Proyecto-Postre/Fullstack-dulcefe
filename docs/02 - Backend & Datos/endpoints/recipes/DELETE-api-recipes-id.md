---
tipo: api-endpoint
metodo: DELETE
ruta: /api/recipes/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `DELETE` /api/recipes/:id

## 🎯 Propósito
Elimina un ingrediente específico de una receta técnica por su ID de relación en `recipe_items`.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Route Params:**
  * `id` (number, requerido): ID del ítem en la tabla `recipe_items`.

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "message": "Ingrediente retirado de la receta"
}
```

## ❌ Manejo de Errores Comunes
* `404 Not Found`: El ítem de receta no existe.
