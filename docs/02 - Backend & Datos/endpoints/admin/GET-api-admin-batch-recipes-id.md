---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/batch-recipes/:id
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
---

# ⚡ `GET` /api/admin/batch-recipes/:id

## 🎯 Propósito
Obtiene el detalle completo de una tanda maestra por su identificador primario (`id`), incluyendo desglose de materias primas con precios vigentes, cálculo de CIF, mano de obra, margen y rendimientos.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tanda Masa Alfajores Clásicos",
    "description": "Rendimiento estándar",
    "cif_percentage": 5.0,
    "labor_cost": 15.0,
    "profit_margin": 45.0,
    "items": [
      {
        "id": 1,
        "raw_material_id": 10,
        "quantity": 1000,
        "raw_material": { "name": "Harina", "unit": "kg", "cost_per_unit": 0.0048 }
      }
    ],
    "yields": [
      {
        "id": 1,
        "output_unit_type": "docena_bocaditos",
        "expected_units_yield": 10,
        "unit_label": "10 docenas"
      }
    ]
  }
}
```
