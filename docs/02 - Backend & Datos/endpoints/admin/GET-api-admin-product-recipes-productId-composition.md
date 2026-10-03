---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/product-recipes/:productId/composition
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `GET` /api/admin/product-recipes/:productId/composition

## 🎯 Propósito
Devuelve la composición estructural completa de un producto del catálogo para alimentar el modal de configuración de tandas y empaques ([ProductBatchMappingModal.vue](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/admin/ProductBatchMappingModal.vue)). Incluye las tandas maestras vinculadas con sus rendimientos asignados y los materiales de empaque asociados.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "product_id": 3,
    "product_name": "Caja Alfajores Clásicos x12",
    "mappings": [
      {
        "id": 1,
        "recipe_yield_id": 1,
        "portions_consumed": 1.0,
        "yield": {
          "id": 1,
          "output_unit_type": "docena_bocaditos",
          "expected_units_yield": 10,
          "unit_label": "10 docenas",
          "base_recipe": {
            "id": 1,
            "name": "Tanda Masa Alfajores Clásicos"
          }
        }
      }
    ],
    "packaging": [
      {
        "id": 5,
        "raw_material_id": 45,
        "quantity": 1.0,
        "raw_material": {
          "id": 45,
          "name": "Caja Kraft Mediana Dulce Fe",
          "cost_per_unit": 1.20,
          "type": "packaging"
        }
      }
    ]
  }
}
```
