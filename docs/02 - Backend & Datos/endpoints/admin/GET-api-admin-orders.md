---
tipo: api-endpoint
metodo: GET
ruta: /api/admin/orders
autenticacion: true
rol_requerido: ADMIN
estado: produccion
---

# ⚡ `GET` /api/admin/orders

## 🎯 Propósito
Lista las órdenes del sistema con sus relaciones completas (`profiles`, `order_items` y detalles de `products`). Diseñado para alimentar el tablero Kanban de producción administrativa y el listado de pedidos, prescindiendo de consultas directas de cliente con Supabase.

## 🔐 Requisitos de Seguridad
* **Auth:** 🔒 `requireAdmin(event)` (JWT de Supabase con `is_admin: true` en `profiles`).
* **Cabeceras:** `Authorization: Bearer <TOKEN>`.
* **Ejecución:** Backend seguro utilizando el cliente de Service Role de Supabase en el servidor.

---

## 📥 Request (Query / Headers)
* **Parámetros URL:** Ninguno.
* **Headers:** `Authorization: Bearer <JWT>`

---

## 📤 Response

### ✅ `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "e4299b84-4863-4c99-923f-42e5652516fa",
      "created_at": "2026-09-05T20:30:00.000Z",
      "status": "pending",
      "total_amount": 7500,
      "delivery_date": "2026-09-10",
      "delivery_time": "16:00",
      "notes": "Sin azúcar extra",
      "customer_name": "Juan Pérez",
      "customer_phone": "987654321",
      "profile_id": "01234567-89ab-cdef-0123-456789abcdef",
      "inventory_processed": false,
      "points_awarded": false,
      "profiles": {
        "full_name": "Juan Pérez",
        "phone": "987654321"
      },
      "order_items": [
        {
          "id": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "quantity": 2,
          "price_at_time": 37.5,
          "product_id": 4,
          "products": {
            "name": "Torta de Chocolate Fudge"
          }
        }
      ]
    }
  ]
}
```

---

## ❌ Manejo de Errores Comunes
* `401 Unauthorized` (`UNAUTHORIZED`): Token JWT ausente o expirado.
* `403 Forbidden` (`FORBIDDEN`): El usuario no posee privilegios de administrador.
* `500 Internal Server Error` (`INTERNAL_ERROR`): Fallo interno al consultar la base de datos.
