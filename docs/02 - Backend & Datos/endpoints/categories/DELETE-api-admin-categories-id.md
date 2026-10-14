---
tipo: api-endpoint
metodo: DELETE
ruta: /api/admin/categories/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `DELETE` /api/admin/categories/:id

## 🎯 Propósito
Elimina una categoría del sistema. Gracias a la restricción `ON DELETE SET NULL`, los productos asociados a esta categoría pasarán a no tener categoría asignada sin ser borrados ni causar errores de integridad referencial.

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatoria (`requireAdmin(event)`).
* **Auditoría:** Registra `category.write` con `actor_id` y `request_id`.

## 📥 Request
```http
DELETE /api/admin/categories/boxes-para-regalo HTTP/1.1
Host: dulcefe.pe
Authorization: Bearer <ADMIN_TOKEN>
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true
}
```
