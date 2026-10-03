---
tipo: api-endpoint
metodo: POST
ruta: /api/admin/product-recipes/mapping
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `POST` /api/admin/product-recipes/mapping

## 🎯 Propósito
Configura y guarda el mapeo completo de un postre del catálogo con sus tandas maestras asociadas (`product_recipe_mappings`) y sus ítems de packaging/empaque desacoplados (`product_packaging_items`).

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`
* **Auditoría:** Registra `product_recipe_mapping.save` en `audit_events`.

---

## 📥 Request Body
```json
{
  "product_id": 3,
  "mappings": [
    {
      "recipe_yield_id": 1,
      "portions_consumed": 1.0
    }
  ],
  "packaging": [
    {
      "raw_material_id": 45,
      "quantity": 1.0
    },
    {
      "raw_material_id": 48,
      "quantity": 0.5
    }
  ]
}
```

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "product_id": 3,
    "mappings_count": 1,
    "packaging_count": 2,
    "updated_at": "2026-09-24T14:30:00Z"
  }
}
```
