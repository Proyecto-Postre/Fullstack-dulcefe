---
tipo: api-endpoint
metodo: DELETE
ruta: /api/raw-materials/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `DELETE` /api/raw-materials/:id

## 🎯 Propósito
Elimina una materia prima del almacén. Protegido por integridad referencial (no se puede borrar si está en uso en una receta).

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Route Params:** `id` (number, requerido).

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "message": "Insumo eliminado correctamente"
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: No se puede eliminar porque está vinculado a postres en `recipe_items`.
* `403 Forbidden`: Requiere privilegios de administrador.
