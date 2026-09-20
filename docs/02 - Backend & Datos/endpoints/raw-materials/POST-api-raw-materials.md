---
tipo: api-endpoint
metodo: POST
ruta: /api/raw-materials
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `POST` /api/raw-materials

## 🎯 Propósito
Registra una nueva materia prima comprada por volumen con su unidad de medida y precio pagado.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)`.

## 📥 Request (Payload)
* **Headers:** `Content-Type: application/json`, `Authorization: Bearer <TOKEN>`
```json
{
  "name": "Mantequilla sin Sal Gloria",
  "unit": "kg",
  "purchase_price": 18.00,
  "purchase_quantity": 1.0,
  "stock": 5.0
}
```

## 📤 Response
### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 8,
      "name": "Mantequilla sin Sal Gloria",
      "unit": "kg",
      "purchase_price": 18.00,
      "purchase_quantity": 1.0,
      "stock": 5.0,
      "created_at": "2026-08-26T15:00:00.000Z"
    }
  ]
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: Campos `name`, `unit`, `purchase_price` o `purchase_quantity` ausentes.
* `403 Forbidden`: Permiso denegado.
