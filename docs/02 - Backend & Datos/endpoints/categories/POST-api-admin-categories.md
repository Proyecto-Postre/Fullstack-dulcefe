---
tipo: api-endpoint
metodo: POST
ruta: /api/admin/categories
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/admin/categories

## 🎯 Propósito
Crea una nueva sección o categoría de productos para el catálogo comercial de Dulce Fe. Genera un slug normalizado si no se especifica un ID y registra el evento en la tabla `audit_events`.

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatoria (`requireAdmin(event)`).
* **Auditoría:** Registra `category.write` con `actor_id` y `request_id`.

## 📥 Request Body
```json
{
  "name": "Boxes para Regalo",
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
    "name": "Boxes para Regalo",
    "icon": "lucide:gift",
    "sort_order": 3,
    "is_active": true
  }
}
```
