---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/kds/orders
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/admin/kds/orders

## 🎯 Propósito
Alimenta la pantalla del **Kitchen Display System (KDS)** de taller. Retorna las comandas activas (`pending`, `processing`, `ready`) enriquecidas con la ficha técnica (receta y gramos requeridos) de cada postre para el cálculo automático de lotes y mise en place.

## 🔐 Requisitos de Seguridad
* **Auth:** Obligatorio (`requireAdmin(event)`).
* **Filtro de Estado:** Solo extrae comandas vivas para evitar saturación de memoria en pantallas de cocina.

## 📥 Request

```http
GET /api/admin/kds/orders HTTP/1.1
Host: dulcefe.pe
Authorization: Bearer <JWT_ADMIN>
```

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "c1d2e3f4-a5b6-7890-abcd-ef1234567890",
      "customer_name": "Carlos Mendoza",
      "status": "processing",
      "delivery_date": "2026-09-16",
      "delivery_time": "15:00 - 18:00",
      "created_at": "2026-09-15T18:30:00Z",
      "notes": "Escribir 'Feliz Día Mamá' en chocolate.",
      "items": [
        {
          "id": 101,
          "product_id": 4,
          "product_name": "Torta Tres Leches",
          "quantity": 2,
          "ingredients": [
            {
              "material_id": 1,
              "material_name": "Harina Pastelera",
              "unit": "gr",
              "quantity_per_unit": 250,
              "total_required": 500
            }
          ]
        }
      ]
    }
  ]
}
```
