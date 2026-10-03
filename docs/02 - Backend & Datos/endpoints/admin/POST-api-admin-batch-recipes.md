---
tipo: api-endpoint
metodo: POST
ruta: /api/admin/batch-recipes
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `POST` /api/admin/batch-recipes

## 🎯 Propósito
Crea de manera atómica una nueva tanda maestra de taller con sus ingredientes base y sus rendimientos físicos de presentación.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`
* **Auditoría:** Registra evento en `audit_events` (`action: 'batch_recipe.create'`).

---

## 📥 Request Body
```json
{
  "name": "Tanda Brownies Fudge Americano",
  "description": "Lata completa horneada a 170°C por 25 min",
  "cif_percentage": 5.0,
  "labor_cost": 20.0,
  "profit_margin": 50.0,
  "items": [
    { "raw_material_id": 5, "quantity": 500 },
    { "raw_material_id": 12, "quantity": 400 },
    { "raw_material_id": 8, "quantity": 300 }
  ],
  "yields": [
    {
      "output_unit_type": "porcion_individual",
      "expected_units_yield": 24,
      "unit_label": "24 cuadraditos de 5x5cm"
    },
    {
      "output_unit_type": "ciento_bocaditos",
      "expected_units_yield": 1,
      "unit_label": "100 bocaditos mini"
    }
  ]
}
```

---

## 📤 Response

### ✅ `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Tanda Brownies Fudge Americano",
    "items_count": 3,
    "yields_count": 2,
    "created_at": "2026-09-24T10:00:00Z"
  }
}
```
