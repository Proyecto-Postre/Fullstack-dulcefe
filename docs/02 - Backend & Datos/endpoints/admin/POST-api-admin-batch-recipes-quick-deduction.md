---
tipo: api-endpoint
metodo: POST
ruta: /api/admin/batch-recipes/quick-deduction
autenticacion: true
rol_requerido: ADMIN
modulo: tandas-maestras
fase: 7
relacionado:
  - "[[ADR-008-modelo-tandas-maestras-rendimientos-porcionamiento]]"
---

# ⚡ `POST` /api/admin/batch-recipes/quick-deduction

## 🎯 Propósito
Permite al equipo de taller dar de baja o registrar mermas operativas en piezas (ej. alfajores rotos, tapitas quemadas, porciones de degustación) deduciendo de forma automática y matemáticamente exacta la fracción proporcional de cada materia prima en el kardex contable (`inventory_movements` con tipo `waste_declaration`).

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`
* **Auditoría:** Registra `piece_waste_logs` y `audit_events` (`action: 'batch_recipe.quick_deduction'`).

---

## 📥 Request Body
```json
{
  "product_id": 3,
  "recipe_yield_id": 1,
  "pieces_to_deduct": 12,
  "reason": "Rotura de tapitas al momento del manjar",
  "notes": "Lote horneado turno mañana"
}
```

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "log_id": 42,
    "product_id": 3,
    "pieces_deducted": 12,
    "raw_materials_affected": [
      {
        "raw_material_id": 10,
        "name": "Harina Pastelera Especial",
        "quantity_deducted": 100.0,
        "unit": "g",
        "new_stock": 44900.0
      },
      {
        "raw_material_id": 12,
        "name": "Mantequilla Gloria sin sal",
        "quantity_deducted": 50.0,
        "unit": "g",
        "new_stock": 19950.0
      }
    ],
    "message": "Se registraron 12 piezas de merma y se descontaron los insumos proporcionales."
  }
}
```
