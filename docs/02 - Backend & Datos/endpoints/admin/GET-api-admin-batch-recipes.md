---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/batch-recipes
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `GET` /api/admin/batch-recipes

## 🎯 Propósito
Recupera el listado completo de recetas de tandas maestras registradas en taller (`base_recipes`), incluyendo sus insumos con costo calculado (`base_recipe_items`), sus presentaciones y rendimientos esperados (`recipe_yields`), así como los productos del catálogo actualmente vinculados a cada presentación.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (JWT con `is_admin = true`).
* **Headers:** `Authorization: Bearer <TOKEN>`

---

## 📥 Request
* **Query Params:** Ninguno.
* **Headers:** `Authorization: Bearer <JWT>`

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tanda Masa Alfajores Clásicos",
      "description": "Rendimiento estándar para tapitas medianas de 5cm",
      "cif_percentage": 5.0,
      "labor_cost": 15.0,
      "profit_margin": 45.0,
      "items": [
        {
          "id": 1,
          "base_recipe_id": 1,
          "raw_material_id": 10,
          "quantity": 1000,
          "raw_material": {
            "id": 10,
            "name": "Harina Pastelera Especial",
            "unit": "kg",
            "cost_per_unit": 0.0048,
            "stock": 45000,
            "type": "ingredient"
          }
        }
      ],
      "yields": [
        {
          "id": 1,
          "base_recipe_id": 1,
          "output_unit_type": "docena_bocaditos",
          "expected_units_yield": 10,
          "unit_label": "10 docenas (120 tapitas)",
          "cost_per_piece": 1.95,
          "linked_products": [
            {
              "product_id": 3,
              "product_name": "Caja Alfajores Clásicos x12",
              "portions_consumed": 1
            }
          ]
        }
      ],
      "total_ingredients_cost": 14.50,
      "total_cost": 30.23
    }
  ]
}
```
