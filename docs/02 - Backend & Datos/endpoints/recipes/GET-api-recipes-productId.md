---
tipo: api-endpoint
metodo: GET
ruta: /api/recipes/:productId
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/recipes/:productId

## 🎯 Propósito
Obtiene la ficha técnica completa del postre, realizando el cálculo en tiempo real del costo parcial por ingrediente y el costo total de producción según [[formulas-costeo]].

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Route Params:**
  * `productId` (number, requerido): ID del postre a auditar.

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "total_cost": 18.45,
  "data": [
    {
      "id": 101,
      "raw_material_id": 1,
      "name": "Harina Pastelera Especial",
      "unit": "kg",
      "quantity_used": 0.25,
      "cost_per_unit": 4.500000,
      "item_total_cost": 1.1250
    },
    {
      "id": 102,
      "raw_material_id": 8,
      "name": "Mantequilla sin Sal Gloria",
      "unit": "kg",
      "quantity_used": 0.16,
      "cost_per_unit": 18.000000,
      "item_total_cost": 2.8800
    }
  ]
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: Falta el ID del producto.
* `403 Forbidden`: Solo administradores pueden ver escandallos.
