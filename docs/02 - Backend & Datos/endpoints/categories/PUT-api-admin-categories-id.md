---
tipo: api-endpoint
metodo: PUT
ruta: /api/admin/categories/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `PUT` /api/admin/categories/:id

## 🎯 Propósito
Actualiza las propiedades de una categoría existente (nombre, icono Lucide, orden de presentación o estado activo).

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatoria (`requireAdmin(event)`).
* **Auditoría:** Registra `category.write` con `actor_id` y `request_id`.

## 📥 Request Body
```json
{
  "name": "Boxes & Cestas Gourmet",
  "icon": "lucide:gift",
  "sort_order": 3,
  "is_active": true
}
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "boxes-para-regalo",
    "name": "Boxes & Cestas Gourmet",
    "icon": "lucide:gift",
    "sort_order": 3,
    "is_active": true
  }
}
```
