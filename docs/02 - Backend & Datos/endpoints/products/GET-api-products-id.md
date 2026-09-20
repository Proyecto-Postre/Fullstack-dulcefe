---
tipo: api-endpoint
metodo: GET
ruta: /api/products/:id
autenticacion: false
rol_requerido: PUBLIC
estado: produccion
---

# ⚡ `GET` /api/products/:id

## 🎯 Propósito
Obtiene la información detallada de un postre específico a partir de su ID para la vista de producto (PDP).

## 🔐 Requisitos de Seguridad
* **Auth:** 🌐 Acceso Público.

## 📥 Request (Payload)
* **Route Params:**
  * `id` (number, requerido): Identificador del producto (ej: `/api/products/12`).

## 📤 Response
### ✅ `200 OK`
```json
{
  "id": 12,
  "name": "Torta Selva Negra 20cm",
  "price": 85.00,
  "stock": 4,
  "image_url": "https://[project].supabase.co/storage/v1/object/public/products/selva-negra.webp",
  "created_at": "2026-08-26T10:00:00.000Z"
}
```

## ❌ Manejo de Errores Comunes
* `400 Bad Request`: El parámetro `id` no es un número válido.
* `404 Not Found`: El producto no existe en la base de datos.
