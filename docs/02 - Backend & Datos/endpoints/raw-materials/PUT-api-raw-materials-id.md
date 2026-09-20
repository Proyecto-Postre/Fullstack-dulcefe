---
tipo: api-endpoint
metodo: PUT
ruta: /api/raw-materials/:id
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `PUT` /api/raw-materials/:id

## 🎯 Propósito
Actualiza los precios de compra o ajusta el stock disponible tras compras de reposición o mermas.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Route Params:** `id` (number, requerido).
```json
{
  "name": "Mantequilla sin Sal Gloria",
  "unit": "kg",
  "purchase_price": 19.50,
  "purchase_quantity": 1.0,
  "stock": 12.0
}
```

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 8,
    "name": "Mantequilla sin Sal Gloria",
    "unit": "kg",
    "purchase_price": 19.50,
    "purchase_quantity": 1.0,
    "stock": 12.0
  }
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: ID inválido o payload incompleto.
* `404 Not Found`: Insumo no encontrado.
